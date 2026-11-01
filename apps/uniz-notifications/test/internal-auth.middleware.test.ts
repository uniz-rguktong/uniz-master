import { describe, expect, it } from "vitest";
import { internalAuthMiddleware } from "../src/mail/middlewares/internal-auth.middleware";
import { INTERNAL_SECRET } from "./auth-token";

function run(secret?: string) {
  const req = {
    headers: secret === undefined ? {} : { "x-internal-secret": secret },
  } as any;
  const res: any = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  internalAuthMiddleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

describe("internalAuthMiddleware", () => {
  it("rejects a missing or wrong secret", () => {
    expect(run().res.statusCode).toBe(403);
    expect(run().res.body).toEqual({
      success: false,
      message: "Forbidden: Internal service access only",
    });
    expect(run("nope").nextCalled).toBe(false);
  });

  it("allows the configured internal secret", () => {
    const { nextCalled, res } = run(INTERNAL_SECRET);
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(200);
  });
});
