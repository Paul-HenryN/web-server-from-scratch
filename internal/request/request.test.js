import { test } from "vitest";
import { getRequestFromStream } from "./request";
import { Readable } from "stream";
import { expect } from "vitest";
import {
  InvalidMethodError,
  MalformedRequestLineError,
  UnsupportedHttpVersionError,
} from "./request.errors";

test("should parse GET Request line correctly", async () => {
  const request = await getRequestFromStream(
    Readable.from(
      "GET / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("GET");
  expect(requestLine.requestTarget).toBe("/");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse POST Request line correctly", async () => {
  const request = await getRequestFromStream(
    Readable.from(
      "POST / HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("POST");
  expect(requestLine.requestTarget).toBe("/");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse GET Request line with path correctly", async () => {
  const request = await getRequestFromStream(
    Readable.from(
      "GET /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );
  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("GET");
  expect(requestLine.requestTarget).toBe("/coffee");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should parse POST Request line with path correctly", async () => {
  const request = await getRequestFromStream(
    Readable.from(
      "POST /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n"
    )
  );

  expect(request).toBeDefined();
  const requestLine = request.requestLine;
  expect(requestLine.method).toBe("POST");
  expect(requestLine.requestTarget).toBe("/coffee");
  expect(requestLine.httpVersion).toBe("1.1");
});

test("should throw MalformedRequestLineError when invalid number of parts in request line", async () => {
  const input =
    "/coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n";
  await expect(getRequestFromStream(Readable.from(input))).rejects.toThrow(
    MalformedRequestLineError
  );
});

test("should throw InvalidHttpMethod when method is invalid", async () => {
  const input =
    "TRY /coffee HTTP/1.1\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n";

  await expect(getRequestFromStream(Readable.from(input))).rejects.toThrow(
    InvalidMethodError
  );
});

test("should throw UnsupportedHttpVersion when http version is not supported", async () => {
  const input =
    "GET /coffee HTTP/3\r\nHost: localhost:42069\r\nUser-Agent: curl/7.81.0\r\nAccept: */*\r\n\r\n";

  await expect(getRequestFromStream(Readable.from(input))).rejects.toThrow(
    UnsupportedHttpVersionError
  );
});
