import { serverEnv } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();

const server = app.listen(serverEnv.port, () => {
  console.log(`API listening on http://localhost:${serverEnv.port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down.`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
