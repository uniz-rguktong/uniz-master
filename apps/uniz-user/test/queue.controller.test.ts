import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/bulk-worker.service", () => ({
  processNextStudentBatch: vi.fn(),
}));

import { processNextStudentBatch } from "../src/services/bulk-worker.service";
import { processQueue } from "../src/controllers/queue.controller";
import { mockReq, mockRes } from "./http";
import { axiosMock } from "./mocks";

const runBatch = vi.mocked(processNextStudentBatch);

describe("processQueue", () => {
  beforeEach(() => {
    runBatch.mockReset();
    vi.useRealTimers();
  });

  it("rejects a missing internal secret", async () => {
    const res = mockRes();
    await processQueue(mockReq(), res);
    expect(res.statusCode).toBe(401);
    expect(runBatch).not.toHaveBeenCalled();
  });

  it("reports an empty student queue", async () => {
    runBatch.mockResolvedValue(null as any);
    const res = mockRes();
    await processQueue(
      mockReq({ headers: { "x-internal-secret": "unit-test-internal" } }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("No jobs in student queue");
  });

  it("schedules the next batch when work remains", async () => {
    vi.useFakeTimers();
    runBatch.mockResolvedValue({
      status: "continued",
      processedInThisRun: 300,
      total: 400,
    } as any);
    const res = mockRes();
    const pending = processQueue(
      mockReq({ headers: { "x-internal-secret": "unit-test-internal" } }),
      res,
    );
    await vi.advanceTimersByTimeAsync(500);
    await pending;
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("continued");
    expect(String(axiosMock.post.mock.calls[0][0])).toContain("/api/queue/process");
  });

  it("returns 500 when the worker throws", async () => {
    runBatch.mockRejectedValue(new Error("worker blew up"));
    const res = mockRes();
    await processQueue(
      mockReq({ headers: { "x-internal-secret": "unit-test-internal" } }),
      res,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("worker blew up");
  });
});
