import { describe, expect, it } from "vitest";
import {
  deleteAllGrievances,
  deleteGrievance,
  getGrievances,
  resolveGrievance,
  submitGrievance,
} from "../src/controllers/grievance.controller";
import { mockReq, mockRes } from "./http";
import { axiosMock, prismaMock } from "./mocks";

const swo = { id: "s1", username: "swo", role: "swo" };
const student = {
  id: "u1",
  username: "O240001",
  role: "student",
  email: "ada@rguktong.ac.in",
};

describe("submitGrievance", () => {
  it("requires a user and a valid body", async () => {
    const unauth = mockRes();
    await submitGrievance(mockReq(), unauth);
    expect(unauth.statusCode).toBe(401);

    const bad = mockRes();
    await submitGrievance(
      mockReq({ user: student, body: { category: "", description: "short" } }),
      bad,
    );
    expect(bad.statusCode).toBe(400);
    expect(bad.body.code).toBe("VALIDATION_ERROR");
    expect(prismaMock.grievance.create).not.toHaveBeenCalled();
  });

  it("stores a named grievance and notifies SWO and the student", async () => {
    prismaMock.grievance.create.mockResolvedValue({ id: "g-abcdef1234567890" });
    const res = mockRes();
    await submitGrievance(
      mockReq({
        user: student,
        body: {
          category: "hostel",
          description: "The mess water has been muddy all week.",
          isAnonymous: false,
        },
      }),
      res,
    );
    expect(res.body.success).toBe(true);
    expect(prismaMock.grievance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: "O240001",
        studentEmail: "ada@rguktong.ac.in",
        category: "hostel",
        isAnonymous: false,
      }),
    });
    expect(axiosMock.post).toHaveBeenCalledTimes(2);
  });

  it("omits identity for an anonymous grievance", async () => {
    prismaMock.grievance.create.mockResolvedValue({ id: "g1" });
    await submitGrievance(
      mockReq({
        user: student,
        body: {
          category: "academic",
          description: "Need the timetable posted for this week.",
          isAnonymous: true,
        },
      }),
      mockRes(),
    );
    expect(prismaMock.grievance.create.mock.calls[0][0].data.studentId).toBeNull();
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when create fails", async () => {
    prismaMock.grievance.create.mockRejectedValue(new Error("db"));
    const res = mockRes();
    await submitGrievance(
      mockReq({
        user: student,
        body: {
          category: "academic",
          description: "Need the timetable posted for this week.",
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});

describe("getGrievances", () => {
  it("is limited to swo, director, and admin", async () => {
    const res = mockRes();
    await getGrievances(mockReq({ user: student, query: {} }), res);
    expect(res.statusCode).toBe(403);
  });

  it("pages results and fills in the student profile", async () => {
    prismaMock.grievance.findMany.mockResolvedValue([
      {
        id: "g1",
        studentId: "o240001",
        isAnonymous: false,
        status: "in-progress",
        studentEmail: null,
      },
      {
        id: "g2",
        studentId: null,
        isAnonymous: true,
        status: "pending",
      },
    ]);
    prismaMock.grievance.count.mockResolvedValue(21);
    prismaMock.studentProfile.findMany.mockResolvedValue([
      {
        username: "O240001",
        name: "Ada",
        email: "ada@rguktong.ac.in",
        branch: "CSE",
        year: "E2",
        phone: "999",
      },
    ]);

    const res = mockRes();
    await getGrievances(
      mockReq({ user: swo, query: { page: "2", limit: "10" } }),
      res,
    );

    expect(prismaMock.grievance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(res.body.meta).toEqual({
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        username: "O240001",
        studentName: "Ada",
        status: "In Progress",
      }),
    );
    expect(res.body.data[1].status).toBe("Pending");
    expect(prismaMock.studentProfile.findMany).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the list query fails", async () => {
    prismaMock.grievance.findMany.mockRejectedValue(new Error("db"));
    prismaMock.grievance.count.mockResolvedValue(0);
    const res = mockRes();
    await getGrievances(mockReq({ user: { username: "dir", role: "director" }, query: {} }), res);
    expect(res.statusCode).toBe(500);
  });
});

describe("resolveGrievance", () => {
  it("rejects unknown roles, missing rows, and a second resolve", async () => {
    const denied = mockRes();
    await resolveGrievance(mockReq({ user: student, params: { id: "g1" } }), denied);
    expect(denied.statusCode).toBe(403);

    prismaMock.grievance.findUnique.mockResolvedValue(null);
    const missing = mockRes();
    await resolveGrievance(mockReq({ user: swo, params: { id: "g1" } }), missing);
    expect(missing.statusCode).toBe(404);

    prismaMock.grievance.findUnique.mockResolvedValue({ status: "Resolved" });
    const again = mockRes();
    await resolveGrievance(mockReq({ user: swo, params: { id: "g1" } }), again);
    expect(again.statusCode).toBe(400);
    expect(again.body.message).toContain("already resolved");
  });

  it("marks a named grievance resolved and emails the student", async () => {
    prismaMock.grievance.findUnique.mockResolvedValue({
      id: "g1",
      status: "pending",
    });
    prismaMock.grievance.update.mockResolvedValue({
      id: "g1",
      status: "resolved",
      isAnonymous: false,
      studentId: "O240001",
      studentEmail: null,
      category: "hostel",
      description: "The mess water has been muddy all week long.",
    });
    prismaMock.studentProfile.findFirst.mockResolvedValue({
      email: "ada@rguktong.ac.in",
      name: "Ada Lovelace",
    });
    prismaMock.studentProfile.findMany.mockResolvedValue([]);

    const res = mockRes();
    await resolveGrievance(mockReq({ user: swo, params: { id: "g1" } }), res);

    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.message).toContain("notified by email");
    const mailCall = axiosMock.post.mock.calls.find((c) =>
      String(c[0]).endsWith("/mail/send"),
    );
    expect(mailCall?.[1]).toEqual(
      expect.objectContaining({
        type: "grievance_resolved",
        to: "ada@rguktong.ac.in",
      }),
    );
  });

  it("still resolves when the mail service fails", async () => {
    prismaMock.grievance.findUnique.mockResolvedValue({ id: "g1", status: "pending" });
    prismaMock.grievance.update.mockResolvedValue({
      id: "g1",
      status: "resolved",
      isAnonymous: false,
      studentId: "O240001",
      studentEmail: "ada@rguktong.ac.in",
      category: "x",
      description: "asdfasdfasdfasdfasdf",
    });
    prismaMock.studentProfile.findFirst.mockRejectedValue(new Error("profile"));
    prismaMock.studentProfile.findMany.mockResolvedValue([]);
    axiosMock.post.mockRejectedValue(new Error("mail down"));

    const res = mockRes();
    await resolveGrievance(mockReq({ user: swo, params: { id: "g1" } }), res);
    expect(res.body.emailSent).toBe(false);
    expect(res.body.message).toBe("Grievance resolved.");
  });

  it("skips mail for an anonymous grievance", async () => {
    prismaMock.grievance.findUnique.mockResolvedValue({ id: "g1", status: "pending" });
    prismaMock.grievance.update.mockResolvedValue({
      id: "g1",
      status: "resolved",
      isAnonymous: true,
      studentId: null,
    });
    prismaMock.studentProfile.findMany.mockResolvedValue([]);
    const res = mockRes();
    await resolveGrievance(
      mockReq({ user: { username: "admin", role: "admin" }, params: { id: "g1" } }),
      res,
    );
    expect(res.body.emailSent).toBe(false);
    expect(axiosMock.post).not.toHaveBeenCalled();
  });
});

describe("delete grievances", () => {
  it("deletes one row for an allowed role", async () => {
    prismaMock.grievance.delete.mockResolvedValue({});
    const res = mockRes();
    await deleteGrievance(mockReq({ user: swo, params: { id: "g1" } }), res);
    expect(res.body.message).toBe("Grievance deleted.");
    expect(prismaMock.grievance.delete).toHaveBeenCalledWith({
      where: { id: "g1" },
    });
  });

  it("rejects students and reports a database error", async () => {
    const denied = mockRes();
    await deleteGrievance(mockReq({ user: student, params: { id: "g1" } }), denied);
    expect(denied.statusCode).toBe(403);

    prismaMock.grievance.delete.mockRejectedValue(new Error("db"));
    const res = mockRes();
    await deleteGrievance(mockReq({ user: swo, params: { id: "g1" } }), res);
    expect(res.statusCode).toBe(500);
  });

  it("clears every grievance for staff and hides failures", async () => {
    const denied = mockRes();
    await deleteAllGrievances(mockReq({ user: student }), denied);
    expect(denied.statusCode).toBe(403);

    prismaMock.grievance.deleteMany.mockResolvedValue({ count: 4 });
    const res = mockRes();
    await deleteAllGrievances(mockReq({ user: swo }), res);
    expect(res.body.message).toBe("All grievances cleared.");

    prismaMock.grievance.deleteMany.mockRejectedValue(new Error("db"));
    const failed = mockRes();
    await deleteAllGrievances(mockReq({ user: swo }), failed);
    expect(failed.statusCode).toBe(500);
  });
});
