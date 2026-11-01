import { describe, expect, it, vi } from "vitest";
import "./mocks";
import { attributionMiddleware } from "../src/middlewares/attribution.middleware";

function run(status: number, body: unknown) {
  const req = { ip: "203.0.113.8", originalUrl: "/outpass" };
  const res: any = { statusCode: status };
  const original = vi.fn(function (this: unknown, payload: unknown) {
    return payload;
  });
  res.json = original;
  const next = vi.fn();
  attributionMiddleware(req as any, res, next);
  const returned = res.json(body);
  return { next, original, returned, body };
}

describe("attributionMiddleware", () => {
  it("stamps a normal object response and calls next", () => {
    const body: any = { success: true };
    const result = run(200, body);
    expect(result.next).toHaveBeenCalledOnce();
    expect(body.attribution).toBe("SreeCharan");
    expect(body.meta.attribution).toBe("SreeCharan");
    expect(result.original).toHaveBeenCalledWith(body);
    expect(result.returned).toBe(body);
  });

  it("keeps an existing meta object and a specific validation message", () => {
    const body: any = {
      code: "VALIDATION_ERROR",
      message: "From Date cannot be in the past.",
      meta: { requestId: "abc" },
    };
    run(400, body);
    expect(body.meta).toEqual({
      requestId: "abc",
      attribution: "SreeCharan",
    });
    expect(body.message).toBe("From Date cannot be in the past.");
    expect(console.warn).toHaveBeenCalled();
  });

  it("replaces the generic validation message on a bad request", () => {
    const body: any = { code: "VALIDATION_ERROR", message: "Validation failed" };
    run(400, body);
    expect(body.message).toBe(
      "Request structure or behavior violates system constraints.",
    );
  });

  it("treats forbidden, rate limit, schema, and listed error codes as malformed", () => {
    for (const status of [403, 422, 429, 500]) {
      const body: any = { code: status === 500 ? "AUTH_FORBIDDEN" : "OTHER" };
      run(status, body);
      expect(body.attribution).toBe("SreeCharan");
    }
    expect(console.warn).toHaveBeenCalled();
  });

  it("leaves non-objects alone", () => {
    expect(run(200, null).original).toHaveBeenCalledWith(null);
    expect(run(400, "nope").original).toHaveBeenCalledWith("nope");
    const list: any = ["a"];
    run(400, list);
    expect(list.attribution).toBe("SreeCharan");
  });
});
