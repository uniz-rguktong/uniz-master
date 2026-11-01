import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ErrorCode } from "../src/shared/error-codes";
import { validateRequest } from "../src/middlewares/validation.middleware";
import { mockRequest, mockResponse } from "./http";

describe("validateRequest", () => {
  const schema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
  });

  it("passes a body that matches the schema", () => {
    const req = mockRequest();
    req.body = { studentId: "O210008" };
    const res = mockResponse();
    const next = vi.fn();

    validateRequest(schema)(req as any, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it("returns the first schema message as a validation error", () => {
    const req = mockRequest();
    req.body = { studentId: "" };
    const res = mockResponse();
    const next = vi.fn();

    validateRequest(schema)(req as any, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Student ID is required",
    });
  });

  it("forwards errors that are not schema failures", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();
    const boom = new Error("explode");
    const broken = {
      parse() {
        throw boom;
      },
    } as unknown as z.ZodSchema;

    validateRequest(broken)(req as any, res as any, next);

    expect(next).toHaveBeenCalledWith(boom);
    expect(res.statusCode).toBe(200);
  });
});
