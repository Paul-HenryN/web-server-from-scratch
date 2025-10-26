import { Writable } from "stream";
import { Headers } from "../headers/headers.js";

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
   * @param {string} body
   */
  async #writeBody(body) {
    await this.#write(body);
  }

  /**
   *
   * @param {Headers} headers
   * @param {*} body
   */
  async #send(headers, body) {
    await this.#writeStatusLine(this.#statusCode);
    await this.#writeHeaders(headers);
    await this.#writeBody(body);
  }

  /**
   *
   * @param {string} chunk
   * @returns {number}
   */
  async #writeChunkedBody(chunk) {
    const chunkSize = Buffer.byteLength(chunk, "utf-8");
    const chunkSizeHex = chunkSize.toString(16);

    await this.#write(`${chunkSizeHex}\r\n${chunk}\r\n`);

    return chunkSize;
  }

  /**
   * @returns {number}
   */
  async #writeChunkedBodyDone() {
    this.#write("0\r\n\r\n");
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
   * @param {string} data
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
