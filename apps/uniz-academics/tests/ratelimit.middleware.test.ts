import { describe, expect, it, vi } from "vitest";
import Redis from "ioredis";
import { rateLimiter } from "../src/middlewares/ratelimit.middleware";
import { redis } from "../src/utils/redis.util";
import { mockRequest, mockResponse } from "./http";

describe("rateLimiter", () => {
  it("does not open a real Redis connection", () => {
    expect(Redis.instances).toEqual([]);
  });

  it("starts a one-minute window on the first hit", async () => {
    const req = mockRequest({ "x-forwarded-for": "203.0.113.9" });
    const res = mockResponse();
    const next = vi.fn();
    redis.incr.mockResolvedValue(1);

    await rateLimiter(req as any, res as any, next);

    expect(redis.incr).toHaveBeenCalledWith("ratelimit:203.0.113.9");
    expect(redis.expire).toHaveBeenCalledWith("ratelimit:203.0.113.9", 60);
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows the tenth request and blocks the eleventh", async () => {
    const req = mockRequest();
    const next = vi.fn();
    redis.incr.mockResolvedValue(10);
    await rateLimiter(req as any, mockResponse() as any, next);
    expect(next).toHaveBeenCalledOnce();

    redis.incr.mockResolvedValue(11);
    const blocked = mockResponse();
    const blockedNext = vi.fn();
    await rateLimiter(req as any, blocked as any, blockedNext);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toEqual({ error: "Too many requests" });
    expect(blockedNext).not.toHaveBeenCalled();
  });

  it("uses the socket address when no forwarded header is present", async () => {
    const req = mockRequest();
    await rateLimiter(req as any, mockResponse() as any, vi.fn());
    expect(redis.incr).toHaveBeenCalledWith("ratelimit:127.0.0.1");
  });

  it("fails open when Redis throws", async () => {
    redis.incr.mockRejectedValue(new Error("redis down"));
    const next = vi.fn();
    await rateLimiter(mockRequest() as any, mockResponse() as any, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
