import { test } from "vitest";
import { getRequestFromStream } from "./request";
import { Readable } from "stream";
import { expect } from "vitest";

test("should parse GET Request line correctly", () => {
  const request = getRequestFromStream(
    Readable.from(
      "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );

  expect(request).toBeDefined();
  expect(request).not().toBeNull();

  const requestLine = request.getRequestLine();

  expect(requestLine.getMethod()).toBe("GET");
  expect(requestLine.getRequestTarget()).toBe("/");
  expect(requestLine.getHttpVersion).toBe("1.1");
});

test("should parse GET Request line with path correctly", () => {
  const request = getRequestFromStream(
    Readable.from(
      "GET /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );

  expect(request).toBeDefined();
  expect(request).not().toBeNull();

  expect(requestLine.getMethod()).toBe("GET");
  expect(requestLine.getRequestTarget()).toBe("/coffee");
  expect(requestLine.getHttpVersion).toBe("1.1");
});

test("should throw error when invalid number of parts in request line", () => {
  const input =
    "/coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n";

  expect(() => getRequestFromStream(Readable.from(input))).toThrowError();
});
