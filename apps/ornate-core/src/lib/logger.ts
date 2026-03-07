import pino from "pino";
import type { Logger } from "pino";

const transport =
  process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined;

const logger: Logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: transport as any,
  base: {
    env: process.env.NODE_ENV,
  },
});

export default logger;
