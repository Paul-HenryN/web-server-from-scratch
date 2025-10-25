import { Response } from "../../internal/response/response.js";
import { Server } from "../../internal/server/server.js";

const port = 8080;

const server = Server.serve(port, async (request, response) => {
  if (request.requestLine.target.startsWith("/httpbin")) {
    await chunkedHandler(request, response);
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
  let statusCode = Response.StatusCode.OK;

  const endpoint = request.requestLine.target.split("/httpbin/")[1];
  const result = await fetch(`https://httpbin.org/${endpoint}`);

  const headers = Response.getChunkedEncodingheaders();
  headers.replace("content-type", "application/json");

  response.writeStatusLine(Response.StatusCode.OK);
  response.writeHeaders(headers);

  for await (const chunk of result.body) {
    const text = new TextDecoder().decode(chunk);
    await response.writeChunkedBody(text);
  }

  await response.writeChunkedBodyDone();
}

console.log(`Server started on http://localhost:${port}`);
