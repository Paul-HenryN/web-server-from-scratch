import { Response } from "../../internal/response/response.js";
import { Server } from "../../internal/server/server.js";

const port = 8080;

const server = Server.serve(port, async (request, response) => {
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

  if (request.requestLine.requestTarget === "/yourproblem") {
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

  if (request.requestLine.requestTarget === "/myproblem") {
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
});

console.log(`Server started on http://localhost:${port}`);
