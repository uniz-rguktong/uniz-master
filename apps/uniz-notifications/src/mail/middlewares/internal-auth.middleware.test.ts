import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { internalAuthMiddleware } from "./internal-auth.middleware";

const ORIGINAL = process.env.INTERNAL_SECRET;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.INTERNAL_SECRET;
  } else {
    process.env.INTERNAL_SECRET = ORIGINAL;
  }
});

function run(header?: string | string[]) {
  const headers: Record<string, string | string[]> = {};
  if (header !== undefined) headers["x-internal-secret"] = header;
  const req = { headers } as Request;
  let statusCode = 0;
  let body: { success?: boolean; message?: string } | undefined;
  let nextCalled = false;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: { success?: boolean; message?: string }) {
      body = payload;
      return this;
    },
  } as unknown as Response;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;
  internalAuthMiddleware(req, res, next);
  return { statusCode, body, nextCalled };
}

describe("mail internal auth", () => {
  it("refuses with 503 when INTERNAL_SECRET is unset and does not accept a default", () => {
    delete process.env.INTERNAL_SECRET;
    const missing = run("uniz-core");
    assert.equal(missing.statusCode, 503);
    assert.equal(missing.nextCalled, false);

    process.env.INTERNAL_SECRET = "   ";
    const blank = run("uniz-core");
    assert.equal(blank.statusCode, 503);
    assert.equal(blank.nextCalled, false);
  });

  it("returns 403 when the header does not match", () => {
    process.env.INTERNAL_SECRET = "configured-secret";
    const result = run("other-secret");
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
    assert.match(result.body?.message || "", /Forbidden/);
  });

  it("continues when the header matches the configured secret", () => {
    process.env.INTERNAL_SECRET = "configured-secret";
    const result = run("configured-secret");
    assert.equal(result.nextCalled, true);
    assert.equal(result.statusCode, 0);
  });
});
