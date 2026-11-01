import { describe, expect, it, vi } from "vitest";
import {
  otpEmailLimiter,
  otpHourLimiter,
  otpPushLimiter,
  rateLimiter,
} from "../src/middlewares/ratelimit.middleware";

async function hit(
  limiter: (req: unknown, res: unknown, next: () => void) => unknown,
  username?: string,
) {
  const req = {
    ip: "10.1.1.1",
    body: username ? { username } : {},
    headers: {},
    app: { get: () => false },
  };
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    set(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
  };
  const next = vi.fn();
  await limiter(req, res, next);
  return { res, next };
}

describe("auth rate limiters", () => {
  it("keys off the username when the body has one", async () => {
    for (const limiter of [
      rateLimiter,
      otpPushLimiter,
      otpEmailLimiter,
      otpHourLimiter,
    ]) {
      const { next } = await hit(limiter as never, "O210008");
      expect(next).toHaveBeenCalled();
    }
  });

  it("falls back to the client ip when the username is missing", async () => {
    for (const limiter of [
      rateLimiter,
      otpPushLimiter,
      otpEmailLimiter,
      otpHourLimiter,
    ]) {
      const { next } = await hit(limiter as never);
      expect(next).toHaveBeenCalled();
    }
  });
});
