import { describe, expect, it } from "vitest";
import { ErrorCode as SharedErrorCode } from "@uniz/shared";
import { UserRole as SharedUserRole } from "@uniz/shared";
import { JwtPayloadSchema as SharedJwtPayloadSchema } from "@uniz/shared";
import {
  ApprovalLogEntrySchema,
  ApprovalLogsSchema,
} from "../src/shared/approval-log.schema";
import { ErrorCode } from "../src/shared/error-codes";
import { JwtPayloadSchema } from "../src/shared/jwt.schema";
import {
  OutingRequestSchema,
  OutingResponseSchema,
  OutpassRequestSchema,
  OutpassResponseSchema,
} from "../src/shared/outpass.schema";
import { UserRole } from "../src/shared/roles.enum";

const stamp = "2026-06-15T12:00:00.000Z";
const responseBase = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  studentId: "O190001",
  reason: "Going home",
  requestedTime: stamp,
  issuedTime: stamp,
  rejectedTime: stamp,
  inTime: stamp,
};

describe("outpass schemas", () => {
  it("re-exports shared error codes, roles, and jwt payload rules", () => {
    expect(ErrorCode).toBe(SharedErrorCode);
    expect(UserRole).toBe(SharedUserRole);
    expect(JwtPayloadSchema).toBe(SharedJwtPayloadSchema);
    expect(ErrorCode.OUTPASS_ALREADY_APPROVED).toBe("OUTPASS_ALREADY_APPROVED");
    expect(UserRole.CARETAKER_FEMALE).toBe("caretaker_female");
  });

  it("accepts an outpass request with a reason of three characters", () => {
    const parsed = OutpassRequestSchema.parse({
      reason: "abc",
      fromDay: stamp,
      toDay: stamp,
    });
    expect(parsed.userId).toBeUndefined();
    expect(parsed.reason).toBe("abc");
  });

  it("rejects a short reason, a date-only string, and a missing end date", () => {
    expect(
      OutpassRequestSchema.safeParse({
        reason: "no",
        fromDay: stamp,
        toDay: stamp,
      }).success,
    ).toBe(false);
    expect(
      OutpassRequestSchema.safeParse({
        reason: "home",
        fromDay: "2026-06-15",
        toDay: stamp,
      }).success,
    ).toBe(false);
    expect(
      OutingRequestSchema.safeParse({
        reason: "lab",
        fromTime: stamp,
      }).success,
    ).toBe(false);
  });

  it("keeps an optional user id on outing requests", () => {
    const parsed = OutingRequestSchema.parse({
      userId: "o190001",
      reason: "library",
      fromTime: stamp,
      toTime: stamp,
    });
    expect(parsed.userId).toBe("o190001");
  });

  it("fills response defaults and accepts nullable approval logs", () => {
    const outpass = OutpassResponseSchema.parse({
      ...responseBase,
      fromDay: stamp,
      toDay: stamp,
      approvalLogs: null,
    });
    expect(outpass).toMatchObject({
      days: 0,
      isExpired: false,
      isApproved: false,
      issuedBy: "none",
      isRejected: false,
      rejectedBy: "none",
      currentLevel: "caretaker",
      approvalLogs: null,
    });

    const outing = OutingResponseSchema.parse({
      ...responseBase,
      fromTime: stamp,
      toTime: stamp,
    });
    expect(outing.hours).toBe(0);
    expect(outing.currentLevel).toBe("caretaker");
  });

  it("rejects an outpass response id that is not a uuid", () => {
    expect(
      OutpassResponseSchema.safeParse({
        ...responseBase,
        id: "not-a-uuid",
        fromDay: stamp,
        toDay: stamp,
      }).success,
    ).toBe(false);
  });

  it("validates approval log status and timestamp", () => {
    const entry = ApprovalLogEntrySchema.parse({
      level: "caretaker_male",
      status: "forwarded",
      timestamp: stamp,
    });
    expect(entry.approverId).toBeUndefined();
    expect(ApprovalLogsSchema.parse([entry])).toHaveLength(1);

    expect(
      ApprovalLogEntrySchema.safeParse({
        level: "caretaker_male",
        status: "skipped",
        timestamp: stamp,
      }).success,
    ).toBe(false);
    expect(
      ApprovalLogEntrySchema.safeParse({
        level: "caretaker_male",
        status: "approved",
        timestamp: "yesterday",
      }).success,
    ).toBe(false);
    expect(ApprovalLogsSchema.safeParse({}).success).toBe(false);
  });
});
