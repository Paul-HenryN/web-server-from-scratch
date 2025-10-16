import { Readable } from "stream";
import {
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors";

const SEPARATOR = "\r\n";

export class RequestLine {
  static VALID_HTTP_METHODS = ["GET", "POST"];

  #httpVersion = "";
  #requestTarget = "";
  #method = "";

  constructor({ httpVersion = "", requestTarget = "", method = "" }) {
    this.#httpVersion = httpVersion;
    this.#requestTarget = requestTarget;
    this.#method = method;
  }

  /**
   *
   * @param {string} input
   * @returns {string}
   */
  static validateHttpMethod(input) {
    if (!this.VALID_HTTP_METHODS.includes(input)) {
      throw new InvalidMethodError(input);
    }

    return input;
  }

  /**
   *
   * @param {string} input
   * @returns {string}
   */
  static validateHttpVersionString(input) {
    if (input !== "HTTP/1.1") {
      throw new UnsupportedHttpVersionError(input);
    }

    return input;
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
  #requestLine;

  constructor({ requestLine }) {
    this.#requestLine = requestLine;
  }

  getRequestLine() {
    return this.#requestLine;
  }
}

/**
 *
 * @param {string} str
 * @returns {RequestLine}
 */
function parseRequestLine(str) {
  const parts = str.split(" ");

  if (parts.length != 3) {
    throw new MalformedRequestLineError();
  }

  const method = RequestLine.validateHttpMethod(parts[0]);
  const requestTarget = parts[1];
  const httpVersionString = RequestLine.validateHttpVersionString(parts[2]);

  const [_, httpVersion] = httpVersionString.split("/");

  return new RequestLine({ method, requestTarget, httpVersion });
}

/**
 *
 * @param {Readable} stream
 * @returns {Promise<Request>}
 */
export async function getRequestFromStream(stream) {
  const input = String((await stream.toArray())[0]);

  const parts = input.split(SEPARATOR);

  const requestLine = parseRequestLine(parts[0]);

  return new Request({
    requestLine,
  });
}
