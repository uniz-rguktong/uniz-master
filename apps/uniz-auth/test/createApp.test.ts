import { afterAll, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

vi.mock("ioredis", () => ({
  default: class Redis {
    on() {
      return this;
    }
  },
}));

vi.mock("bullmq", () => ({
  Queue: class Queue {
    add() {
      return Promise.resolve({ id: "1" });
    }
  },
}));

import { createApp } from "../src/createApp";

describe("createApp", () => {
  const app = createApp();
  let server: Server;
  let base: string;

  server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("test server did not bind a port");
  }
  base = `http://127.0.0.1:${address.port}`;

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  );

  it("answers health with the service name", async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      status: "ok",
      service: "uniz-auth-service",
      attribution: "SreeCharan",
    });
  });

  it("returns a plain logout", async () => {
    const res = await fetch(`${base}/logout`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
  });

  it("404s an unknown route", async () => {
    const res = await fetch(`${base}/missing`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toContain("GET /missing");
  });

  it("sends bad json to the error handler", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal Server Error" });
    error.mockRestore();
  });
});
