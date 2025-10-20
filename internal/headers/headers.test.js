import { test } from "vitest";
import { Headers } from "./headers.js";
import { expect } from "vitest";
import {
  InvalidHeaderNameError,
  MalformedHeadersError,
} from "./headers.errors.js";

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

test("Should parse correctly with preexisting header", () => {
  const headers = new Headers();

  headers.parse("Host: localhost:42069\r\n\r\n");
  headers.parse("Content-Type: application/json\r\n\r\n");

  expect(headers.get("Host")).toBe("localhost:42069");
  expect(headers.get("Content-Type")).toBe("application/json");
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

test("Header names should be case insensitive", () => {
  const headers = new Headers();

  headers.parse(
    "Host: localhost:42069\r\nContent-Type: application/json\r\n\r\n"
  );

  expect(headers.get("host")).toBe("localhost:42069");
  expect(headers.get("Host")).toBe("localhost:42069");
  expect(headers.get("HoSt")).toBe("localhost:42069");
  expect(headers.get("HOST")).toBe("localhost:42069");

  expect(headers.get("content-type")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
  expect(headers.get("Content-type")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("should throw an InvalidHeaderNameError when header name is invalid", () => {
  const headers = new Headers();

  expect(() => headers.parse("H©st: localhost:42069\r\n\r\n")).toThrow(
    InvalidHeaderNameError
  );
  expect(() => headers.parse(": localhost:42069\r\n\r\n")).toThrow(
    InvalidHeaderNameError
  );
});

test("should correctly parse multiple values for the same header name", () => {
  const headers = new Headers();

  headers.parse("My-Header: value1\r\nMy-Header: value2\r\n\r\n");

  expect(headers.get("My-Header")).toBe("value1,value2");
});
