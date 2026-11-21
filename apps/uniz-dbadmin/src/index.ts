import dotenv from "dotenv";
import { createApp } from "./app";
import { jwtSecret } from "./auth";

dotenv.config({ override: true });

const port = Number(process.env.PORT || 3010);
jwtSecret();
const app = createApp();
const server = app.listen(port, () => {
  console.log(`Database editor listening on port ${port}`);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
});
