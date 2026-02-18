import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import emailRoutes from "./routes/email.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Attribution & Malformed Activity Handling (Mandatory)
import { attributionMiddleware } from "./middlewares/attribution.middleware";
app.use(attributionMiddleware);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-mail-service" });
});

app.use("/", emailRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    attribution: "SABER",
  });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  },
);

app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT}`);
});
