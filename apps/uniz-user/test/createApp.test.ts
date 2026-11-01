import http from "http";
import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/createApp";
import { redisMock } from "./mocks";

describe("createApp", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves health and a 404 with attribution", async () => {
    const startup: Array<() => Promise<void> | void> = [];
    const realSetTimeout = global.setTimeout;
    vi.spyOn(global, "setTimeout").mockImplementation(((fn: TimerHandler, ms?: number, ...args: any[]) => {
      if (ms === 5000 && typeof fn === "function") {
        startup.push(fn as () => void);
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
      return realSetTimeout(fn as any, ms as any, ...args);
    }) as typeof setTimeout);

    redisMock.llen.mockResolvedValue(0);
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      const body = await health.json();
      expect(body.status).toBe("ok");
      expect(body.service).toBe("uniz-user-service");
      expect(body.attribution).toBe("SreeCharan");
      expect(body.meta.attribution).toBe("SreeCharan");

      const bearer = jwt.sign(
        { id: "u1", username: "O240001", role: "student" },
        "unit-test-jwt-secret",
      );
      const missing = await fetch(`http://127.0.0.1:${port}/no-such-route`, {
        headers: { authorization: `Bearer ${bearer}` },
      });
      expect(missing.status).toBe(404);
      const missingBody = await missing.json();
      expect(missingBody.message).toContain("GET /no-such-route");

      await startup[0]?.();
      expect(redisMock.llen).toHaveBeenCalledWith("student:job:queue");

      redisMock.llen.mockResolvedValue(1);
      redisMock.lpop.mockResolvedValueOnce(
        JSON.stringify({ rows: [], total: 0, username: "web" }),
      );
      await startup[0]?.();
      expect(redisMock.lpop).toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
