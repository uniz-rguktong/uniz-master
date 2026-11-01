import http from "node:http";
import type { Application } from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

import dotenv from "dotenv";

const realListen = http.Server.prototype.listen;
let captured: http.Server | undefined;
let markListening: () => void = () => {};

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(http.Server.prototype, "listen").mockImplementation(function (
  this: http.Server,
  ...args: unknown[]
) {
  captured = this;
  const cb = args.find((arg) => typeof arg === "function") as
    | (() => void)
    | undefined;
  return realListen.call(this, 0, () => {
    cb?.();
    markListening();
  });
});

function request(
  port: number,
  method: string,
  path: string,
  headers: Record<string, string> = {},
) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, method, path, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.setTimeout(4000, () => req.destroy(new Error(`timeout ${method} ${path}`)));
    req.on("error", reject);
    req.end();
  });
}

describe("uniz-api dispatch", () => {
  let port = 0;
  let app: Application;
  const priorSignals = new Set(process.listeners("SIGTERM"));

  beforeAll(async () => {
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.JWT_SECRET;
    const ready = new Promise<void>((resolve) => {
      markListening = resolve;
    });
    const mod = await import("../src/index.ts");
    app = mod.default;
    await ready;
    const address = captured?.address();
    if (!address || typeof address === "string") throw new Error("api did not listen");
    port = address.port;
  });

  afterAll(async () => {
    for (const listener of process.listeners("SIGTERM")) {
      if (!priorSignals.has(listener)) {
        process.removeListener("SIGTERM", listener);
      }
    }
    if (captured?.listening) {
      await new Promise<void>((resolve) => captured!.close(() => resolve()));
    }
  });

  it("does not load dotenv files and keeps the proxy trust setting", () => {
    expect(dotenv.config).toHaveBeenCalledWith({ override: true });
    expect(app.get("trust proxy")).toBe(1);
    expect(captured?.keepAliveTimeout).toBe(65000);
    expect(captured?.headersTimeout).toBe(66000);
  });

  it("answers /health without an upstream header", async () => {
    const res = await request(port, "GET", "/health", {
      "x-uniz-service": "nope",
    });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      status: "ok",
      service: "uniz-api",
      modules: ["auth", "user", "academics"],
    });
  });

  it("rejects a missing header and an unknown module", async () => {
    const missing = await request(port, "GET", "/login");
    expect(missing.status).toBe(400);
    expect(JSON.parse(missing.body).error).toContain("Missing X-Uniz-Service");

    const blank = await request(port, "GET", "/login", { "x-uniz-service": "  " });
    expect(blank.status).toBe(400);

    const unknown = await request(port, "GET", "/login", {
      "x-uniz-service": "billing",
    });
    expect(unknown.status).toBe(404);
    expect(JSON.parse(unknown.body)).toEqual({ error: "Unknown module: billing" });
  });

  it.each([
    ["auth", "auth"],
    ["AUTH", "auth"],
    [" academics ", "academics"],
    ["profile", "user"],
    ["cms", "user"],
    ["files", "user"],
    ["grievance", "user"],
    ["user", "user"],
    ["User", "user"],
  ])("routes %s to the %s module", async (header, moduleName) => {
    const res = await request(port, "POST", "/login?next=/home", {
      "x-uniz-service": header,
    });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      module: moduleName,
      url: "/login?next=/home",
      method: "POST",
    });
  });

  it("closes on SIGTERM", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as typeof process.exit);
    const handler = process
      .listeners("SIGTERM")
      .find((listener) => !priorSignals.has(listener));
    expect(handler).toBeTypeOf("function");
    handler!();
    await vi.waitFor(() => {
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
    expect(console.log).toHaveBeenCalledWith(
      "SIGTERM received. Shutting down uniz-api...",
    );
    exitSpy.mockRestore();
  });
});
