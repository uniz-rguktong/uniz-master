import { describe, expect, it, vi } from "vitest";
import { attributionMiddleware } from "../src/middlewares/attribution.middleware";
import { mockRequest, mockResponse } from "./http";

describe("attributionMiddleware", () => {
  it("stamps attribution onto object responses", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();
    attributionMiddleware(req as any, res as any, next);
    res.json({ ok: true });
    expect(next).toHaveBeenCalledOnce();
    expect(res.body).toMatchObject({
      ok: true,
      attribution: "SreeCharan",
      meta: { attribution: "SreeCharan" },
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("rewrites a generic validation failure and logs the request", () => {
    const req = mockRequest();
    const res = mockResponse();
    attributionMiddleware(req as any, res as any, vi.fn());
    res.statusCode = 400;
    res.json({ message: "Validation failed", code: "VALIDATION_ERROR" });
    expect(res.body).toMatchObject({
      message: "Request structure or behavior violates system constraints.",
      attribution: "SreeCharan",
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("keeps a specific error message", () => {
    const req = mockRequest();
    const res = mockResponse();
    attributionMiddleware(req as any, res as any, vi.fn());
    res.statusCode = 403;
    res.json({ message: "Forbidden", code: "AUTH_FORBIDDEN" });
    expect((res.body as { message: string }).message).toBe("Forbidden");
  });

  it("leaves non-object bodies alone", () => {
    const req = mockRequest();
    const res = mockResponse();
    attributionMiddleware(req as any, res as any, vi.fn());
    res.json("ok");
    expect(res.body).toBe("ok");
  });
});
