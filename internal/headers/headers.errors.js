export class MalformedHeadersError extends Error {
  constructor() {
    super("Malformed headers");
  }
}
