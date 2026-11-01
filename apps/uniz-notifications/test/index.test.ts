import express from "express";
import type { Server } from "node:http";
import { afterAll, describe, expect, it, vi } from "vitest";
import { request } from "./http";

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
  config: vi.fn(),
}));

vi.mock("ioredis", () => ({
  default: class {
    on() {
      return this;
    }
    quit() {
      return Promise.resolve("OK");
    }
    disconnect() {}
  },
}));

vi.mock("../src/utils/prisma.util", () => ({ default: {} }));

vi.mock("../src/worker/notification.worker", () => ({
  createNotificationWorker: vi.fn(() => {
    (globalThis as { __notificationWorkerCalls?: number }).__notificationWorkerCalls =
      ((globalThis as { __notificationWorkerCalls?: number }).__notificationWorkerCalls ||
        0) + 1;
    return { worker: { on() {}, opts: {} }, notificationQueue: {} };
  }),
}));

const servers: Server[] = [];
const originalListen = express.application.listen;
express.application.listen = function (this: express.Application, ...args: any[]) {
  const callback = args.find((arg) => typeof arg === "function");
  const server = originalListen.call(this, 0, callback) as unknown as Server;
  server.unref();
  servers.push(server);
  return server as any;
};

const signalBefore = new Set(process.listeners("SIGTERM"));
const index = await import("../src/index");
express.application.listen = originalListen;
for (const listener of process.listeners("SIGTERM")) {
  if (!signalBefore.has(listener)) process.removeListener("SIGTERM", listener);
}

afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => server.close(() => resolve())),
    ),
  );
});

describe("notification service bootstrap", () => {
  it("starts the worker and answers health, root, and unknown routes", async () => {
    expect(
      (globalThis as { __notificationWorkerCalls?: number }).__notificationWorkerCalls,
    ).toBe(1);
    const app = index.default;

    const root = await request(app, "GET", "/");
    expect(root.status).toBe(200);
    expect(root.body).toMatchObject({
      service: "uniz-notification-service",
      status: "running",
      vapidPublicKey: null,
      attribution: "SreeCharan",
      endpoints: { health: "/health", subscribe: "/subscribe", mailSend: "/send" },
    });

    const health = await request(app, "GET", "/health");
    expect(health.body).toMatchObject({
      status: "ok",
      service: "uniz-notification-service",
      capabilities: ["push", "inbox", "mail"],
      attribution: "SreeCharan",
    });

    const missing = await request(app, "GET", "/no-such-route");
    expect(missing.status).toBe(404);
    expect(missing.body.message).toContain("GET /no-such-route");
    expect(missing.body.attribution).toBe("SreeCharan");
    expect(missing.body.timestamp).toEqual(expect.any(String));
  });
});
