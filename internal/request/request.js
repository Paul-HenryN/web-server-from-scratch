import { Readable } from "stream";

export class RequestLine {
  #httpVersion = "";
  #requestTarget = "";
  #method = "";

  constructor({ httpVersion = "", requestTarget = "", method = "" }) {
    this.#httpVersion = httpVersion;
    this.#requestTarget = requestTarget;
    this.#method = method;
  }

  getHttpVersion() {
    return this.#httpVersion;
  }

  getRequestTarget() {
    return this.#requestTarget;
  }

  getMethod() {
    return this.#method;
  }
}

export class Request {
  #requestLine = new RequestLine();

  getRequestLine() {
    return this.#requestLine;
  }
}

/**
 *
 * @param {Readable} stream
 * @returns {Request}
 */
export function getRequestFromStream(stream) {}
