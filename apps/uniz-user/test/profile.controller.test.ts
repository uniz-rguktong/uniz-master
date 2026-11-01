import { describe, expect, it } from "vitest";
import {
  adminUpdateStudentProfile,
  createIndividualStudent,
  getBulkProfiles,
  getStudentBootstrap,
  getStudentProfile,
  internalInvalidateStudentCache,
  resolveLoginByEmail,
  searchStudents,
  updateStudentPresence,
  updateStudentProfile,
} from "../src/controllers/profile.controller";
import { mockReq, mockRes } from "./http";
import { axiosMock, prismaMock, redisMock } from "./mocks";

const studentUser = {
  id: "u1",
  username: "O240001",
  role: "student",
  email: "ada@rguktong.ac.in",
};
const webadmin = { id: "a1", username: "web", role: "webadmin" };

const profile = {
  id: "p1",
  username: "O240001",
  name: "Ada",
  email: "ada@rguktong.ac.in",
  branch: "Computer Science and Engineering",
  year: "E2",
  section: "A",
  isPresentInCampus: true,
  isSuspended: false,
  phone: "999",
};

describe("resolveLoginByEmail", () => {
  it("checks the internal secret and the email shape", async () => {
    const denied = mockRes();
    await resolveLoginByEmail(mockReq({ query: { email: "a@b.co" } }), denied);
    expect(denied.statusCode).toBe(403);

    const bad = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "nope" },
      }),
      bad,
    );
    expect(bad.statusCode).toBe(400);
  });

  it("returns the first matching profile type", async () => {
    prismaMock.studentProfile.findFirst.mockResolvedValue({ username: "O240001" });
    const student = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "Ada@rguktong.ac.in" },
      }),
      student,
    );
    expect(student.body).toEqual({ username: "O240001", profileType: "student" });

    prismaMock.studentProfile.findFirst.mockResolvedValue(null);
    prismaMock.facultyProfile.findFirst.mockResolvedValue({ username: "hod_cse" });
    const faculty = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "hod@rguktong.ac.in" },
      }),
      faculty,
    );
    expect(faculty.body.profileType).toBe("faculty");

    prismaMock.facultyProfile.findFirst.mockResolvedValue(null);
    prismaMock.adminProfile.findFirst.mockResolvedValue({ username: "web" });
    const admin = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "web@rguktong.ac.in" },
      }),
      admin,
    );
    expect(admin.body.profileType).toBe("admin");
  });

  it("returns 404 and 500 for a miss and a database error", async () => {
    prismaMock.studentProfile.findFirst.mockResolvedValue(null);
    prismaMock.facultyProfile.findFirst.mockResolvedValue(null);
    prismaMock.adminProfile.findFirst.mockResolvedValue(null);
    const missing = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "none@rguktong.ac.in" },
      }),
      missing,
    );
    expect(missing.statusCode).toBe(404);

    prismaMock.studentProfile.findFirst.mockRejectedValue(new Error("db"));
    const failed = mockRes();
    await resolveLoginByEmail(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        query: { email: "ada@rguktong.ac.in" },
      }),
      failed,
    );
    expect(failed.statusCode).toBe(500);
  });
});

describe("getStudentProfile", () => {
  it("blocks a missing user and a student reading someone else", async () => {
    const unauth = mockRes();
    await getStudentProfile(mockReq(), unauth);
    expect(unauth.statusCode).toBe(401);

    const denied = mockRes();
    await getStudentProfile(
      mockReq({
        user: studentUser,
        params: { username: "O240099" },
      }),
      denied,
    );
    expect(denied.statusCode).toBe(403);
  });

  it("serves a cached profile", async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ username: "O240001" }));
    const res = mockRes();
    await getStudentProfile(mockReq({ user: studentUser, params: {} }), res);
    expect(res.body.source).toBe("cache");
    expect(prismaMock.studentProfile.findUnique).not.toHaveBeenCalled();
  });

  it("maps a database profile and hides other departments from an HOD", async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.studentProfile.findUnique.mockResolvedValue(profile);
    const self = mockRes();
    await getStudentProfile(
      mockReq({ user: studentUser, params: {}, headers: {} }),
      self,
    );
    expect(self.body.source).toBe("db");
    expect(self.body.student.branch).toBe("CSE");
    expect(self.body.student._id).toBe("p1");
    expect(redisMock.setex).toHaveBeenCalledWith(
      "profile:v2:O240001",
      15,
      expect.any(String),
    );

    prismaMock.studentProfile.findUnique.mockResolvedValue({
      ...profile,
      username: "O240099",
      branch: "ECE",
    });
    const hod = mockRes();
    await getStudentProfile(
      mockReq({
        user: { username: "hod_cse", role: "hod", department: "CSE" },
        params: { username: "O240099" },
      }),
      hod,
    );
    expect(hod.statusCode).toBe(403);
    expect(hod.body.message).toContain("CSE");
  });

  it("returns 404 when the profile is missing", async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.studentProfile.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await getStudentProfile(mockReq({ user: studentUser, params: {} }), res);
    expect(res.statusCode).toBe(404);
  });
});

