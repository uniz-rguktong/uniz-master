import { describe, expect, it } from "vitest";
import { enforcePublishOtpRateLimit } from "../src/middlewares/publish-otp-ratelimit.middleware";
import { redis } from "../src/utils/redis.util";
import { mockResponse } from "./http";

describe("enforcePublishOtpRateLimit", () => {
  it("allows a request inside the minute and hour caps", async () => {
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const res = mockResponse();
    await expect(
      enforcePublishOtpRateLimit("Ada", "SEM-1", res as any),
    ).resolves.toBe(true);
    expect(redis.incr).toHaveBeenNthCalledWith(1, "publish-otp:min:ada:SEM-1");
    expect(redis.expire).toHaveBeenCalledWith("publish-otp:min:ada:SEM-1", 60);
    expect(redis.incr).toHaveBeenNthCalledWith(2, "publish-otp:hour:ada");
    expect(res.statusCode).toBe(200);
  });

  it("stops at two codes per minute for one semester", async () => {
    redis.incr.mockResolvedValue(3);
    const res = mockResponse();
    await expect(
      enforcePublishOtpRateLimit("Ada", "SEM-1", res as any),
    ).resolves.toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ code: "PUBLISH_OTP_MINUTE_LIMIT" });
    expect(redis.incr).toHaveBeenCalledTimes(1);
  });

  it("stops at ten codes per hour", async () => {
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(11);
    const res = mockResponse();
    await expect(
      enforcePublishOtpRateLimit("Ada", "SEM-1", res as any),
    ).resolves.toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({
      code: "PUBLISH_OTP_HOUR_LIMIT",
      retryAfterSeconds: 3600,
    });
  });

  it("fails open when Redis throws", async () => {
    redis.incr.mockRejectedValue(new Error("redis down"));
    const res = mockResponse();
    await expect(
      enforcePublishOtpRateLimit("Ada", "SEM-1", res as any),
    ).resolves.toBe(true);
  });
});
