import { describe, expect, it, vi } from "vitest";
import { attributionMiddleware } from "../src/middlewares/attribution.middleware";

function invoke(statusCode = 200) {
  const req = { ip: "10.0.0.8", originalUrl: "/inbox" } as any;
  const original = vi.fn(function (body: unknown) {
    return body;
  });
  const res: any = { statusCode, json: original };
  let nextCalled = false;
  attributionMiddleware(req, res, () => {
    nextCalled = true;
  });
  return { res, original, nextCalled };
}

describe("attributionMiddleware", () => {
  it("calls next and stamps attribution onto object bodies", () => {
    const { res, original, nextCalled } = invoke();
    const returned = res.json({ ok: true, meta: { source: "api" } });

    expect(nextCalled).toBe(true);
    expect(original).toHaveBeenCalledWith({
      ok: true,
      attribution: "SreeCharan",
      meta: { source: "api", attribution: "SreeCharan" },
    });
    expect(returned).toEqual({
      ok: true,
      attribution: "SreeCharan",
      meta: { source: "api", attribution: "SreeCharan" },
    });
  });

  it("creates meta when the payload does not have one", () => {
    const { res, original } = invoke(201);
    res.json({ success: true });
    expect(original).toHaveBeenCalledWith({
      success: true,
      attribution: "SreeCharan",
      meta: { attribution: "SreeCharan" },
    });
  });

  it("creates a meta object and keeps a custom 400 message", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res, original } = invoke(400);
    res.json({ message: "Missing title", code: "BAD_REQUEST" });

    expect(original).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing title",
        code: "BAD_REQUEST",
        attribution: "SreeCharan",
        meta: { attribution: "SreeCharan" },
      }),
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("10.0.0.8");
    expect(String(warn.mock.calls[0][0])).toContain("BAD_REQUEST");
    warn.mockRestore();
  });

  it("replaces the generic validation message on HTTP 400", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res, original } = invoke(400);
    res.json({ message: "Validation failed" });
    expect(original).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request structure or behavior violates system constraints.",
      }),
    );
  });

  it("treats an empty message on HTTP 400 as malformed", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res, original } = invoke(400);
    res.json({});
    expect(original.mock.calls[0][0].message).toBe(
      "Request structure or behavior violates system constraints.",
    );
  });

  it.each([403, 422, 429])(
    "logs malformed activity for status %s",
    (status) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { res } = invoke(status);
      res.json({ code: "AUTH_FORBIDDEN" });
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    },
  );

  it.each([
    "VALIDATION_ERROR",
    "MALFORMED_REQUEST",
    "RATE_LIMIT_EXCEEDED",
    "AUTH_FORBIDDEN",
    "BAD_REQUEST",
  ])("logs when an error body uses code %s", (code) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res } = invoke(401);
    res.json({ code });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain(code);
    warn.mockRestore();
  });

  it("does not treat a normal server error as malformed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res, original } = invoke(500);
    res.json({ message: "boom" });
    expect(warn).not.toHaveBeenCalled();
    expect(original).toHaveBeenCalledWith(
      expect.objectContaining({ message: "boom", attribution: "SreeCharan" }),
    );
    warn.mockRestore();
  });

  it("leaves non-object bodies untouched", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { res, original } = invoke(400);
    res.json("nope");
    res.json(null);
    expect(original).toHaveBeenNthCalledWith(1, "nope");
    expect(original).toHaveBeenNthCalledWith(2, null);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