describe("getStudentBootstrap", () => {
  it("is student-only and can be served from cache", async () => {
    const denied = mockRes();
    await getStudentBootstrap(mockReq({ user: webadmin }), denied);
    expect(denied.statusCode).toBe(403);

    redisMock.get.mockResolvedValue(
      JSON.stringify({ success: true, student: { username: "O240001" }, meta: {} }),
    );
    const cached = mockRes();
    await getStudentBootstrap(mockReq({ user: studentUser }), cached);
    expect(cached.body.source).toBe("cache");
    expect(cached.body.meta.cache).toBe("redis");
  });

  it("builds a dashboard payload and tolerates academic failures", async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.studentProfile.findUnique.mockResolvedValue(profile);
    axiosMock.get
      .mockResolvedValueOnce({
        data: { success: true, cgpa: 8.4, totalBacklogs: 1 },
      })
      .mockRejectedValueOnce(new Error("attendance down"));

    const res = mockRes();
    await getStudentBootstrap(
      mockReq({ user: studentUser, headers: { authorization: "Bearer t" } }),
      res,
    );
    expect(res.body.source).toBe("db");
    expect(res.body.student.cgpa).toBe(8.4);
    expect(res.body.grades.totalBacklogs).toBe(1);
    expect(res.body.attendance).toBeNull();
    expect(redisMock.setex).toHaveBeenCalledWith(
      "bootstrap:v1:O240001",
      45,
      expect.any(String),
    );
  });
});

describe("profile writes", () => {
  it("invalidates one student cache for an internal caller", async () => {
    const denied = mockRes();
    await internalInvalidateStudentCache(mockReq({ body: { username: "a" } }), denied);
    expect(denied.statusCode).toBe(403);

    const missing = mockRes();
    await internalInvalidateStudentCache(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        body: {},
      }),
      missing,
    );
    expect(missing.statusCode).toBe(400);

    const res = mockRes();
    await internalInvalidateStudentCache(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        body: { username: "o240001" },
      }),
      res,
    );
    expect(res.body.username).toBe("O240001");
    expect(redisMock.del).toHaveBeenCalledWith(
      "profile:v2:O240001",
      "bootstrap:v1:O240001",
    );
  });

  it("lets a student update only the self-service fields", async () => {
    const denied = mockRes();
    await updateStudentProfile(
      mockReq({ user: webadmin, body: { phone: "1" } }),
      denied,
    );
    expect(denied.statusCode).toBe(403);

    const empty = mockRes();
    await updateStudentProfile(
      mockReq({ user: studentUser, body: { isSuspended: true, branch: "ECE" } }),
      empty,
    );
    expect(empty.statusCode).toBe(400);

    prismaMock.studentProfile.upsert.mockResolvedValue({
      ...profile,
      phone: "888",
    });
    const res = mockRes();
    await updateStudentProfile(
      mockReq({
        user: studentUser,
        body: { phone: "888", isSuspended: true },
      }),
      res,
    );
    expect(prismaMock.studentProfile.upsert.mock.calls[0][0].update).toEqual({
      phone: "888",
    });
    expect(res.body.student.phone_number).toBe("888");
  });

  it("normalizes the branch on an admin update", async () => {
    const denied = mockRes();
    await adminUpdateStudentProfile(
      mockReq({
        user: studentUser,
        params: { username: "o240001" },
        body: { name: "Ada" },
      }),
      denied,
    );
    expect(denied.statusCode).toBe(403);

    prismaMock.studentProfile.upsert.mockResolvedValue({
      ...profile,
      branch: "ECE",
    });
    const res = mockRes();
    await adminUpdateStudentProfile(
      mockReq({
        user: webadmin,
        params: { username: "o240001" },
        body: { branch: "Electronics and Communication Engineering", cgpa: 9 },
      }),
      res,
    );
    expect(prismaMock.studentProfile.upsert.mock.calls[0][0].update.branch).toBe(
      "ECE",
    );
    expect(prismaMock.studentProfile.upsert.mock.calls[0][0].where).toEqual({
      username: "O240001",
    });
    expect(res.body.student.branch).toBe("ECE");
  });

  it("creates a student for webadmin and syncs auth", async () => {
    const missing = mockRes();
    await createIndividualStudent(
      mockReq({ user: webadmin, body: {} }),
      missing,
    );
    expect(missing.statusCode).toBe(400);

    prismaMock.studentProfile.upsert.mockResolvedValue(profile);
    const res = mockRes();
    await createIndividualStudent(
      mockReq({
        user: { username: "dean", role: "dean" },
        body: {
          username: "o240008",
          name: "Grace",
          branch: "Mechanical Engineering",
        },
      }),
      res,
    );
    expect(axiosMock.post.mock.calls[0][1].username).toBe("O240008");
    expect(prismaMock.studentProfile.upsert.mock.calls[0][0].create.branch).toBe(
      "MECH",
    );
    expect(res.body.success).toBe(true);
  });

  it("updates presence for staff and creates a shell profile when needed", async () => {
    const denied = mockRes();
    await updateStudentPresence(
      mockReq({
        user: { username: "fac", role: "faculty" },
        body: { username: "O240001", isPresent: false },
      }),
      denied,
    );
    expect(denied.statusCode).toBe(403);

    prismaMock.studentProfile.findUnique.mockResolvedValue(profile);
    prismaMock.studentProfile.update.mockResolvedValue({
      ...profile,
      isPresentInCampus: false,
    });
    const updated = mockRes();
    await updateStudentPresence(
      mockReq({
        user: { username: "sec", role: "security" },
        body: { username: "o240001", isPresent: false },
      }),
      updated,
    );
    expect(updated.body.student.is_in_campus).toBe(false);

    prismaMock.studentProfile.findUnique.mockResolvedValue(null);
    prismaMock.studentProfile.create.mockResolvedValue({
      id: "new",
      username: "O240010",
      isPresentInCampus: true,
      isApplicationPending: false,
    });
    const created = mockRes();
    await updateStudentPresence(
      mockReq({
        user: webadmin,
        body: { username: "o240010", isPresent: true },
      }),
      created,
    );
    expect(prismaMock.studentProfile.create).toHaveBeenCalled();
    expect(created.body.success).toBe(true);
  });
});

