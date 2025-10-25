import { Writable } from "stream";
import { Headers } from "../headers/headers.js";

export class Response {
  #stream;

  static StatusCode = Object.freeze({
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
  });

  /**
   *
   * @param {number} contentLength
   * @returns {Headers}
   */
  static getDefaultHeaders(contentLength) {
    const headers = new Headers();

    headers.set("Content-Length", contentLength.toString());
    headers.set("Connection", "close");
    headers.set("Content-Type", "text/plain");

    return headers;
  }

  /**
   *
   * @param {Writable} stream
   */
  constructor(stream) {
    this.#stream = stream;
  }

  /**
   *
   * @param {number} statusCode
   */
  writeStatusLine(statusCode) {
    let reasonPhrase = "";

    switch (statusCode) {
      case Response.StatusCode.OK:
        reasonPhrase = "OK";
        break;
      case Response.StatusCode.BAD_REQUEST:
        reasonPhrase = "Bad request";
        break;
      case Response.StatusCode.OK:
        reasonPhrase = "Internal Server Error";
        break;
      default:
        break;
    }

    this.#stream.write(`HTTP/1.1 ${statusCode} ${reasonPhrase}\r\n`);
  }

  /**
   *
   * @param {Headers} headers
   */
  writeHeaders(headers) {
    headers.forEach(([key, value]) => {
      this.#stream.write(`${key}: ${value}\r\n`);
    });

    this.#stream.write("\r\n");
  }
}
