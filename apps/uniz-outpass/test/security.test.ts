import { describe, expect, it } from "vitest";
import { axiosMock, prisma } from "./mocks";
import { baseReq, mockRes, openRequest } from "./http";
import {
  getSecuritySummary,
  securityCheckIn,
  securityCheckOut,
} from "../src/controllers/request.controller";
import { ErrorCode } from "../src/shared/error-codes";
import { UserRole } from "../src/shared/roles.enum";

function security(extra: Record<string, unknown> = {}) {
  return baseReq({
    user: {
      id: "sec-1",
      username: "gate",
      role: UserRole.SECURITY,
      email: "gate@rguktong.ac.in",
    },
    params: { id: "req-1" },
    query: {},
    ...extra,
  });
}

function stub(type: "outpass" | "outing", data: Record<string, unknown>) {
  if (type === "outpass") {
    prisma.outpass.findUnique.mockResolvedValue(data);
    prisma.outing.findUnique.mockResolvedValue(null);
  } else {
    prisma.outpass.findUnique.mockResolvedValue(null);
    prisma.outing.findUnique.mockResolvedValue(data);
  }
}

describe("security check-out and check-in", () => {
  it("allows only the security role", async () => {
    const out = mockRes();
    await securityCheckOut(baseReq({ params: { id: "req-1" } }), out);
    expect(out.status).toHaveBeenCalledWith(403);

    const inn = mockRes();
    await securityCheckIn(baseReq({ user: undefined, params: { id: "req-1" } }), inn);
    expect(inn.status).toHaveBeenCalledWith(403);
  });

  it("404s when the request id is unknown", async () => {
    const res = mockRes();
    await securityCheckOut(security(), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ code: ErrorCode.RESOURCE_NOT_FOUND });
  });

  it("refuses a second check-out and a pass that is not approved and active", async () => {
    stub("outpass", openRequest({ checkedOutTime: new Date().toISOString() }));
    const again = mockRes();
    await securityCheckOut(security(), again);
    expect(again.status).toHaveBeenCalledWith(409);
    expect(again.json.mock.calls[0][0].message).toBe(
      "Checkout Denied: Student already checked out.",
    );

    stub("outing", openRequest({ isApproved: false }));
    const pending = mockRes();
    await securityCheckOut(security(), pending);
    expect(pending.status).toHaveBeenCalledWith(400);
    expect(pending.json.mock.calls[0][0].message).toBe(
      "Request is not valid for checkout (Must be Approved & Active)",
    );
  });

  it("expires an approval that is older than one hour and still answers 400 if the profile update fails", async () => {
    stub(
      "outpass",
      openRequest({
        isApproved: true,
        issuedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
    );
    axiosMock.put.mockRejectedValue(new Error("profile down"));
    const res = mockRes();
    await securityCheckOut(security(), res);
    expect(prisma.outpass.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { isExpired: true },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Approval expired (User did not check out within 1 hour)",
    );

    stub(
      "outing",
      openRequest({
        isApproved: true,
        issuedTime: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
      }),
    );
    await securityCheckOut(security(), mockRes());
    expect(prisma.outing.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { isExpired: true },
    });
  });

  it("checks a student out inside the hour and marks them absent", async () => {
    stub(
      "outpass",
      openRequest({
        isApproved: true,
        issuedTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      }),
    );
    const res = mockRes();
    await securityCheckOut(security(), res);
    const data = prisma.outpass.update.mock.calls[0][0].data;
    expect(data.checkedOutTime).toBeInstanceOf(Date);
    expect(axiosMock.put).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/student/status",
      { username: "O190001", isPresent: false },
      expect.any(Object),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Student Checked Out",
    });
  });

  it("checks an outing out the same way", async () => {
    stub(
      "outing",
      openRequest({
        isApproved: true,
        issuedTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      }),
    );
    const res = mockRes();
    await securityCheckOut(security(), res);
    expect(prisma.outing.update.mock.calls[0][0].data.checkedOutTime).toBeInstanceOf(
      Date,
    );
    expect(res.json.mock.calls[0][0].message).toBe("Student Checked Out");
  });

  it("returns 500 when check-out persistence fails", async () => {
    stub("outpass", openRequest({ isApproved: true }));
    prisma.outpass.update.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await securityCheckOut(security(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("refuses check-in before check-out and a second check-in", async () => {
    stub("outpass", openRequest({ isApproved: true, checkedOutTime: null }));
    const early = mockRes();
    await securityCheckIn(security(), early);
    expect(early.status).toHaveBeenCalledWith(400);
    expect(early.json.mock.calls[0][0].message).toBe(
      "Check-in Denied: Student has not checked out yet.",
    );

    stub(
      "outing",
      openRequest({
        checkedOutTime: new Date().toISOString(),
        checkedInTime: new Date().toISOString(),
      }),
    );
    const twice = mockRes();
    await securityCheckIn(security(), twice);
    expect(twice.status).toHaveBeenCalledWith(409);
    expect(twice.json.mock.calls[0][0].message).toBe(
      "Check-in Denied: Student already checked in.",
    );
  });

  it("checks a student back in and clears the pending flag", async () => {
    stub(
      "outpass",
      openRequest({ checkedOutTime: new Date(Date.now() - 60 * 60 * 1000).toISOString() }),
    );
    const res = mockRes();
    await securityCheckIn(security(), res);
    expect(prisma.outpass.update.mock.calls[0][0].data.checkedInTime).toBeInstanceOf(
      Date,
    );
    expect(axiosMock.put).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/student/status",
      { username: "O190001", isPresent: true, isPending: false },
      expect.any(Object),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Student Checked In",
    });
  });

  it("checks an outing in even if the profile update fails", async () => {
    stub("outing", openRequest({ checkedOutTime: new Date().toISOString() }));
    axiosMock.put.mockRejectedValue(new Error("profile down"));
    const res = mockRes();
    await securityCheckIn(security(), res);
    expect(prisma.outing.update).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].message).toBe("Student Checked In");
  });

  it("returns 500 when check-in persistence fails", async () => {
    prisma.outpass.findUnique.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await securityCheckIn(security(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe("Failed to process check-in.");
  });
});

