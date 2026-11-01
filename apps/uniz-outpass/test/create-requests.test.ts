import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosMock, prisma } from "./mocks";
import { baseReq, mockRes, utcHour } from "./http";
import { createOuting, createOutpass } from "../src/controllers/request.controller";
import { ErrorCode } from "../src/shared/error-codes";
import { UserRole } from "../src/shared/roles.enum";

function profile(partial: Record<string, unknown>) {
  axiosMock.get.mockResolvedValue({
    data: {
      student: {
        is_in_campus: true,
        has_pending_requests: false,
        gender: "M",
        ...partial,
      },
    },
  });
}

describe("createOutpass", () => {
  const fromDay = utcHour(1, 12).toISOString();
  const toDay = utcHour(3, 12).toISOString();
  const body = { reason: "Going home", fromDay, toDay };

  beforeEach(() => {
    prisma.outpass.create.mockResolvedValue({ id: "outpass-1", studentId: "O190001" });
  });

  it("rejects a missing user before looking at the body", async () => {
    const res = mockRes();
    await createOutpass(baseReq({ user: undefined, body }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ code: ErrorCode.AUTH_UNAUTHORIZED });
    expect(prisma.outpass.create).not.toHaveBeenCalled();
  });

  it("rejects a reason that is too short", async () => {
    const res = mockRes();
    await createOutpass(baseReq({ body: { ...body, reason: "no" } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(prisma.outpass.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a from date before today", async () => {
    const res = mockRes();
    await createOutpass(
      baseReq({
        body: { ...body, fromDay: utcHour(-1, 12).toISOString() },
      }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: ErrorCode.VALIDATION_ERROR,
      message: "From Date cannot be in the past.",
    });
  });

  it("rejects a to date that is earlier than the from date", async () => {
    const res = mockRes();
    await createOutpass(
      baseReq({
        body: {
          reason: "Going home",
          fromDay: utcHour(2, 12).toISOString(),
          toDay: utcHour(1, 12).toISOString(),
        },
      }),
      res,
    );
    expect(res.json).toHaveBeenCalledWith({
      code: ErrorCode.VALIDATION_ERROR,
      message: "To Date cannot be before From Date.",
    });
  });

  it("counts a same-day request as one day and a longer span through the end of the last day", async () => {
    const res = mockRes();
    const same = utcHour(1, 12).toISOString();
    await createOutpass(
      baseReq({ body: { reason: "Going home", fromDay: same, toDay: same } }),
      res,
    );
    expect(prisma.outpass.create.mock.calls[0][0].data.days).toBe(1);

    prisma.outpass.create.mockClear();
    const end = utcHour(0, 23, 59);
    end.setUTCSeconds(59, 999);
    const endIso = end.toISOString();
    await createOutpass(
      baseReq({ body: { reason: "Going home", fromDay: endIso, toDay: endIso } }),
      mockRes(),
    );
    expect(prisma.outpass.create.mock.calls[0][0].data.days).toBe(1);

    prisma.outpass.create.mockClear();
    await createOutpass(baseReq({ body }), mockRes());
    const data = prisma.outpass.create.mock.calls[0][0].data;
    expect(data.days).toBe(3);
    expect(data.toDay.getUTCHours()).toBe(23);
    expect(data.toDay.getUTCMinutes()).toBe(59);
    expect(data.fromDay.toISOString()).toBe(fromDay);
  });

  it("refuses a student who is already out of campus after expiring stale rows", async () => {
    profile({ is_in_campus: false });
    const res = mockRes();
    await createOutpass(baseReq({ body }), res);
    expect(prisma.outpass.updateMany).toHaveBeenCalledWith({
      where: {
        studentId: "O190001",
        isExpired: false,
        toDay: { lt: expect.any(Date) },
        checkedOutTime: null,
      },
      data: { isExpired: true },
    });
    expect(prisma.outing.updateMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe(
      "You are already marked as OUT of campus.",
    );
    expect(prisma.outpass.create).not.toHaveBeenCalled();
  });

  it("blocks a second request when the profile is pending and an active row exists", async () => {
    profile({ has_pending_requests: true });
    prisma.outpass.findFirst.mockResolvedValueOnce({ id: "active" });
    const res = mockRes();
    await createOutpass(baseReq({ body }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      code: ErrorCode.RESOURCE_ALREADY_EXISTS,
      message:
        "You already have a pending/active request (Profile indicates Pending).",
    });
    expect(prisma.outpass.create).not.toHaveBeenCalled();
  });

  it("clears a stuck pending flag when the profile is pending but nothing is active", async () => {
    profile({ has_pending_requests: true, gender: "F" });
    const res = mockRes();
    await createOutpass(baseReq({ body }), res);
    expect(axiosMock.put).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/student/status",
      { username: "o190001", isPending: false },
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
      }),
    );
    expect(prisma.outpass.create).toHaveBeenCalled();
    const created = prisma.outpass.create.mock.calls[0][0].data;
    expect(created.studentGender).toBe("F");
    expect(created.currentLevel).toBe(UserRole.CARETAKER_FEMALE);
  });

  it("blocks when the local tables already have an active outing", async () => {
    prisma.outing.findFirst.mockResolvedValueOnce({ id: "outing-active" });
    const res = mockRes();
    await createOutpass(baseReq({ body }), res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toBe(
      "You already have a pending request (Outpass or Outing).",
    );
  });

  it("creates a male caretaker request and notifies the student", async () => {
    const res = mockRes();
    await createOutpass(
      baseReq({
        user: {
          id: "user-1",
          username: "o190001",
          role: "student",
          email: "o190001@rguktong.ac.in",
          name: "Ada",
        },
        body,
      }),
      res,
    );

    const created = prisma.outpass.create.mock.calls[0][0].data;
    expect(created).toMatchObject({
      studentId: "O190001",
      studentGender: "M",
      reason: "Going home",
      days: 3,
      approvalLogs: [],
      currentLevel: UserRole.CARETAKER_MALE,
    });
    expect(axiosMock.put).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/student/status",
      { username: "o190001", isPending: true },
      expect.any(Object),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: "outpass-1", studentId: "O190001" },
    });

    await vi.waitFor(() => {
      expect(axiosMock.post).toHaveBeenCalled();
    });
    expect(axiosMock.post).toHaveBeenCalledWith(
      "http://notify.test/push/send",
      expect.objectContaining({
        target: "user",
        username: "Ada",
        title: "Outpass Request Submitted",
      }),
      expect.objectContaining({
        headers: { "x-internal-secret": "test-internal" },
        timeout: 5000,
      }),
    );
  });

  it("falls back to the body gender when the profile check fails", async () => {
    axiosMock.get.mockRejectedValue(new Error("profile down"));
    const res = mockRes();
    await createOutpass(
      baseReq({ body: { ...body, studentGender: "female" } }),
      res,
    );
    expect(prisma.outpass.create.mock.calls[0][0].data).toMatchObject({
      studentGender: "F",
      currentLevel: UserRole.CARETAKER_FEMALE,
    });
  });

  it("returns 500 when the insert fails", async () => {
    prisma.outpass.create.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await createOutpass(baseReq({ body }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });
});

describe("createOuting", () => {
  function outingBody(from: Date, to: Date, reason = "Bank work") {
    return {
      reason,
      fromTime: from.toISOString(),
      toTime: to.toISOString(),
    };
  }

  it("rejects a missing user and an invalid payload", async () => {
    const res = mockRes();
    await createOuting(baseReq({ user: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);

    const bad = mockRes();
    await createOuting(baseReq({ body: { reason: "x" } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);
    expect(bad.json.mock.calls[0][0].code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("rejects a start in the past, an end before the start, and a span past midnight", async () => {
    const past = mockRes();
    await createOuting(
      baseReq({
        body: outingBody(new Date(Date.now() - 60 * 60 * 1000), utcHour(1, 18)),
      }),
      past,
    );
    expect(past.json.mock.calls[0][0].message).toBe(
      "From Time cannot be in the past.",
    );

    const order = mockRes();
    await createOuting(
      baseReq({
        body: outingBody(utcHour(1, 15), utcHour(1, 13)),
      }),
      order,
    );
    expect(order.json.mock.calls[0][0].message).toBe(
      "To Time cannot be before From Time.",
    );

    const span = mockRes();
    await createOuting(
      baseReq({
        body: outingBody(utcHour(1, 18), utcHour(2, 9)),
      }),
      span,
    );
    expect(span.json.mock.calls[0][0].message).toBe(
      "Outing cannot span multiple days. Please take an Outpass instead.",
    );
    expect(prisma.outing.create).not.toHaveBeenCalled();
  });

  it("rounds the duration up to whole hours", async () => {
    prisma.outing.create.mockResolvedValue({ id: "outing-1" });
    const res = mockRes();
    const from = utcHour(1, 8);
    const to = new Date(from.getTime() + 150 * 60 * 1000);
    await createOuting(baseReq({ body: outingBody(from, to) }), res);
    expect(prisma.outing.create.mock.calls[0][0].data.hours).toBe(3);

    prisma.outing.create.mockClear();
    const exact = utcHour(1, 9);
    await createOuting(
      baseReq({
        body: outingBody(exact, new Date(exact.getTime() + 60 * 60 * 1000)),
      }),
      mockRes(),
    );
    expect(prisma.outing.create.mock.calls[0][0].data.hours).toBe(1);

    prisma.outing.create.mockClear();
    const over = utcHour(1, 10);
    await createOuting(
      baseReq({
        body: outingBody(over, new Date(over.getTime() + 61 * 60 * 1000)),
      }),
      mockRes(),
    );
    expect(prisma.outing.create.mock.calls[0][0].data.hours).toBe(2);
  });

  it("refuses students who are out or already have an active outpass", async () => {
    profile({ is_in_campus: false });
    const outside = mockRes();
    const from = utcHour(1, 8);
    await createOuting(
      baseReq({ body: outingBody(from, new Date(from.getTime() + 60 * 60 * 1000)) }),
      outside,
    );
    expect(outside.status).toHaveBeenCalledWith(403);

    profile({ is_in_campus: true, has_pending_requests: false });
    prisma.outpass.findFirst.mockResolvedValueOnce({ id: "still-open" });
    const clash = mockRes();
    await createOuting(
      baseReq({ body: outingBody(from, new Date(from.getTime() + 60 * 60 * 1000)) }),
      clash,
    );
    expect(clash.status).toHaveBeenCalledWith(409);
    expect(clash.json.mock.calls[0][0].message).toBe(
      "You already have a pending request (Outpass or Outing).",
    );
  });

  it("self-heals a stuck pending flag and then stores a female outing", async () => {
    profile({ has_pending_requests: true, gender: "female" });
    prisma.outing.create.mockResolvedValue({ id: "outing-2" });
    const from = utcHour(1, 8);
    const res = mockRes();
    await createOuting(
      baseReq({ body: outingBody(from, new Date(from.getTime() + 60 * 60 * 1000)) }),
      res,
    );
    expect(axiosMock.put.mock.calls[0][1]).toEqual({
      username: "o190001",
      isPending: false,
    });
    expect(prisma.outing.create.mock.calls[0][0].data).toMatchObject({
      studentId: "O190001",
      studentGender: "F",
      hours: 1,
      currentLevel: UserRole.CARETAKER_FEMALE,
      approvalLogs: [],
    });
    expect(res.json.mock.calls[0][0].success).toBe(true);
    await vi.waitFor(() => {
      expect(axiosMock.post.mock.calls[0][1].title).toBe(
        "Outing Request Submitted",
      );
    });
  });

  it("keeps the pending conflict when an active row is still open", async () => {
    profile({ has_pending_requests: true });
    prisma.outing.findFirst.mockResolvedValueOnce({ id: "open-outing" });
    const from = utcHour(1, 8);
    const res = mockRes();
    await createOuting(
      baseReq({ body: outingBody(from, new Date(from.getTime() + 60 * 60 * 1000)) }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.outing.create).not.toHaveBeenCalled();
  });

  it("returns 500 when saving the outing throws", async () => {
    prisma.outing.create.mockRejectedValue(new Error("db down"));
    const from = utcHour(1, 8);
    const res = mockRes();
    await createOuting(
      baseReq({ body: outingBody(from, new Date(from.getTime() + 60 * 60 * 1000)) }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });
});
