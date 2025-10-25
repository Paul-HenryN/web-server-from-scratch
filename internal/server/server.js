import net from "net";
import { Request } from "../request/request.js";
import { Response } from "../response/response.js";

/**
 * @typedef HandlerResponse
 * @property {number} statusCode
 * @property {string} message
 */

/**
 * @callback Handler
 * @param {Request} request
 * @returns {HandlerResponse}
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
  static serve(
    port,
    handler = () => ({ statusCode: Response.StatusCode.OK, message: "" })
  ) {
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
      const { statusCode, message } = this.#handler(request);

      await response.writeStatusLine(statusCode);
      await response.writeHeaders(Response.getDefaultHeaders(message.length));
      await response.write(message);
    } catch (e) {
      console.error("Request handling error:", e);
      await response.writeStatusLine(Response.StatusCode.INTERNAL_SERVER_ERROR);
      await response.writeHeaders(Response.getDefaultHeaders(0));
    } finally {
      socket.destroy();
    }
  }
}
