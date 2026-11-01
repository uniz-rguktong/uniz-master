import { describe, expect, it, vi } from "vitest";
import {
  PDF_PROGRESS_PREFIX,
  PDF_RESULT_PREFIX,
  REGISTRATION_PDF_QUEUE,
  getPdfProgress,
  getPdfResult,
  registerRegistrationPdfBuilder,
  setPdfProgress,
  startRegistrationPdfWorker,
  storePdfResult,
} from "../src/workers/registration-pdf.queue";
import { redis } from "../src/utils/redis.util";

const job = {
  jobId: "job-1",
  kind: "single" as const,
  semesterId: "sem-1",
  requestedBy: "ada",
  role: "faculty",
  filename: "slip.pdf",
};

describe("registration pdf queue", () => {
  it("stores progress and results in Redis under the pdf prefixes", async () => {
    await setPdfProgress("job-1", { status: "queued", percent: 0 });
    const progressCall = redis.setex.mock.calls[0];
    expect(progressCall[0]).toBe(`${PDF_PROGRESS_PREFIX}job-1`);
    expect(progressCall[1]).toBe(600);
    expect(JSON.parse(progressCall[2] as string).status).toBe("queued");

    redis.get.mockResolvedValueOnce(JSON.stringify({ status: "queued" }));
    await expect(getPdfProgress("job-1")).resolves.toEqual({ status: "queued" });
    await expect(getPdfProgress("missing")).resolves.toBeNull();

    const buffer = Buffer.from("pdf");
    await storePdfResult("job-1", buffer, "slip.pdf");
    expect(redis.setex).toHaveBeenCalledWith(
      `${PDF_RESULT_PREFIX}job-1`,
      600,
      buffer,
    );

    redis.getBuffer.mockResolvedValueOnce(buffer);
    await expect(getPdfResult("job-1")).resolves.toEqual(buffer);
    redis.getBuffer.mockResolvedValueOnce(Buffer.alloc(0));
    await expect(getPdfResult("job-1")).resolves.toBeNull();
  });

  it("enqueues on a localhost connection when REDIS_URL is unset", async () => {
    vi.resetModules();
    delete process.env.REDIS_URL;
    const mod = await import("../src/workers/registration-pdf.queue");
    const queue = mod.getRegistrationPdfQueue();
    await mod.enqueueRegistrationPdfJob(job);
    expect(queue.name).toBe(REGISTRATION_PDF_QUEUE);
    expect(queue.opts).toMatchObject({
      connection: { host: "localhost", port: 6379, maxRetriesPerRequest: null },
    });
    expect(queue.add).toHaveBeenCalledWith(
      "single",
      job,
      expect.objectContaining({ jobId: "job-1", attempts: 2 }),
    );
    expect(mod.getRegistrationPdfQueue()).toBe(queue);
  });

  it("reads a Redis URL into the queue options without dialing", async () => {
    vi.resetModules();
    process.env.REDIS_URL = "redis://:unit-test-pass@redis.example:6380";
    try {
      const mod = await import("../src/workers/registration-pdf.queue");
      const queue = mod.getRegistrationPdfQueue();
      expect(queue.opts).toMatchObject({
        connection: {
          host: "redis.example",
          port: 6380,
          password: "unit-test-pass",
          maxRetriesPerRequest: null,
        },
      });
    } finally {
      delete process.env.REDIS_URL;
    }
  });

  it("fails a job until a builder is registered, then stores the pdf", async () => {
    vi.resetModules();
    delete process.env.REDIS_URL;
    const mod = await import("../src/workers/registration-pdf.queue");
    const { redis: freshRedis } = await import("../src/utils/redis.util");
    freshRedis.setex.mockResolvedValue("OK");

    const unready = mod.startRegistrationPdfWorker();
    await expect(
      unready.processor({ data: { ...job, kind: "single" } }),
    ).rejects.toThrow(/builder not registered/);

    const buildSingle = vi.fn().mockResolvedValue({
      buffer: Buffer.from("pdf"),
      filename: "slip.pdf",
    });
    mod.registerRegistrationPdfBuilder({
      buildSingle,
      buildBulk: vi.fn(),
    });
    const worker = mod.startRegistrationPdfWorker();
    await expect(
      worker.processor({ data: { ...job, kind: "single" } }),
    ).resolves.toEqual({ bytes: 3, filename: "slip.pdf" });
    expect(buildSingle).toHaveBeenCalled();

    const failed = worker.handlers.get("failed");
    await failed?.(
      { id: "7", data: { jobId: "job-9" } },
      new Error("render failed"),
    );
    const failedProgress = freshRedis.setex.mock.calls.at(-1);
    expect(JSON.parse(failedProgress?.[2] as string).status).toBe("failed");
  });
});

describe("registration pdf exports stay wired", () => {
  it("exposes the queue name used by the worker", () => {
    expect(REGISTRATION_PDF_QUEUE).toBe("registration-pdf-queue");
    expect(registerRegistrationPdfBuilder).toBeTypeOf("function");
    expect(startRegistrationPdfWorker).toBeTypeOf("function");
  });
});
