import { test } from "vitest";
import { Headers } from "./headers.js";
import { expect } from "vitest";
import { MalformedHeadersError } from "./headers.errors.js";

test("Should parse single header correctly", () => {
  const headers = new Headers();

  const { charsRead, done } = headers.parse("Host: localhost:42069\r\n\r\n");

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(charsRead).toBe(23);
  expect(done).toBe(true);
});

test("Should parse single header with valid extra spaces correctly", () => {
  const headers = new Headers();

  const { charsRead, done } = headers.parse(
    "     Host:      localhost:42069 \r\n\r\n"
  );

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(charsRead).toBe(34);
  expect(done).toBe(true);
});

test("Should throw MalformedHeadersError when there's an extra space after header name", () => {
  const headers = new Headers();

  expect(() =>
    headers.parse("     Host :      localhost:42069 \r\n\r\n")
  ).toThrow(MalformedHeadersError);
});
