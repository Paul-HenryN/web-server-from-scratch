import { Server } from "../../internal/server/server.js";
import { Readable } from "stream";

const port = 8080;
const server = new Server();

server.get("/", async (_, res) => {
  await res.text("Hello, world ! :)");
});

// HTML response
server.get("/html", async (_, res) => {
  await res.html(
    `
        <html>
            <head>
             <title>Some HTML</title>
            </head>

            <body>
                Hello, world ! :D
            </body>
        </html>
    `
  );
});

// Chunked encoding example
// Uses the https://httpbin.org API to
// get streaming data.
server.get("/stream", async (req, res) => {
  const result = await fetch("https://httpbin.org/stream/100");
  await res.stream(Readable.fromWeb(result.body));
});

server.listen(port);
console.log(`Server listening on port ${port}`);
