import { tcpServer } from "./cmd/tcp-server.js";
import { Request } from "./internal/request/request.js";

tcpServer.on("connection", async (socket) => {
  const request = await Request.fromStream(socket);

  console.log(
    `Request Line:\n- Method: ${request.requestLine.method}\n- Target: ${request.requestLine.requestTarget}\n- Version: ${request.requestLine.httpVersion}`
  );
});

tcpServer.listen(8080);
