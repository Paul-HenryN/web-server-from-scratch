export class Headers {
  #headersObj = {};

  /**
   * Parses Http headers from a string input
   * @param {string} input
   * @returns {Headers}
   */
  static parse(input) {}

  /**
   * Returns the header value associated with
   * a particular key
   * @param {string} key
   * @returns {string}
   */
  get(key) {
    return this.#headersObj[key];
  }
}
