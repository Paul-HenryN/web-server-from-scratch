import {
  InvalidHeaderNameError,
  MalformedHeadersError,
} from "./headers.errors";
import { Request } from "../request/request.js";

export class Headers {
  #headersObj = {};

  /**
   * @typedef ParseResponse
   * @property {number} charsRead
   * @property {boolean} done
   *
   * Parses Http headers from a string input.
   * The input might be incomplete.
   * @param {string} input
   * @returns {ParseResponse}
   * @throws {MalformedHeadersError}
   */
  parse(input) {
    let charsRead = 0;
    let done = false;

    while (true) {
      const lineTerminatorIdx = input.indexOf(Request.SEPARATOR, charsRead);

      if (lineTerminatorIdx === -1) {
        break;
      }

      if (lineTerminatorIdx === charsRead) {
        done = true;
        charsRead = lineTerminatorIdx + Request.SEPARATOR.length;
        break;
      }

      const line = input.slice(charsRead, lineTerminatorIdx);
      const delimiterIdx = line.indexOf(":");

      if (delimiterIdx === -1) {
        throw new MalformedHeadersError();
      }

      if (line[delimiterIdx - 1] === " ") {
        throw new MalformedHeadersError();
      }

      let headerName = line.slice(0, delimiterIdx).trimStart().toLowerCase();
      headerName = this.validateHeaderName(headerName);

      const headerValue = line.slice(delimiterIdx + 1).trim();

      this.set(headerName, headerValue);
      charsRead = lineTerminatorIdx + Request.SEPARATOR.length;
    }

    return { charsRead, done };
  }

  /**
   *
   * @param {string} input
   * @returns {string}
   * @throws {InvalidHeaderNameError}
   */
  validateHeaderName(input) {
    const regex = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/;

    if (!regex.test(input)) {
      throw new InvalidHeaderNameError(input);
    }

    return input;
  }

  /**
   * Returns the header value associated with
   * a particular key
   * @param {string} key
   * @returns {string}
   */
  get(key) {
    return this.#headersObj[key.toLowerCase()];
  }

  /**
   * Sets the header value associated with
   * a particular key
   * @param {string} key
   * @param {string} value
   */
  set(key, value) {
    this.#headersObj[key] = value;
  }
}
