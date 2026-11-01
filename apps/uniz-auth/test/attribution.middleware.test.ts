import { afterEach, describe, expect, it, vi } from "vitest";
import { attributionMiddleware } from "../src/middlewares/attribution.middleware";

function decorate(statusCode: number) {
  const req = { ip: "127.0.0.1", originalUrl: "/login" };
  let captured: ((body: unknown) => unknown) | undefined;
  const res = {
    statusCode,
    json(body: unknown) {
      return body;
    },
  };
  const original = res.json.bind(res);
  res.json = original;
  const next = vi.fn();
  attributionMiddleware(req as never, res as never, next);
  captured = res.json.bind(res);
  expect(next).toHaveBeenCalledOnce();
  return captured;
}

describe("attributionMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stamps attribution on object responses", () => {
    const json = decorate(200);
    expect(json({ success: true })).toMatchObject({
      success: true,
      attribution: "SreeCharan",
      meta: { attribution: "SreeCharan" },
    });
  });

  it("leaves non objects alone", () => {
    const json = decorate(200);
    expect(json("ok")).toBe("ok");
    expect(json(null)).toBeNull();
  });

  it("replaces the generic validation message and logs malformed activity", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const json = decorate(400);
    const body = json({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
    });
    expect(body).toMatchObject({
      message: "Request structure or behavior violates system constraints.",
      code: "VALIDATION_ERROR",
      attribution: "SreeCharan",
    });
    expect(warn).toHaveBeenCalled();
  });

  it("keeps a specific 400 message", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const json = decorate(400);
    const body = json({
      message: "Username is required",
      code: "VALIDATION_ERROR",
    });
    expect((body as { message: string }).message).toBe("Username is required");
  });

  it("logs rate limit and forbidden responses", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const limited = decorate(429);
    limited({ code: "RATE_LIMIT_EXCEEDED", message: "slow down" });
    const forbidden = decorate(403);
    forbidden({ code: "AUTH_FORBIDDEN", message: "no" });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
