import { test } from "vitest";
import { getRequestFromStream } from "./request";
import { Readable } from "stream";
import { expect } from "vitest";
import {
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors";

/**
 * Creates a readable stream that emits data in randomly-sized chunks with delays
 * @param {string} data - The complete data to emit
 * @param {number} chunkSize - Minimum chunk size in bytes
 * @param {number} delayMs - Delay between chunks in milliseconds
 * @returns {Readable}
 */
export function createChunkedStream(data, chunkSize = 10, delayMs = 50) {
  let index = 0;

  return new Readable({
    read() {
      if (index >= data.length) {
        // Signal end of stream
        this.push(null);
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

test("should parse GET Request line correctly", async () => {
  const stream = createChunkedStream(
    "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
  );

  const request = await getRequestFromStream(stream);
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("GET");
  expect(requestLine.requestTarget).toBe("/");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse POST Request line correctly", async () => {
  const stream = createChunkedStream(
    "POST / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    20
  );
  const request = await getRequestFromStream(stream);
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("POST");
  expect(requestLine.requestTarget).toBe("/");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse GET Request line with path correctly", async () => {
  const stream = createChunkedStream(
    "GET /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    1
  );
  const request = await getRequestFromStream(stream);
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("GET");
  expect(requestLine.requestTarget).toBe("/coffee");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse POST Request line with path correctly", async () => {
  const stream = createChunkedStream(
    "POST /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    10
  );
  const request = await getRequestFromStream(stream);

  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("POST");
  expect(requestLine.requestTarget).toBe("/coffee");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should throw MalformedRequestLineError when invalid number of parts in request line", async () => {
  const stream = createChunkedStream(
    "/coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    5
  );

  await expect(getRequestFromStream(stream)).rejects.toThrow(
    MalformedRequestLineError
  );
});

test("should throw InvalidHttpMethod when method is invalid", async () => {
  const stream = createChunkedStream(
    "TRY /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    8
  );

  await expect(getRequestFromStream(stream)).rejects.toThrow(
    InvalidMethodError
  );
});

test("should throw UnsupportedHttpVersion when http version is not supported", async () => {
  const stream = createChunkedStream(
    "GET /coffee HTTP/3\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n",
    16
  );

  await expect(getRequestFromStream(stream)).rejects.toThrow(
    UnsupportedHttpVersionError
  );
});
