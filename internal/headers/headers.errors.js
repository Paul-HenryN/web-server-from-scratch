export class MalformedHeadersError extends Error {
  constructor() {
    super("Malformed headers");
  }
}

export class InvalidHeaderNameError extends Error {
  constructor(headerName) {
    super(`Invalid header name: ${headerName}`);
  }
}
