import { test } from "vitest";
import { Headers } from "./headers.js";
import { expect } from "vitest";
import { MalformedHeadersError } from "./headers.errors.js";

test("Should parse single header correctly", () => {
  const headers = new Headers();

  const { charsRead, done } = headers.parse("Host: localhost:42069\r\n\r\n");

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(charsRead).toBe(25);
  expect(done).toBe(true);
});

test("Should parse single header with valid extra spaces correctly", () => {
  const headers = new Headers();

  const { charsRead, done } = headers.parse(
    "     Host:      localhost:42069 \r\n\r\n"
  );

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(charsRead).toBe(36);
  expect(done).toBe(true);
});

test("Should parse 2 headers correctly", () => {
  const headers = new Headers();

  const { done } = headers.parse(
    "Host: localhost:42069\r\nContent-Type: application/json\r\n\r\n"
  );

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(headers.get("Content-Type")).toBe("application/json");
  expect(done).toBe(true);
});

test("Should throw MalformedHeadersError when there's an extra space after header name", () => {
  const headers = new Headers();

  expect(() =>
    headers.parse("     Host :      localhost:42069 \r\n\r\n")
  ).toThrow(MalformedHeadersError);
});

test("Should not be done for incomplete inputs", () => {
  const headers = new Headers();

  const { done: done1 } = headers.parse("Host: localhost:42069\r\n");
  expect(done1).toBe(false);

  const { done: done2 } = headers.parse("Host: localh");
  expect(done2).toBe(false);
});
