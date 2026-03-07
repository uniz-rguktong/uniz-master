import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Redis connection - optimized for serverless if possible,
// but BullMQ Worker needs a stable connection.
const REDIS_URL = process.env.REDIS_URL;

// Only start the worker if REDIS_URL is present
if (REDIS_URL) {
  try {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true, // Don't block startup
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.SMTP_USER || "user",
        pass: process.env.SMTP_PASS || "pass",
      },
    });

    const worker = new Worker(
      "notification-queue",
      async (job) => {
        console.log(`Processing job ${job.id}: ${job.name}`);
        const { type, recipient, subject, body } = job.data;

        if (type === "EMAIL") {
          await transporter.sendMail({
            from: '"UniZ System" <no-reply@uniz.edu>',
            to: recipient,
            subject: subject,
            text: body,
          });
          console.log(`Email sent to ${recipient}`);
        }
      },
      { connection },
    );

    worker.on("failed", (job, err) => {
      console.log(`${job?.id} has failed with ${err.message}`);
    });

    console.log("Notification Service Worker Initialized");
  } catch (err) {
    console.error("Failed to initialize Notification Worker:", err);
  }
}

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "uniz-notification-service" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "UniZ Notification Service is active.",
    worker: REDIS_URL ? "initialized" : "missing REDIS_URL",
    health: "/health",
  });
});

// Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  },
);

export default app;
