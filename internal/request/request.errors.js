export class MalformedRequestLineError extends Error {
  constructor() {
    super("Malformed request line");
  }
}

export class InvalidMethodError extends Error {
  constructor(method) {
    super(`Invalid http method: ${method}`);
  }
}

export class UnsupportedHttpVersionError extends Error {
  constructor(version) {
    super(`Unsupported http version: ${version}`);
  }
}
