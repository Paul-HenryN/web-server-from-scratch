import { Server } from "../../internal/server/server.js";

const port = 8080;

const server = Server.serve(port);

console.log(`Server started on http://localhost:${port}`);
