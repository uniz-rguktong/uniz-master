import express from "express";
import helmet from "helmet";
import compression from "compression";
import authRoutes from "./routes/auth.routes";
import { attributionMiddleware } from "./middlewares/attribution.middleware";

/** Express app for auth routes (no listen). Used standalone or by uniz-api. */
export function createApp(): express.Application {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(attributionMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "uniz-auth-service" });
  });

  app.use("/", authRoutes);

  app.use((req, res) => {
    res.status(404).json({
      status: "error",
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString(),
      attribution: "SreeCharan",
    });
  });

  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err?.type === "request.aborted") {
        return res.status(400).json({ error: "Request aborted" });
      }
      console.error(err?.stack || err);
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}

export default createApp;
