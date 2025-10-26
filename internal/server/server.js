import net from "net";
import { Request } from "../request/request.js";
import { Response } from "../response/response.js";

/**
 * @callback Handler
 * @param {Request} request
 * @param {Response} response
 */

/**
 * @typedef Route
 * @property {string} path
 * @property {string} method
 * @property {Handler} handler
 */

export class Server {
  /**@type {net.Server} */
  #tcpListener;

  /**@type {boolean} */
  #closed;

  /**@type {Route[]} */
  #routes;

  /**
   *
   * @param {Handler} handler
   */
  constructor() {
    this.#tcpListener = net.createServer();
    this.#closed = false;
    this.#routes = [];
  }

  close() {
    this.#tcpListener.close();
    this.#closed = true;
  }

  /**
   *
   * @param {string} path
   * @param {Handler} handler
   */
  get(path, handler) {
    this.#routes.push({
      path,
      handler,
      method: "GET",
    });
  }

  /**
   *
   * @param {number} port
   */
  listen(port) {
    this.#tcpListener.on("connection", this.#handleConnection.bind(this));
    this.#tcpListener.listen(port);
  }

  /**
   *
   * @param {net.Socket} socket
   */
  async #handleConnection(socket) {
    if (this.#closed) {
      socket.destroy();
      return;
    }

    const response = new Response(socket);

    try {
      const request = await Request.fromStream(socket);
      const handler = this.#dispatchRequest(request);

      if (!handler) {
        await response.status(Response.StatusCode.NOT_FOUND).html(
          `
            <html>
              <head>
                <title>404 NOT FOUND</title>
              </head>

              <body>
                CANNOT ${request.requestLine.method} ${request.requestLine.target}
              </body>
            </html>
          `
        );
        return;
      }

      await handler(request, response);
    } catch (e) {
      if (e.code === "EPIPE") {
        console.log("Client disconnected");
      } else {
        console.error(e);

        response
          .status(Response.StatusCode.INTERNAL_SERVER_ERROR)
          .text("Something went wrong");
      }
    } finally {
      socket.destroy();
    }
  }

  /**
   *
   * @param {Request} request
   * @returns {?Handler}
   */
  #dispatchRequest(request) {
    for (const { path, method, handler } of this.#routes) {
      if (
        request.requestLine.method === method &&
        request.requestLine.target === path
      ) {
        return handler;
      }
    }

    return null;
  }
}
