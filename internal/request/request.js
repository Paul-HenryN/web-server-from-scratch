import { Readable } from "stream";
import {
  EndOfStreamError,
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors.js";

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

  /**
   * Parses a requestLine from a string input.
   * The input might be an incomplete HTTP request line
   * @param {string} input
   * @returns {?RequestLine} Returns RequestLine if complete, null if incomplete
   * @throws {MalformedRequestLineError}
   * @throws {InvalidMethodError}
   * @throws {UnsupportedHttpVersionError}
   */
  static from(input) {
    const lineTerminatorIdx = input.indexOf(Request.SEPARATOR);

    if (lineTerminatorIdx === -1) {
      return null;
    }

    const requestLineStr = input.slice(0, lineTerminatorIdx);
    const parts = requestLineStr.split(" ");

    if (parts.length !== 3) {
      throw new MalformedRequestLineError();
    }

    const method = RequestLine.validateHttpMethod(parts[0]);
    const requestTarget = parts[1];
    const httpVersionString = RequestLine.validateHttpVersionString(parts[2]);
    const httpVersion = httpVersionString.split("/")[1];

    return new RequestLine({ method, requestTarget, httpVersion });
  }
}

export class Request {
  static SEPARATOR = "\r\n";

  static RequestState = Object.freeze({
    INIT: Symbol("init"),
    DONE: Symbol("done"),
  });

  #requestLine;
  #state;

  constructor({ requestLine } = { requestLine: null }) {
    this.#requestLine = requestLine;
    this.#state = Request.RequestState.INIT;
  }

  get requestLine() {
    return this.#requestLine;
  }

  get state() {
    return this.#state;
  }

  /**
   *
   * @param {string} data
   * @returns
   */
  parse(data) {
    if (this.state === Request.RequestState.DONE) {
      throw new Error("Trying to read in done state");
    } else if (this.state !== Request.RequestState.INIT) {
      throw new Error("Unknown state");
    }

    const requestLine = RequestLine.from(data);

    if (requestLine) {
      this.#requestLine = requestLine;
      this.#state = Request.RequestState.DONE;
    }
  }

  /**
   *
   * @param {Readable} stream
   * @returns {Promise<Request>}
   * @throws {MalformedRequestLineError}
   * @throws {InvalidMethodError}
   * @throws {UnsupportedHttpVersionError}
   * @throws {EndOfStreamError}
   */
  static async fromStream(stream) {
    let buffer = "";
    const request = new Request();

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        buffer += chunk.toString();

        try {
          request.parse(buffer);

          if (request.state === Request.RequestState.DONE) {
            stream.destroy();
            resolve(request);
          }
        } catch (e) {
          reject(e);
        }
      });

      stream.on("end", () => {
        if (request.state !== Request.RequestState.DONE) {
          reject(new EndOfStreamError());
        }
      });

      stream.on("error", reject);
    });
  }
}
