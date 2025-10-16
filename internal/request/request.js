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
   * @throws {InvalidMethodError}
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
   * @throws {UnsupportedHttpVersionError}
   */
  static validateHttpVersionString(input) {
    if (input !== "HTTP/1.1") {
      throw new UnsupportedHttpVersionError(input);
    }

    return input;
  }

  get httpVersion() {
    return this.#httpVersion;
  }

  get requestTarget() {
    return this.#requestTarget;
  }

  get method() {
    return this.#method;
  }
}

export class Request {
  #requestLine;

  constructor({ requestLine }) {
    this.#requestLine = requestLine;
  }

  get requestLine() {
    return this.#requestLine;
  }
}

/**
 *
 * @param {string} str
 * @returns {RequestLine}
 * @throws {MalformedRequestLineError}
 * @throws {InvalidMethodError}
 * @throws {UnsupportedHttpVersionError}
 */
function parseRequestLine(str) {
  const parts = str.split(" ");

  if (parts.length !== 3) {
    throw new MalformedRequestLineError();
  }

  const method = RequestLine.validateHttpMethod(parts[0]);
  const requestTarget = parts[1];
  const httpVersionString = RequestLine.validateHttpVersionString(parts[2]);

  const httpVersion = httpVersionString.split("/")[1];

  return new RequestLine({ method, requestTarget, httpVersion });
}

/**
 *
 * @param {Readable} stream
 * @returns {Promise<Request>}
 * @throws {MalformedRequestLineError}
 * @throws {InvalidMethodError}
 * @throws {UnsupportedHttpVersionError}
 */
export async function getRequestFromStream(stream) {
  const input = String((await stream.toArray())[0]);

  const parts = input.split(SEPARATOR);

  const requestLine = parseRequestLine(parts[0]);

  return new Request({
    requestLine,
  });
}
