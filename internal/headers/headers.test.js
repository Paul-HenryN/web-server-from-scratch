import { test } from "vitest";
import { Headers } from "./headers.js";
import { expect } from "vitest";
import { MalformedHeadersError } from "./headers.errors.js";

test("Should parse single header correctly", () => {
  const headers = Headers.parse("Host: localhost:42069\r\n\r\n");

  expect(headers).toBeDefined();
  expect(headers.get("Host")).toBe("localhost:42069");
});

test("Should parse single header with valid extra spaces correctly", () => {
  const headers = Headers.parse("     Host:      localhost:42069 \r\n\r\n");

  expect(headers).toBeDefined();
  expect(headers.get("Host")).toBe("localhost:42069");
});

test("Should throw MalformedHeadersError when there's an extra space after header name", () => {
  expect(() =>
    Headers.parse("       Host : localhost:42069       \r\n\r\n")
  ).toThrow(MalformedHeadersError);
});
