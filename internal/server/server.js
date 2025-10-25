import net from "net";
import { Response } from "../response/response.js";

export class Server {
  #tcpListener;
  #closed;

  constructor() {
    this.#tcpListener = net.createServer();
    this.#closed = false;
  }

  /**
   *
   * @param {number} port
   */
  static serve(port) {
    const server = new Server();

    server.tcpListener.on("connection", server.handleConnection.bind(server));
    server.tcpListener.listen(port);

    return server;
  }

  get tcpListener() {
    return this.#tcpListener;
  }

  close() {
    this.#tcpListener.close();
    this.#closed = true;
  }

  /**
   *
   * @param {net.Socket} socket
   */
  handleConnection(socket) {
    if (this.#closed) {
      throw new Error("Server is closed.");
    }

    const message = "How are you ??";

    const response = new Response(socket);

    response.writeStatusLine(Response.StatusCode.OK);
    response.writeHeaders(Response.getDefaultHeaders(message.length));
    socket.write(message);

    socket.destroy();
  }
}
