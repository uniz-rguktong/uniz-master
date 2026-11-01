import http from "node:http";
import express from "express";
import type { Server } from "node:http";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

const runStorageCleanup = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("../src/utils/storage", () => ({ runStorageCleanup }));

const servers: Server[] = [];
const originalListen = express.application.listen;
let port = 0;

const signalBefore = new Set(process.listeners("SIGTERM"));

await new Promise<void>((resolve, reject) => {
  express.application.listen = function (this: express.Application, ...args: any[]) {
    const callback = args.find((arg) => typeof arg === "function");
    const server = originalListen.call(this, 0, () => {
      const address = server.address();
      if (address && typeof address !== "string") port = address.port;
      if (typeof callback === "function") callback();
      resolve();
    }) as unknown as Server;
    server.unref();
    servers.push(server);
    return server as any;
  };
  import("../src/index").catch(reject);
});

express.application.listen = originalListen;
for (const listener of process.listeners("SIGTERM")) {
  if (!signalBefore.has(listener)) process.removeListener("SIGTERM", listener);
}

afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) => new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode || 0, body: text ? JSON.parse(text) : null });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const secret = { "x-internal-secret": "unit-test-internal" };

describe("cron service routes", () => {
  it("reports health and the moved maintenance endpoint", async () => {
    const health = await request("GET", "/health");
    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({
      status: "ok",
      service: "uniz-cron-service",
    });
    expect(health.body.note).toContain("uniz-outpass");

    const moved = await request("GET", "/api/cron");
    expect(moved.status).toBe(410);
    expect(moved.body).toEqual({
      error: "Moved",
      message: "Maintenance is now served by uniz-outpass at /api/cron",
    });
  });

  it("rejects a missing secret and runs cleanup once", async () => {
    runStorageCleanup.mockClear();
    const denied = await request("POST", "/internal/storage-cleanup");
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ error: "Forbidden" });

    const wrong = await request("POST", "/internal/storage-cleanup", {
      "x-internal-secret": "nope",
    });
    expect(wrong.status).toBe(403);
    expect(runStorageCleanup).not.toHaveBeenCalled();

    const ok = await request("POST", "/internal/storage-cleanup", secret);
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({
      success: true,
      message: "Storage cleanup completed",
    });
    expect(runStorageCleanup).toHaveBeenCalledTimes(1);
  });

  it("returns 409 while a cleanup is already running", async () => {
    let release: () => void = () => {};
    runStorageCleanup.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const first = request("POST", "/internal/storage-cleanup", secret);
    await vi.waitFor(() => expect(runStorageCleanup).toHaveBeenCalled());
    const second = await request("POST", "/internal/storage-cleanup", secret);
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: "Storage cleanup already in progress" });
    release();
    await expect(first).resolves.toMatchObject({ status: 200 });
  });

  it("returns 500 when cleanup throws and then accepts another run", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    runStorageCleanup.mockRejectedValueOnce(new Error("disk full"));
    const failed = await request("POST", "/internal/storage-cleanup", secret);
    expect(failed.status).toBe(500);
    expect(failed.body).toEqual({ error: "disk full" });

    runStorageCleanup.mockRejectedValueOnce("nope");
    const plain = await request("POST", "/internal/storage-cleanup", secret);
    expect(plain.body).toEqual({ error: "Cleanup failed" });

    runStorageCleanup.mockResolvedValueOnce(undefined);
    const again = await request("POST", "/internal/storage-cleanup", secret);
    expect(again.status).toBe(200);
    error.mockRestore();
  });
});
