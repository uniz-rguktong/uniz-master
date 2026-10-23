import dotenv from "dotenv";
dotenv.config({ override: true });

import { createApp } from "./createApp";

const app = createApp();
const PORT = process.env.PORT || 3004;

const server = app.listen(PORT, () => {
  console.log(`Academics Service running on port ${PORT}`);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
});

export default app;

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  process.exit(0);
});
