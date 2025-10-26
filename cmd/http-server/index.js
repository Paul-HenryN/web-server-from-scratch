import { Response } from "../../internal/response/response.js";
import { Server } from "../../internal/server/server.js";
import crypto from "crypto";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const port = 8080;

const server = Server.serve(port, async (request, response) => {
  console.log(request.requestLine.method, request.requestLine.target);

  if (request.requestLine.target.startsWith("/httpbin")) {
    await chunkedHandler(request, response);
  } else if (
    request.requestLine.method === "GET" &&
    request.requestLine.target === "/video"
  ) {
    await videoHandler(request, response);
  } else {
    await normalHandler(request, response);
  }
});

async function normalHandler(request, response) {
  let statusCode = Response.StatusCode.OK;
  let message = `
      <html>
      <head>
        <title>200 OK</title>
      </head>
      <body>
        <h1>Success!</h1>
        <p>Your request was an absolute banger.</p>
      </body>
    </html>
  `;

  if (request.requestLine.target === "/yourproblem") {
    statusCode = Response.StatusCode.BAD_REQUEST;
    message = `
      <html>
      <head>
        <title>400 Bad Request</title>
      </head>
      <body>
        <h1>Bad Request</h1>
        <p>Your request honestly kinda sucked.</p>
      </body>
      </html>
    `;
  }

  if (request.requestLine.target === "/myproblem") {
    statusCode = Response.StatusCode.INTERNAL_SERVER_ERROR;
    message = `
      <html>
        <head>
          <title>500 Internal Server Error</title>
        </head>
        <body>
          <h1>Internal Server Error</h1>
          <p>Okay, you know what? This one is on me.</p>
        </body>
      </html>
    `;
  }

  await response.writeStatusLine(statusCode);
  await response.writeHeaders(Response.getDefaultHeaders(message.length));
  await response.writeBody(message);
}

async function chunkedHandler(request, response) {
  const endpoint = request.requestLine.target.split("/httpbin/")[1];

  const result = await fetch(`https://httpbin.org/${endpoint}`);

  const headers = Response.getChunkedEncodingheaders();
  headers.set("Trailer", "X-Content-SHA256, X-Content-Length");

  await response.writeStatusLine(Response.StatusCode.OK);
  await response.writeHeaders(headers);

  let buffer = "";

  for await (const chunk of result.body) {
    const text = new TextDecoder().decode(chunk);
    buffer += text;
    await response.writeChunkedBody(text);
  }

  await response.writeChunkedBodyDone();

  const hash = crypto.createHash("sha256").update(buffer);
  const trailers = new Headers();

  trailers.set("X-Content-SHA256", hash.digest("hex"));
  trailers.set(
    "X-Content-Length",
    Buffer.byteLength(buffer, "utf-8").toString()
  );

  await response.writeTrailers(trailers);
}

async function videoHandler(request, response) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const videoPath = join(__dirname, "..", "..", "assets", "vim.mp4");
  const video = await fs.readFile(videoPath);

  const headers = Response.getDefaultHeaders(video.byteLength.toString());
  headers.replace("Content-Type", "video/mp4");

  await response.writeStatusLine(Response.StatusCode.OK);
  await response.writeHeaders(headers);
  await response.writeBody(video);
}

console.log(`Server started on http://localhost:${port}`);
