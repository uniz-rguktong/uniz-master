import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateRequest } from "../src/middlewares/validation.middleware";
import { ErrorCode } from "../src/shared/error-codes";

function run(schema: { parse: (body: unknown) => unknown }, body: unknown) {
  const req = { body };
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
  };
  const next = vi.fn();
  validateRequest(schema as never)(req as never, res as never, next);
  return { res, next };
}

describe("validateRequest", () => {
  const schema = z.object({
    username: z.string().min(1, "Username is required"),
  });

  it("calls next when the body matches", () => {
    const { next, res } = run(schema, { username: "o210008" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("returns the first zod message", () => {
    const { next, res } = run(schema, { username: "" });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Username is required",
    });
  });

  it("forwards errors that are not validation failures", () => {
    const boom = new Error("boom");
    const { next } = run(
      {
        parse() {
          throw boom;
        },
      },
      {},
    );
    expect(next).toHaveBeenCalledWith(boom);
  });
});
