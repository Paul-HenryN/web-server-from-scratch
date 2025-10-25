import net from "net";
import { Request } from "../request/request.js";
import { Response } from "../response/response.js";

/**
 * @callback Handler
 * @param {Request} request
 * @param {Response} response
 */

export class Server {
  #tcpListener;
  #closed;
  #handler;

  /**
   *
   * @param {Handler} handler
   */
  constructor(handler) {
    this.#tcpListener = net.createServer();
    this.#closed = false;
    this.#handler = handler;
  }

  /**
   *
   * @param {number} port
   * @param {Handler} handler
   */
  static serve(port, handler) {
    const server = new Server(handler);

    server.tcpListener.on("connection", server.handleConnection.bind(server));
    server.tcpListener.listen(port);

    return server;
  }

  get tcpListener() {
    return this.#tcpListener;
  }

  set handler(handler) {
    this.#handler = handler;
  }

  close() {
    this.#tcpListener.close();
    this.#closed = true;
  }

  /**
   *
   * @param {net.Socket} socket
   */
  async handleConnection(socket) {
    if (this.#closed) {
      socket.destroy();
      return;
    }

    const response = new Response(socket);

    try {
      const request = await Request.fromStream(socket);
      await this.#handler(request, response);
    } catch (e) {
      console.error("Request handling error:", e);
    } finally {
      socket.destroy();
    }
  }
}