describe("searchStudents and getBulkProfiles", () => {
  it("blocks students and pins an HOD to their branch", async () => {
    const denied = mockRes();
    await searchStudents(mockReq({ user: studentUser, body: {} }), denied);
    expect(denied.statusCode).toBe(403);

    prismaMock.studentProfile.findMany.mockResolvedValue([profile]);
    prismaMock.studentProfile.count.mockResolvedValue(1);
    const res = mockRes();
    await searchStudents(
      mockReq({
        user: { username: "hod_ece", role: "hod", department: "GENERAL" },
        body: {
          branch: "CSE",
          year: "ALL",
          batch: "o21",
          minCgpa: "8",
          hasRemedials: "active",
          limit: 500,
          sortBy: "cgpa",
          sortDir: "desc",
        },
      }),
      res,
    );
    const where = prismaMock.studentProfile.findMany.mock.calls[0][0].where;
    expect(where.branch).toEqual({ equals: "ECE", mode: "insensitive" });
    expect(where.batch.equals).toBe("O21");
    expect(where.year).toBeUndefined();
    expect(where.cgpa).toEqual({ gte: 8 });
    expect(where.totalBacklogs).toEqual({ gt: 0 });
    expect(prismaMock.studentProfile.findMany.mock.calls[0][0].take).toBe(100);
    expect(prismaMock.studentProfile.findMany.mock.calls[0][0].orderBy).toEqual({
      cgpa: "desc",
    });
    expect(res.body.students[0].branch).toBe("CSE");
  });

  it("returns bulk profiles only to an internal caller", async () => {
    const denied = mockRes();
    await getBulkProfiles(mockReq({ body: { usernames: ["A"] } }), denied);
    expect(denied.statusCode).toBe(401);

    const bad = mockRes();
    await getBulkProfiles(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        body: {},
      }),
      bad,
    );
    expect(bad.statusCode).toBe(400);

    prismaMock.studentProfile.findMany.mockResolvedValue([profile]);
    const res = mockRes();
    await getBulkProfiles(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        body: { usernames: ["o240001"] },
      }),
      res,
    );
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].username).toBe("O240001");
  });
});
