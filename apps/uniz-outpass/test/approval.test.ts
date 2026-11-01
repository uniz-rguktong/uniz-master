import { describe, expect, it } from "vitest";
import { axiosMock, prisma } from "./mocks";
import { baseReq, mockRes, openRequest } from "./http";
import { approveOutpass, rejectOutpass } from "../src/controllers/request.controller";
import { ErrorCode } from "../src/shared/error-codes";
import { UserRole } from "../src/shared/roles.enum";

function staff(role: string, extra: Record<string, unknown> = {}) {
  return baseReq({
    user: {
      id: "staff-1",
      username: "staffuser",
      role,
      email: "staffuser@rguktong.ac.in",
    },
    params: { id: "req-1" },
    body: {},
    originalUrl: "/req-1/approve",
    ...extra,
  });
}

function stub(type: "outpass" | "outing", data: Record<string, unknown>) {
  if (type === "outpass") {
    prisma.outpass.findUnique.mockResolvedValue(data);
    prisma.outing.findUnique.mockResolvedValue(null);
    prisma.outpass.update.mockImplementation(async (args: any) => ({
      ...data,
      ...args.data,
    }));
  } else {
    prisma.outpass.findUnique.mockResolvedValue(null);
    prisma.outing.findUnique.mockResolvedValue(data);
    prisma.outing.update.mockImplementation(async (args: any) => ({
      ...data,
      ...args.data,
    }));
  }
}

