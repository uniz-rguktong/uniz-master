import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { redis } from "../utils/redis.util";
import {
  generateRegistrationPdf,
  generateBulkRegistrationPdf,
  type RegistrationPdfData,
} from "../utils/pdf.util";

export const REGISTRATION_PDF_QUEUE = "registration-pdf-queue";
export const PDF_PROGRESS_PREFIX = "registration-pdf:progress:";
export const PDF_RESULT_PREFIX = "registration-pdf:result:";
const PDF_TTL_SEC = 600;

type PdfJobKind = "single" | "bulk";

export type RegistrationPdfJobData = {
  jobId: string;
  kind: PdfJobKind;
  semesterId: string;
  studentId?: string;
  branch?: string;
  year?: string;
  batch?: string;
  query?: string;
  requestedBy: string;
  role: string;
  authHeader?: string;
  filename: string;
};

function connectionFromEnv(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
  }
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
}

let pdfQueue: Queue | null = null;

export function getRegistrationPdfQueue(): Queue {
  if (!pdfQueue) {
    pdfQueue = new Queue(REGISTRATION_PDF_QUEUE, {
      connection: connectionFromEnv(),
    });
  }
  return pdfQueue;
}

export async function setPdfProgress(
  jobId: string,
  progress: Record<string, unknown>,
) {
  await redis.setex(
    `${PDF_PROGRESS_PREFIX}${jobId}`,
    PDF_TTL_SEC,
    JSON.stringify({ ...progress, updatedAt: Date.now() }),
  );
}

export async function getPdfProgress(jobId: string) {
  const raw = await redis.get(`${PDF_PROGRESS_PREFIX}${jobId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function storePdfResult(
  jobId: string,
  buffer: Buffer,
  filename: string,
) {
  await redis.setex(`${PDF_RESULT_PREFIX}${jobId}`, PDF_TTL_SEC, buffer);
  await setPdfProgress(jobId, {
    status: "done",
    percent: 100,
    filename,
    bytes: buffer.length,
  });
}

export async function getPdfResult(jobId: string): Promise<Buffer | null> {
  const buf = await redis.getBuffer(`${PDF_RESULT_PREFIX}${jobId}`);
  return buf && buf.length ? buf : null;
}

export async function enqueueRegistrationPdfJob(data: RegistrationPdfJobData) {
  await setPdfProgress(data.jobId, {
    status: "queued",
    percent: 0,
    kind: data.kind,
    filename: data.filename,
  });

  return getRegistrationPdfQueue().add(data.kind, data, {
    jobId: data.jobId,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
  });
}

type PdfBuilder = {
  buildSingle: (data: RegistrationPdfJobData) => Promise<{
    buffer: Buffer;
    filename: string;
  }>;
  buildBulk: (data: RegistrationPdfJobData) => Promise<{
    buffer: Buffer;
    filename: string;
  }>;
};

let builder: PdfBuilder | null = null;

/** Injected from registration controller to avoid circular imports. */
export function registerRegistrationPdfBuilder(next: PdfBuilder) {
  builder = next;
}

export function startRegistrationPdfWorker() {
  const concurrency = Number(
    process.env.REGISTRATION_PDF_WORKER_CONCURRENCY || 2,
  );

  const worker = new Worker(
    REGISTRATION_PDF_QUEUE,
    async (job) => {
      if (!builder) {
        throw new Error("Registration PDF builder not registered");
      }
      const data = job.data as RegistrationPdfJobData;
      await setPdfProgress(data.jobId, {
        status: "processing",
        percent: 10,
        kind: data.kind,
        filename: data.filename,
      });

      const result =
        data.kind === "bulk"
          ? await builder.buildBulk(data)
          : await builder.buildSingle(data);

      await storePdfResult(data.jobId, result.buffer, result.filename);
      return { bytes: result.buffer.length, filename: result.filename };
    },
    {
      connection: connectionFromEnv(),
      concurrency,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
    },
  );

  worker.on("failed", async (job, err) => {
    const jobId = (job?.data as RegistrationPdfJobData | undefined)?.jobId;
    if (jobId) {
      await setPdfProgress(jobId, {
        status: "failed",
        percent: 0,
        message: err.message,
      });
    }
    console.error(
      `[RegistrationPdfWorker] Job ${job?.id} failed: ${err.message}`,
    );
  });

  worker.on("ready", () => {
    console.log(
      `[RegistrationPdfWorker] Listening on ${REGISTRATION_PDF_QUEUE} (concurrency=${concurrency})`,
    );
  });

  return worker;
}

export { generateRegistrationPdf, generateBulkRegistrationPdf };
export type { RegistrationPdfData };
