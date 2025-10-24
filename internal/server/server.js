import net from "net";

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

    socket.write(
      "HTTP/1.1 200 OK\r\n" +
        "Content-Type: text/plain\r\n" +
        "Content-Length: 13\r\n" +
        "\r\n" +
        "Hello world !",
      (err) => {
        if (err) {
          throw err;
        }

        socket.destroy();
      }
    );
  }
}