describe("approveOutpass", () => {
  it("requires a signed-in user and a real request", async () => {
    const missing = mockRes();
    await approveOutpass(staff(UserRole.CARETAKER_MALE, { user: undefined }), missing);
    expect(missing.status).toHaveBeenCalledWith(401);

    const absent = mockRes();
    await approveOutpass(staff(UserRole.CARETAKER_MALE), absent);
    expect(absent.status).toHaveBeenCalledWith(404);
    expect(absent.json).toHaveBeenCalledWith({ code: ErrorCode.RESOURCE_NOT_FOUND });
  });

  it("refuses a request that is already approved, rejected, or expired", async () => {
    for (const flag of ["isApproved", "isRejected", "isExpired"] as const) {
      stub("outpass", openRequest({ [flag]: true }));
      const res = mockRes();
      await approveOutpass(staff(UserRole.CARETAKER_MALE), res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json.mock.calls[0][0]).toMatchObject({
        code: ErrorCode.OUTPASS_ALREADY_APPROVED,
        message: "Request already finalized",
      });
    }
  });

  it("blocks caretaker_female for every student because that role also contains male", async () => {
    stub("outpass", openRequest({ studentGender: "F", currentLevel: UserRole.CARETAKER_FEMALE }));
    const res = mockRes();
    await approveOutpass(staff(UserRole.CARETAKER_FEMALE), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Male staff can only approve male requests",
    );
  });

  it("keeps female and male staff on their own students", async () => {
    stub("outpass", openRequest({ studentGender: "M", currentLevel: UserRole.CARETAKER_FEMALE }));
    const female = mockRes();
    await approveOutpass(staff(UserRole.CARETAKER_FEMALE), female);
    expect(female.status).toHaveBeenCalledWith(403);
    expect(female.json.mock.calls[0][0].message).toBe(
      "Female staff can only approve female requests",
    );

    stub("outpass", openRequest({ studentGender: "F", currentLevel: UserRole.WARDEN_MALE }));
    const male = mockRes();
    await approveOutpass(staff(UserRole.WARDEN_MALE), male);
    expect(male.json.mock.calls[0][0].message).toBe(
      "Male staff can only approve male requests",
    );
  });

  it("enforces the current approval level", async () => {
    stub("outpass", openRequest({ currentLevel: UserRole.WARDEN_MALE }));
    const res = mockRes();
    await approveOutpass(staff(UserRole.CARETAKER_MALE), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Strict Hierarchy: This request is currently at warden_male level. You (caretaker_male) cannot process it.",
    );
  });

  it("lets a caretaker approve outright or forward to the matching warden", async () => {
    stub("outpass", openRequest());
    const approved = mockRes();
    await approveOutpass(
      staff(UserRole.CARETAKER_MALE, { body: { comment: "ok to go" } }),
      approved,
    );
    const approvedData = prisma.outpass.update.mock.calls[0][0].data;
    expect(approvedData.isApproved).toBe(true);
    expect(approvedData.issuedBy).toBe("staffuser");
    expect(approvedData.issuedTime).toBeInstanceOf(Date);
    expect(approvedData.currentLevel).toBe(UserRole.CARETAKER_MALE);
    expect(approvedData.approvalLogs[0]).toMatchObject({
      level: UserRole.CARETAKER_MALE,
      approverId: "staff-1",
      status: "approved",
      comment: "ok to go",
    });
    expect(approved.json.mock.calls[0][0].success).toBe(true);

    stub("outpass", openRequest({ studentGender: "F", currentLevel: UserRole.CARETAKER }));
    const forwardedRes = mockRes();
    await approveOutpass(
      staff(UserRole.CARETAKER, { originalUrl: "/req-1/forward" }),
      forwardedRes,
    );
    expect(forwardedRes.status).not.toHaveBeenCalled();
    const forwarded = prisma.outpass.update.mock.calls.at(-1)[0].data;
    expect(forwarded.isApproved).toBeUndefined();
    expect(forwarded.currentLevel).toBe(UserRole.WARDEN_FEMALE);
    expect(forwarded.approvalLogs[0]).toMatchObject({
      status: "forwarded",
      comment: "Forwarded to Warden",
    });
  });

  it("appends to existing logs and treats a non-array log as empty", async () => {
    stub(
      "outpass",
      openRequest({ approvalLogs: [{ level: "previous", status: "forwarded" }] }),
    );
    await approveOutpass(staff(UserRole.CARETAKER_MALE), mockRes());
    expect(prisma.outpass.update.mock.calls[0][0].data.approvalLogs).toHaveLength(2);

    stub("outpass", openRequest({ approvalLogs: { bad: true } }));
    await approveOutpass(staff(UserRole.CARETAKER_MALE), mockRes());
    expect(prisma.outpass.update.mock.calls.at(-1)[0].data.approvalLogs).toHaveLength(1);
  });

  it("lets a warden approve or forward to the SWO", async () => {
    stub("outpass", openRequest({ currentLevel: UserRole.WARDEN_MALE }));
    await approveOutpass(
      staff(UserRole.WARDEN_MALE, { originalUrl: "/req-1/forward", body: { action: "approve" } }),
      mockRes(),
    );
    expect(prisma.outpass.update.mock.calls[0][0].data.currentLevel).toBe(UserRole.SWO);
    expect(prisma.outpass.update.mock.calls[0][0].data.isApproved).toBeUndefined();
    expect(prisma.outpass.update.mock.calls[0][0].data.approvalLogs[0].comment).toBe(
      "Forwarded to SWO",
    );

    stub("outpass", openRequest({ currentLevel: UserRole.WARDEN_MALE }));
    await approveOutpass(
      staff(UserRole.WARDEN_MALE, { body: { action: "approve" } }),
      mockRes(),
    );
    expect(prisma.outpass.update.mock.calls.at(-1)[0].data.isApproved).toBe(true);
  });

  it("finalizes at SWO, for a super role, and for a one-step outing", async () => {
    stub("outpass", openRequest({ currentLevel: UserRole.CARETAKER_FEMALE, studentGender: "F" }));
    await approveOutpass(staff(UserRole.DIRECTOR), mockRes());
    expect(prisma.outpass.update.mock.calls[0][0].data.isApproved).toBe(true);

    stub("outpass", openRequest({ currentLevel: UserRole.SWO }));
    await approveOutpass(staff(UserRole.SWO), mockRes());
    expect(prisma.outpass.update.mock.calls.at(-1)[0].data.isApproved).toBe(true);

    prisma.outpass.update.mockClear();
    stub("outing", openRequest({ currentLevel: UserRole.CARETAKER_MALE }));
    const res = mockRes();
    await approveOutpass(
      staff(UserRole.CARETAKER_MALE, { originalUrl: "/req-1/forward" }),
      res,
    );
    expect(prisma.outing.update).toHaveBeenCalled();
    expect(prisma.outpass.update).not.toHaveBeenCalled();
    expect(prisma.outing.update.mock.calls[0][0].data.isApproved).toBe(true);
    expect(res.json.mock.calls[0][0].data.isApproved).toBe(true);
  });

  it("records a non-final update when the role is not in the hostel chain", async () => {
    stub("outpass", openRequest({ currentLevel: UserRole.SECURITY, studentGender: "M" }));
    await approveOutpass(staff(UserRole.SECURITY), mockRes());
    const data = prisma.outpass.update.mock.calls[0][0].data;
    expect(data.isApproved).toBeUndefined();
    expect(data.approvalLogs[0]).toMatchObject({
      status: "forwarded",
      comment: "Processed",
    });
  });

  it("uses the username when the token has no id and still notifies", async () => {
    stub("outpass", openRequest());
    await approveOutpass(
      staff(UserRole.CARETAKER_MALE, {
        user: {
          username: "staffuser",
          role: UserRole.CARETAKER_MALE,
          email: "staffuser@rguktong.ac.in",
        },
      }),
      mockRes(),
    );
    expect(prisma.outpass.update.mock.calls[0][0].data.approvalLogs[0].approverId).toBe(
      "staffuser",
    );
    expect(axiosMock.post).toHaveBeenCalled();
  });

  it("returns 500 when the lookup throws", async () => {
    prisma.outpass.findUnique.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await approveOutpass(staff(UserRole.SWO), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });
});

describe("rejectOutpass", () => {
  it("blocks students, anonymous callers, and security", async () => {
    const student = mockRes();
    await rejectOutpass(baseReq({ params: { id: "req-1" } }), student);
    expect(student.status).toHaveBeenCalledWith(403);

    const anon = mockRes();
    await rejectOutpass(baseReq({ user: undefined, params: { id: "req-1" } }), anon);
    expect(anon.status).toHaveBeenCalledWith(403);

    const security = mockRes();
    await rejectOutpass(staff(UserRole.SECURITY), security);
    expect(security.json.mock.calls[0][0].message).toBe(
      "Security role is limited to Check-In/Check-Out operations.",
    );
  });

  it("404s when nothing matches and 409s when the request is already closed", async () => {
    const missing = mockRes();
    await rejectOutpass(staff(UserRole.CARETAKER_MALE), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    stub("outpass", openRequest({ isApproved: true }));
    const closed = mockRes();
    await rejectOutpass(staff(UserRole.CARETAKER_MALE), closed);
    expect(closed.status).toHaveBeenCalledWith(409);
    expect(closed.json).toHaveBeenCalledWith({
      code: ErrorCode.OUTPASS_ALREADY_APPROVED,
    });
  });

  it("requires the staff member who currently holds the request", async () => {
    stub("outing", openRequest({ currentLevel: UserRole.WARDEN_FEMALE, studentGender: "F" }));
    const res = mockRes();
    await rejectOutpass(staff(UserRole.CARETAKER_FEMALE), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Strict Hierarchy: Rejection must be handled at the current level (warden_female).",
    );
  });

  it("rejects an outpass, stores the comment, and clears the pending flag", async () => {
    stub("outpass", openRequest({ approvalLogs: null }));
    const res = mockRes();
    await rejectOutpass(
      staff(UserRole.CARETAKER_MALE, { body: { comment: "dates clash" } }),
      res,
    );
    expect(prisma.outpass.update).toHaveBeenCalledWith({
      where: { id: "req-1", isRejected: false },
      data: expect.objectContaining({
        isRejected: true,
        rejectedBy: "staffuser",
      }),
    });
    const data = prisma.outpass.update.mock.calls[0][0].data;
    expect(data.rejectedTime).toBeInstanceOf(Date);
    expect(data.approvalLogs[0]).toMatchObject({
      status: "rejected",
      comment: "dates clash",
    });
    expect(axiosMock.put).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/student/status",
      { username: "O190001", isPending: false },
      expect.any(Object),
    );
    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(axiosMock.post.mock.calls.map((call: any) => call[1].title)).toEqual(
      expect.arrayContaining(["Outpass Status Update", "Action Confirmation"]),
    );
  });

  it("lets a super role reject an outing at any level", async () => {
    stub("outing", openRequest({ currentLevel: UserRole.CARETAKER_MALE }));
    const res = mockRes();
    await rejectOutpass(staff(UserRole.DEAN), res);
    expect(prisma.outing.update.mock.calls[0][0].where).toEqual({
      id: "req-1",
      isRejected: false,
    });
    expect(res.json.mock.calls[0][0].data.isRejected).toBe(true);
  });

  it("still rejects an expired request that was never approved", async () => {
    stub("outpass", openRequest({ isExpired: true }));
    const res = mockRes();
    await rejectOutpass(staff(UserRole.CARETAKER_MALE), res);
    expect(prisma.outpass.update).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  it("returns 500 when the update fails", async () => {
    stub("outpass", openRequest());
    prisma.outpass.update.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await rejectOutpass(staff(UserRole.CARETAKER_MALE), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
