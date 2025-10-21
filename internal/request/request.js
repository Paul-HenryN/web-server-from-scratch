import { Readable } from "stream";
import {
  EndOfStreamError,
  InvalidBodyError,
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors.js";
import { Headers } from "../headers/headers.js";

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
   * @typedef RequestLineParseResponse
   * @property {?RequestLine} requestLine
   * @property {number} charsRead
   *
   *
   * Parses a requestLine from a string input.
   * The input might be an incomplete HTTP request line
   * @param {string} input
   * @returns {RequestLineParseResponse}
   * @throws {MalformedRequestLineError}
   * @throws {InvalidMethodError}
   * @throws {UnsupportedHttpVersionError}
   */
  static from(input) {
    const lineTerminatorIdx = input.indexOf(Request.SEPARATOR);

    if (lineTerminatorIdx === -1) {
      return { requestLine: null, charsRead: 0 };
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

    return {
      requestLine: new RequestLine({ method, requestTarget, httpVersion }),
      charsRead: lineTerminatorIdx + Request.SEPARATOR.length,
    };
  }
}

export class Request {
  static SEPARATOR = "\r\n";

  static RequestState = Object.freeze({
    INIT: Symbol("init"),
    PARSING_HEADERS: Symbol("parsing_headers"),
    PARSING_BODY: Symbol("parsing_body"),
    DONE: Symbol("done"),
  });

  #requestLine;
  #headers;
  #body;
  #state;

  constructor({ requestLine } = { requestLine: null }) {
    this.#requestLine = requestLine;
    this.#headers = new Headers();
    this.#state = Request.RequestState.INIT;
    this.#body = null;
  }

  get requestLine() {
    return this.#requestLine;
  }

  get state() {
    return this.#state;
  }

  get headers() {
    return this.#headers;
  }

  get body() {
    return this.#body;
  }

  /**
   *
   * @param {string} data
   * @returns {number} The number of chars consumed from input
   */
  parse(data) {
    switch (this.state) {
      case Request.RequestState.INIT:
        const { requestLine, charsRead: charsReadFromRequestLine } =
          RequestLine.from(data);

        if (requestLine) {
          this.#requestLine = requestLine;
          this.#state = Request.RequestState.PARSING_HEADERS;
        }

        return charsReadFromRequestLine;
      case Request.RequestState.PARSING_HEADERS:
        const { headers, charsRead: charsReadFromHeader } = Headers.from(data);

        if (headers) {
          this.#headers = headers;
          this.#state = Request.RequestState.PARSING_BODY;
        }

        return charsReadFromHeader;
      case Request.RequestState.PARSING_BODY:
        if (!this.headers.has("content-length")) {
          this.#body = "";
          this.#state = Request.RequestState.DONE;

          return 0;
        }

        const contentLength = Number.parseInt(
          this.headers.get("content-length")
        );

        if (data.length > contentLength) {
          throw new InvalidBodyError(
            "Body length does not match the content-length header"
          );
        }

        if (data.length < contentLength) {
          return 0;
        }

        this.#body = data;
        this.#state = Request.RequestState.DONE;

        return data.length;
      case Request.RequestState.DONE:
        throw new Error("Trying to read in done state");
      default:
        throw new Error("Unknown state");
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
    let totalCharsRead = 0;

    const request = new Request();

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        buffer += chunk.toString();

        try {
          let charsRead;

          while (charsRead !== 0) {
            charsRead = request.parse(buffer.slice(totalCharsRead));

            totalCharsRead += charsRead;

            if (request.state === Request.RequestState.DONE) {
              stream.destroy();
              resolve(request);
            }
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