describe("getSecuritySummary", () => {
  it("is limited to security", async () => {
    const res = mockRes();
    await getSecuritySummary(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: ErrorCode.AUTH_FORBIDDEN });
  });

  it("splits people waiting to leave from people waiting to return", async () => {
    const leave = {
      id: "leave",
      requestedTime: new Date("2026-06-02T10:00:00.000Z"),
      checkedOutTime: null,
      checkedInTime: null,
    };
    const back = {
      id: "back",
      requestedTime: new Date("2026-06-03T10:00:00.000Z"),
      checkedOutTime: new Date("2026-06-03T11:00:00.000Z"),
      checkedInTime: null,
    };
    const older = {
      id: "older",
      requestedTime: new Date("2026-05-01T10:00:00.000Z"),
      checkedInTime: new Date("2026-05-01T18:00:00.000Z"),
      checkedOutTime: new Date("2026-05-01T12:00:00.000Z"),
    };
    const newer = {
      id: "newer",
      requestedTime: new Date("2026-05-02T10:00:00.000Z"),
      checkedInTime: new Date("2026-05-02T18:00:00.000Z"),
      checkedOutTime: new Date("2026-05-02T12:00:00.000Z"),
    };
    prisma.outing.findMany
      .mockResolvedValueOnce([leave])
      .mockResolvedValueOnce([older]);
    prisma.outpass.findMany
      .mockResolvedValueOnce([back])
      .mockResolvedValueOnce([newer]);

    const res = mockRes();
    await getSecuritySummary(security({ query: { search: "o19", limit: "1", page: "1" } }), res);

    expect(prisma.outing.findMany.mock.calls[0][0].where).toMatchObject({
      isApproved: true,
      checkedInTime: null,
      studentId: { contains: "o19", mode: "insensitive" },
    });
    expect(prisma.outpass.findMany.mock.calls[1][0].where.checkedInTime).toEqual({
      not: null,
    });
    const body = res.json.mock.calls[0][0];
    expect(body.pending_checkout.map((row: any) => row.id)).toEqual(["leave"]);
    expect(body.pending_checkin.map((row: any) => row.id)).toEqual(["back"]);
    expect(body.history.map((row: any) => row.id)).toEqual(["newer"]);
    expect(body.pagination).toEqual({ page: 1, limit: 1, totalHistory: 2 });
  });

  it("returns 500 when the summary query fails", async () => {
    prisma.outing.findMany.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await getSecuritySummary(security(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Failed to generate security summary.",
    );
  });
});
