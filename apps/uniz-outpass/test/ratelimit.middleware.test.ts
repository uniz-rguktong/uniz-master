import { describe, expect, it, vi } from "vitest";
import { submissionLimiter } from "../src/middlewares/ratelimit.middleware";

function hit(ip: string) {
  const req: any = {
    ip,
    headers: {},
    app: { get: () => undefined },
    method: "POST",
    path: "/outpass",
    originalUrl: "/outpass",
  };
  const res: any = {
    headersSent: false,
    statusCode: 200,
    status: vi.fn(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    send: vi.fn(function (this: any, body: unknown) {
      this.body = body;
      return this;
    }),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
  };
  const next = vi.fn();
  return submissionLimiter(req, res, next).then(() => ({ res, next }));
}

describe("submissionLimiter", () => {
  it("allows twenty submissions from one address inside the window", async () => {
    for (let i = 0; i < 20; i += 1) {
      const { next, res } = await hit("203.0.113.20");
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it("blocks the twenty-first submission from that address", async () => {
    const { res, next } = await hit("203.0.113.20");
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Too many requests from this IP, please try again after 15 minutes",
      code: "RATE_LIMIT_EXCEEDED",
    });
  });

  it("still allows a different address", async () => {
    const { next } = await hit("203.0.113.21");
    expect(next).toHaveBeenCalledOnce();
  });
});
