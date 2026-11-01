import { describe, expect, it } from "vitest";
import { axiosMock, prisma } from "./mocks";
import { baseReq, mockRes } from "./http";
import {
  getAllOutings,
  getAllOutpasses,
  getHistory,
  getOutsideStudents,
  purgeStudentRequests,
} from "../src/controllers/request.controller";
import { ErrorCode } from "../src/shared/error-codes";
import { UserRole } from "../src/shared/roles.enum";

function staff(role: string, query: Record<string, unknown> = {}) {
  return baseReq({
    user: {
      id: "staff-1",
      username: "staffuser",
      role,
      email: "staffuser@rguktong.ac.in",
    },
    query,
  });
}

describe("getHistory", () => {
  it("requires a user", async () => {
    const res = mockRes();
    await getHistory(baseReq({ user: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("merges outpass and outing rows for an explicit student id", async () => {
    const early = {
      id: "early",
      studentId: "O190099",
      isApproved: true,
      isRejected: false,
      isExpired: false,
      requestedTime: new Date("2026-06-01T00:00:00.000Z"),
      fromDay: new Date("2026-06-02T00:00:00.000Z"),
      toDay: new Date("2026-06-03T00:00:00.000Z"),
      checkedOutTime: null,
      checkedInTime: null,
    };
    const later = {
      id: "later",
      studentId: "O190099",
      isApproved: false,
      isRejected: true,
      isExpired: false,
      requestedTime: new Date("2026-06-04T00:00:00.000Z"),
      fromTime: new Date("2026-06-04T08:00:00.000Z"),
      toTime: new Date("2026-06-04T12:00:00.000Z"),
      checkedOutTime: new Date("2026-06-04T08:05:00.000Z"),
      checkedInTime: null,
    };
    prisma.outpass.findMany.mockResolvedValue([early]);
    prisma.outing.findMany.mockResolvedValue([later]);
    prisma.outpass.count.mockResolvedValue(2);
    prisma.outing.count.mockResolvedValue(1);

    const res = mockRes();
    await getHistory(
      baseReq({ params: { id: "o190099" }, query: { page: "2", limit: "1" } }),
      res,
    );

    expect(prisma.outpass.findMany.mock.calls[0][0]).toMatchObject({
      where: { studentId: "O190099" },
      skip: 1,
      take: 1,
    });
    const body = res.json.mock.calls[0][0];
    expect(body.history).toHaveLength(1);
    expect(body.history[0]).toMatchObject({
      _id: "later",
      type: "outing",
      is_approved: false,
      is_rejected: true,
      is_expired: false,
      from_time: later.fromTime,
      checked_out_time: later.checkedOutTime,
    });
    expect(body.pagination).toEqual({ page: 2, totalPages: 3, total: 3 });
  });

  it("defaults to the caller when no id is given", async () => {
    const res = mockRes();
    await getHistory(baseReq({ query: {} }), res);
    expect(prisma.outpass.count).toHaveBeenCalledWith({
      where: { studentId: "O190001" },
    });
    expect(res.json.mock.calls[0][0].history).toEqual([]);
  });

  it("returns 500 when history cannot be loaded", async () => {
    prisma.outpass.findMany.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await getHistory(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Failed to retrieve your history. Please try again later.",
    );
  });
});

describe("pending queues", () => {
  it("shows security the approved passes and everyone else the pending ones", async () => {
    prisma.outpass.findMany.mockResolvedValue([
      {
        id: "op-1",
        studentId: "O190001",
        isApproved: false,
        isRejected: false,
        isExpired: false,
        requestedTime: new Date("2026-06-01T00:00:00.000Z"),
        fromDay: new Date("2026-06-02T00:00:00.000Z"),
        toDay: new Date("2026-06-03T00:00:00.000Z"),
        checkedOutTime: null,
        checkedInTime: null,
      },
    ]);
    prisma.outpass.count.mockResolvedValue(4);

    const caretaker = mockRes();
    await getAllOutpasses(
      staff(UserRole.CARETAKER_FEMALE, { search: "o19", page: "1", limit: "2" }),
      caretaker,
    );
    expect(prisma.outpass.findMany.mock.calls[0][0].where).toEqual({
      studentId: { contains: "o19", mode: "insensitive" },
      isApproved: false,
      isRejected: false,
      isExpired: false,
      studentGender: "F",
    });
    expect(caretaker.json.mock.calls[0][0].outpasses[0]).toMatchObject({
      _id: "op-1",
      username: "O190001",
      is_approved: false,
      from_day: new Date("2026-06-02T00:00:00.000Z"),
    });
    expect(caretaker.json.mock.calls[0][0].pagination).toEqual({
      total: 4,
      page: 1,
      limit: 2,
      totalPages: 2,
    });

    const security = mockRes();
    await getAllOutpasses(staff(UserRole.SECURITY), security);
    expect(prisma.outpass.findMany.mock.calls.at(-1)[0].where).toEqual({
      isApproved: true,
      isExpired: false,
      isRejected: false,
    });

    const swo = mockRes();
    await getAllOutpasses(staff(UserRole.SWO), swo);
    expect(prisma.outpass.findMany.mock.calls.at(-1)[0].where.studentGender).toBeUndefined();
  });

  it("filters male hostel staff outings and reports query failures", async () => {
    prisma.outing.findMany.mockResolvedValue([
      {
        id: "ou-1",
        studentId: "O190002",
        isApproved: false,
        isRejected: false,
        isExpired: false,
        requestedTime: new Date("2026-06-01T00:00:00.000Z"),
        fromTime: new Date("2026-06-01T08:00:00.000Z"),
        toTime: new Date("2026-06-01T10:00:00.000Z"),
        checkedOutTime: null,
        checkedInTime: null,
      },
    ]);
    prisma.outing.count.mockResolvedValue(1);
    const res = mockRes();
    await getAllOutings(staff(UserRole.WARDEN_MALE), res);
    expect(prisma.outing.findMany.mock.calls[0][0].where).toMatchObject({
      isApproved: false,
      studentGender: "M",
    });
    expect(res.json.mock.calls[0][0].outings[0]).toMatchObject({
      _id: "ou-1",
      username: "O190002",
      from_time: new Date("2026-06-01T08:00:00.000Z"),
    });

    const missing = mockRes();
    await getAllOutings(baseReq({ user: undefined }), missing);
    expect(missing.status).toHaveBeenCalledWith(401);

    prisma.outing.findMany.mockRejectedValue(new Error("db down"));
    const failed = mockRes();
    await getAllOutings(staff(UserRole.SECURITY), failed);
    expect(failed.status).toHaveBeenCalledWith(500);

    prisma.outpass.findMany.mockRejectedValue(new Error("db down"));
    const failedPasses = mockRes();
    await getAllOutpasses(staff(UserRole.CARETAKER_MALE), failedPasses);
    expect(failedPasses.json.mock.calls[0][0].message).toBe(
      "Failed to fetch outpass records.",
    );
  });
});

describe("getOutsideStudents", () => {
  it("requires a user", async () => {
    const res = mockRes();
    await getOutsideStudents(baseReq({ user: undefined }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns an empty page without calling the profile service", async () => {
    const res = mockRes();
    await getOutsideStudents(baseReq({ query: { page: "1", limit: "10" } }), res);
    expect(res.json.mock.calls[0][0]).toEqual({
      success: true,
      students: [],
      pagination: { total: 0, page: 1, limit: 10 },
    });
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("stops before loading profiles when the requested page is past the end", async () => {
    prisma.outpass.findMany.mockResolvedValueOnce([{ studentId: "S1" }]);
    const res = mockRes();
    await getOutsideStudents(baseReq({ query: { page: "3", limit: "10" } }), res);
    expect(res.json.mock.calls[0][0].pagination.total).toBe(1);
    expect(res.json.mock.calls[0][0].students).toEqual([]);
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("groups open passes by student and fills unknown profiles", async () => {
    prisma.outpass.findMany
      .mockResolvedValueOnce([{ studentId: "S1" }, { studentId: "S2" }])
      .mockResolvedValueOnce([
        {
          id: "op-1",
          studentId: "S1",
          isApproved: true,
          isExpired: false,
          fromDay: new Date("2026-06-02T00:00:00.000Z"),
          toDay: new Date("2026-06-04T00:00:00.000Z"),
        },
      ]);
    prisma.outing.findMany
      .mockResolvedValueOnce([{ studentId: "S1" }])
      .mockResolvedValueOnce([
        {
          id: "ou-1",
          studentId: "S2",
          isApproved: true,
          isExpired: false,
          fromTime: new Date("2026-06-02T08:00:00.000Z"),
          toTime: new Date("2026-06-02T11:00:00.000Z"),
        },
      ]);
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        students: [
          {
            username: "s1",
            name: "Asha",
            email: "asha@rguktong.ac.in",
            gender: "F",
            _id: "profile-1",
          },
        ],
      },
    });

    const res = mockRes();
    await getOutsideStudents(baseReq({ query: { page: "1", limit: "10" } }), res);
    expect(axiosMock.post).toHaveBeenCalledWith(
      "http://gateway.test/api/v1/profile/internal/bulk-profiles",
      { usernames: ["S1", "S2"] },
      { headers: { "x-internal-secret": "test-internal" } },
    );
    const students = res.json.mock.calls[0][0].students;
    expect(students[0]).toMatchObject({
      _id: "profile-1",
      username: "S1",
      name: "Asha",
      gender: "F",
    });
    expect(students[0].outpasses_list[0]._id).toBe("op-1");
    expect(students[0].outpasses_list[0].from_day).toBe(
      new Date("2026-06-02T00:00:00.000Z").toLocaleDateString("en-IN"),
    );
    expect(students[1]).toMatchObject({
      username: "S2",
      name: "Unknown Student",
      email: "N/A",
    });
    expect(students[1].outings_list[0]._id).toBe("ou-1");
    expect(res.json.mock.calls[0][0].pagination.totalPages).toBe(1);
  });

  it("uses the unknown-student placeholder when profiles cannot be loaded", async () => {
    prisma.outpass.findMany
      .mockResolvedValueOnce([{ studentId: "S9" }])
      .mockResolvedValueOnce([]);
    prisma.outing.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    axiosMock.post.mockRejectedValue(new Error("gateway down"));
    const res = mockRes();
    await getOutsideStudents(baseReq({ query: {} }), res);
    expect(res.json.mock.calls[0][0].students[0].name).toBe("Unknown Student");
  });

  it("returns 500 when the outside-student query fails", async () => {
    prisma.outpass.findMany.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await getOutsideStudents(baseReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe(
      "Failed to fetch currently outside students list.",
    );
  });
});

describe("purgeStudentRequests", () => {
  it("rejects a bad internal secret and a missing student id", async () => {
    const forbidden = mockRes();
    await purgeStudentRequests(
      baseReq({ headers: { "x-internal-secret": "nope" }, params: { studentId: "o1" } }),
      forbidden,
    );
    expect(forbidden.status).toHaveBeenCalledWith(403);

    const missing = mockRes();
    await purgeStudentRequests(
      baseReq({
        headers: { "x-internal-secret": "test-internal" },
        params: { studentId: "" },
      }),
      missing,
    );
    expect(missing.status).toHaveBeenCalledWith(400);
    expect(prisma.outpass.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes both tables for the uppercased student id", async () => {
    prisma.outpass.deleteMany.mockResolvedValue({ count: 2 });
    prisma.outing.deleteMany.mockResolvedValue({ count: 1 });
    const res = mockRes();
    await purgeStudentRequests(
      baseReq({
        headers: { "x-internal-secret": "test-internal" },
        params: { studentId: "o190001" },
      }),
      res,
    );
    expect(prisma.outpass.deleteMany).toHaveBeenCalledWith({
      where: { studentId: "O190001" },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Request records purged for O190001",
      deleted: { outpasses: 2, outings: 1 },
    });
  });

  it("returns 500 when the delete fails", async () => {
    prisma.outpass.deleteMany.mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await purgeStudentRequests(
      baseReq({
        headers: { "x-internal-secret": "test-internal" },
        params: { studentId: "O1" },
      }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
