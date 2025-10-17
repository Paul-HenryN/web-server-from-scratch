import net from "net";

export const tcpServer = net.createServer((socket) => {
  socket.setEncoding("utf-8");

  socket.on("error", () => {
    console.error(`Socket error: ${error}`);
  });
});
