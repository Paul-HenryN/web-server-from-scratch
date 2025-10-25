import { Response } from "../../internal/response/response.js";
import { Server } from "../../internal/server/server.js";

const port = 8080;

const server = Server.serve(port, (request) => {
  if (request.requestLine.requestTarget === "/yourproblem") {
    return {
      statusCode: Response.StatusCode.BAD_REQUEST,
      message: "Your problem is not my problem\n",
    };
  }

  if (request.requestLine.requestTarget === "/myproblem") {
    return {
      statusCode: Response.StatusCode.INTERNAL_SERVER_ERROR,
      message: "My bad, sorry\n",
    };
  }

  return { statusCode: Response.StatusCode.OK, message: "All good, frfr\n" };
});

console.log(`Server started on http://localhost:${port}`);
