import { test } from "vitest";
import { Readable } from "stream";
import { expect } from "vitest";
import {
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors";
import { Request } from "./request";
import { describe } from "vitest";

/**
 * Creates a readable stream that emits data in randomly-sized chunks with delays
 * @param {string} data - The complete data to emit
 * @param {number} chunkSize - Minimum chunk size in bytes
 * @param {number} delayMs - Delay between chunks in milliseconds
 * @returns {Readable}
 */
export function createChunkedStream(data, chunkSize = 10, delayMs = 5) {
  let index = 0;

  return new Readable({
    read() {
      if (index >= data.length) {
        // Signal end of stream
        this.push(null);
        return;
      }

      if (chunkSize === -1) {
        this.push(data);
        return;
      }

      setTimeout(() => {
        const chunk = data.slice(index, index + chunkSize);
        index += chunkSize;
        this.push(chunk);
      }, delayMs);
    },
  });
}

describe("Request line parsing", () => {
  test("should parse GET Request line correctly", async () => {
    const stream = createChunkedStream(
      "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      35
    );

    const request = await Request.fromStream(stream);
    expect(request).toBeDefined();
    const requestLine = request.requestLine;
    expect(requestLine.method).toBe("GET");
    expect(requestLine.requestTarget).toBe("/");
    expect(requestLine.httpVersion).toBe("1.1");

    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should parse GET Request line in one chunk correctly", async () => {
    const stream = createChunkedStream(
      "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      -1
    );

    const request = await Request.fromStream(stream);
    expect(request).toBeDefined();
    const requestLine = request.requestLine;
    expect(requestLine.method).toBe("GET");
    expect(requestLine.requestTarget).toBe("/");
    expect(requestLine.httpVersion).toBe("1.1");

    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should parse POST Request line correctly", async () => {
    const stream = createChunkedStream(
      "POST / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      20
    );
    const request = await Request.fromStream(stream);
    expect(request).toBeDefined();
    const requestLine = request.requestLine;
    expect(requestLine.method).toBe("POST");
    expect(requestLine.requestTarget).toBe("/");
    expect(requestLine.httpVersion).toBe("1.1");

    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should parse GET Request line with path correctly", async () => {
    const stream = createChunkedStream(
      "GET /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      1
    );
    const request = await Request.fromStream(stream);
    expect(request).toBeDefined();
    const requestLine = request.requestLine;
    expect(requestLine.method).toBe("GET");
    expect(requestLine.requestTarget).toBe("/coffee");
    expect(requestLine.httpVersion).toBe("1.1");

    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should parse POST Request line with path correctly", async () => {
    const stream = createChunkedStream(
      "POST /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      10
    );
    const request = await Request.fromStream(stream);

    expect(request).toBeDefined();
    const requestLine = request.requestLine;
    expect(requestLine.method).toBe("POST");
    expect(requestLine.requestTarget).toBe("/coffee");
    expect(requestLine.httpVersion).toBe("1.1");

    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should throw MalformedRequestLineError when invalid number of parts in request line", async () => {
    const stream = createChunkedStream(
      "/coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      5
    );

    await expect(Request.fromStream(stream)).rejects.toThrow(
      MalformedRequestLineError
    );
  });

  test("should throw InvalidHttpMethod when method is invalid", async () => {
    const stream = createChunkedStream(
      "TRY /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      8
    );

    await expect(Request.fromStream(stream)).rejects.toThrow(
      InvalidMethodError
    );
  });

  test("should throw UnsupportedHttpVersion when http version is not supported", async () => {
    const stream = createChunkedStream(
      "GET /coffee HTTP/3\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      16
    );

    await expect(Request.fromStream(stream)).rejects.toThrow(
      UnsupportedHttpVersionError
    );
  });
});

describe("Headers parsing", () => {
  test("should parse headers correctly", async () => {
    const stream = createChunkedStream(
      "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
      3
    );

    const request = await Request.fromStream(stream);

    expect(request.headers.get("host")).toBe("localhost:42069");
    expect(request.headers.get("user-agent")).toBe("curl/7.81.0");
    expect(request.headers.get("accept")).toBe("*/*");
    expect(request.state).toBe(Request.RequestState.DONE);
  });

  test("should throw when header name is invalid", async () => {
    const stream = createChunkedStream(
      "GET / HTTP/1.1\r\nHost localhost:42069\r\n\r\n",
      3
    );

    await expect(Request.fromStream(stream)).rejects.toThrow();
  });

  test("should correctly parse with empty headers", async () => {
    const stream = createChunkedStream("GET / HTTP/1.1\r\n\r\n", 2);

    const request = await Request.fromStream(stream);

    expect(request).toBeDefined();
    expect(request.state).toBe(Request.RequestState.DONE);
  });
});

describe("Body parsing", () => {
  test("should parse body correctly", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" +
        "Host: localhost:42069\r\n" +
        "Content-Length: 13\r\n" +
        "\r\n" +
        "hello world!\n",
      3
    );

    const request = await Request.fromStream(stream);

    expect(request.body).toBeDefined();
    expect(request.body).toBe("hello world!\n");
  });

  test("should throw error when body is shorter than indicated in headers", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" +
        "Host: localhost:42069\r\n" +
        "Content-Length: 20\r\n" +
        "\r\n" +
        "partial content",
      3
    );

    await expect(Request.fromStream(stream)).rejects.toThrow();
  });

  test("should throw error when body is longer than indicated in headers", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" +
        "Host: localhost:42069\r\n" +
        "Content-Length: 5\r\n" +
        "\r\n" +
        "partial content",
      5
    );

    await expect(Request.fromStream(stream)).rejects.toThrow();
  });

  test("should parse correctly when body is empty and content-length is 0", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" +
        "Host: localhost:42069\r\n" +
        "Content-Length: 0\r\n" +
        "\r\n",
      3
    );

    const request = await Request.fromStream(stream);

    expect(request.body).toBeDefined();
    expect(request.body).toBe("");
  });

  test("should parse correctly when body is empty and content-length is absent", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" + "Host: localhost:42069\r\n\r\n",
      3
    );

    const request = await Request.fromStream(stream);

    expect(request.body).toBeDefined();
    expect(request.body).toBe("");
  });

  test("should ignore body when content-length is absent", async () => {
    const stream = createChunkedStream(
      "POST /submit HTTP/1.1\r\n" +
        "Host: localhost:42069\r\n" +
        "\r\n" +
        "partial content",
      3
    );

    const request = await Request.fromStream(stream);

    expect(request.body).toBeDefined();
    expect(request.body).toBe("");
  });
});
