import { Readable, Writable } from "stream";
import { Headers } from "../headers/headers.js";
import crypto from "crypto";

export class Response {
  #stream;
  #statusCode;

  static StatusCode = Object.freeze({
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    NOT_FOUND: 404,
  });

  /**
   *
   * @param {Writable} stream
   */
  constructor(stream) {
    this.#stream = stream;
    this.#statusCode = Response.StatusCode.OK;
  }

  /**
   * @param {number} statusCode
   */
  status(statusCode) {
    this.#statusCode = statusCode;
    return this;
  }

  /**
   *
   * @param {number} contentLength
   * @returns {Headers}
   */
  static #getDefaultHeaders(contentLength) {
    const headers = new Headers();

    headers.set("Content-Length", contentLength.toString());
    headers.set("Connection", "close");
    headers.set("Content-Type", "text/plain");

    return headers;
  }

  /**
   *
   * @param {number} contentLength
   * @returns {Headers}
   */
  static #getDefaultStreamingheaders() {
    const headers = new Headers();

    headers.set("Transfer-Encoding", "chunked");
    headers.set("Connection", "close");
    headers.set("Content-Type", "text/plain");

    return headers;
  }

  /**
   *
   * @param {string} data
   */
  async text(data) {
    const headers = Response.#getDefaultHeaders(Buffer.byteLength(data));
    headers.replace("Content-Type", "text/plain");

    await this.#send(headers, data);
  }

  /**
   *
   * @param {string} data
   */
  async html(data) {
    const headers = Response.#getDefaultHeaders(Buffer.byteLength(data));
    headers.replace("Content-Type", "text/html");

    await this.#send(headers, data);
  }

  /**
   *
   * @param {Readable} readableStream
   */
  async stream(readableStream, contentType = "text/plain") {
    const headers = Response.#getDefaultStreamingheaders();
    headers.set("Trailer", "X-Content-SHA256, X-Content-Length");
    headers.replace("Content-Type", contentType);

    await this.#writeStatusLine(this.#statusCode);
    await this.#writeHeaders(headers);

    const chunks = [];
    const hash = crypto.createHash("sha256");

    for await (const chunk of readableStream) {
      hash.update(chunk);
      await this.#writeChunkedBody(chunk);
      chunks.push(chunk);
    }
    await this.#writeChunkedBodyDone();

    const buffer = Buffer.concat(chunks);

    const trailers = new Headers();
    trailers.set("X-Content-SHA256", hash.digest("hex"));
    trailers.set("X-Content-Length", buffer.length.toString());
    await this.#writeTrailers(trailers);
  }

  /**
   *
   * @param {number} statusCode
   */
  async #writeStatusLine(statusCode) {
    let reasonPhrase = "";

    switch (statusCode) {
      case Response.StatusCode.OK:
        reasonPhrase = "OK";
        break;
      case Response.StatusCode.BAD_REQUEST:
        reasonPhrase = "Bad Request";
        break;
      case Response.StatusCode.INTERNAL_SERVER_ERROR:
        reasonPhrase = "Internal Server Error";
        break;
      case Response.StatusCode.NOT_FOUND:
        reasonPhrase = "Not Found";
        break;
      default:
        break;
    }

    await this.#write(`HTTP/1.1 ${statusCode} ${reasonPhrase}\r\n`);
  }

  /**
   *
   * @param {Headers} headers
   */
  async #writeHeaders(headers) {
    for (const [key, value] of headers.entries()) {
      await this.#write(`${key}: ${value}\r\n`);
    }
    await this.#write("\r\n");
  }

  /**
   *
   * @param {Buffer} body
   */
  async #writeBody(body) {
    await this.#write(body);
  }

  /**
   *
   * @param {Headers} headers
   * @param {Buffer} body
   */
  async #send(headers, body) {
    await this.#writeStatusLine(this.#statusCode);
    await this.#writeHeaders(headers);
    await this.#writeBody(body);
  }

  /**
   *
   * @param {Buffer} chunk
   * @returns {Promise<number>}
   */
  async #writeChunkedBody(chunk) {
    const chunkSizeHex = chunk.length.toString(16);

    await this.#write(`${chunkSizeHex}\r\n`);
    await this.#write(chunk);
    await this.#write("\r\n");

    return chunk.length;
  }

  /**
   * @returns {Promise<void>}
   */
  async #writeChunkedBodyDone() {
    await this.#write("0\r\n\r\n");
  }

  /**
   *
   * @param {Headers} trailers
   */
  async #writeTrailers(trailers) {
    for (const [key, value] of trailers.entries()) {
      await this.#write(`${key}: ${value}\r\n`);
    }

    await this.#write("\r\n");
  }

  /**
   *
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  async #write(data) {
    return new Promise((resolve, reject) => {
      if (this.#stream.destroyed || !this.#stream.writable) {
        // Socket already closed, silently fail
        resolve();
        return;
      }

      this.#stream.write(data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
