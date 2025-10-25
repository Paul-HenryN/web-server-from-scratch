import {
  InvalidHeaderNameError,
  MalformedHeadersError,
} from "./headers.errors.js";
import { Request } from "../request/request.js";

export class Headers {
  #headersObj = {};

  /**
   * @typedef ParseHeadersResponse
   * @property {?Headers} headers
   * @property {number} charsRead
   *
   * @param {string} input
   * @returns {ParseHeadersResponse}
   * @throws {MalformedHeadersError}
   * @throws {InvalidHeaderNameError}
   */
  static from(input) {
    const headers = new Headers();
    const { done, charsRead } = headers.parse(input);

    if (done) {
      return { headers, charsRead };
    }

    return { headers: null, charsRead: 0 };
  }

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
   * @throws {InvalidHeaderNameError}
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

      let headerName = Headers.validateHeaderName(
        line.slice(0, delimiterIdx).trimStart()
      );

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
  static validateHeaderName(input) {
    if (input.length === 0) {
      throw new InvalidHeaderNameError();
    }

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
    const headerName = key.toLowerCase();

    if (headerName in this.#headersObj) {
      this.#headersObj[headerName] += `,${value}`;
    } else {
      this.#headersObj[headerName] = value;
    }
  }

  /**
   *
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return key.toLowerCase() in this.#headersObj;
  }

  /**
   *
   * @param {([key, value]: [string, string]) => void} callbackFn
   */
  forEach(callbackFn) {
    Object.entries(this.#headersObj).forEach(callbackFn);
  }

  /**
   *
   * @param {string} key
   */
  remove(key) {
    delete this.#headersObj[key];
  }

  /**
   *
   * @param {string} key
   * @param {string} value
   */
  replace(key, value) {
    this.#headersObj[key.toLowerCase()] = value;
  }

  entries() {
    return Object.entries(this.#headersObj);
  }
}
