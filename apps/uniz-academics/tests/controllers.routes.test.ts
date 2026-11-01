import ExcelJS from "exceljs";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { Worker } from "bullmq";
import { createApp } from "../src/createApp";
import { updateFacultyRole } from "../src/controllers/faculty.controller";
import { processQueue } from "../src/controllers/queue.controller";
import { processNextBatch } from "../src/services/upload.service";
import prisma, { setPrismaMode } from "../src/utils/prisma.util";
import { notificationQueue, redis } from "../src/utils/redis.util";
import {
  generateAttendancePdf,
  generateBulkRegistrationPdf,
  generateRegistrationPdf,
  generateResultPdf,
} from "../src/utils/pdf.util";
import { mockRequest, mockResponse } from "./http";

const SECRET = "unit-test-internal";

const student = {
  username: "O210008",
  name: "Ada Lovelace",
  branch: "CSE",
  department: "CSE",
  year: "E2",
  batch: "O21",
  email: "ada@example.com",
  campus: "Ongole",
  section: "A",
};

function auth(role = "webadmin", username = "admin1") {
  return {
    "x-internal-secret": SECRET,
    "x-override-role": role,
    "x-override-username": username,
  };
}

function detail(res: request.Response) {
  if (Buffer.isBuffer(res.body)) return `buffer:${res.body.length}`;
  try {
    return JSON.stringify(res.body);
  } catch {
    return String(res.body);
  }
}

async function workbook(headers: string[], rows: (string | number)[][]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.addRow(headers);
  for (const row of rows) ws.addRow(row);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 40));
}

describe("academic controllers and routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    setPrismaMode("rich");
    const payload = {
      data: {
        success: true,
        secure_url: "https://cdn.example/upload.xlsx",
        students: [student, { ...student, username: "O210009", name: "Grace Hopper" }],
        student,
        faculty: { email: "ada@example.com" },
        data: student,
        pagination: { totalPages: 1 },
      },
    };
    axios.get.mockResolvedValue(payload);
    axios.post.mockResolvedValue(payload);
    axios.put.mockResolvedValue(payload);
    axios.patch.mockResolvedValue(payload);
    axios.delete.mockResolvedValue(payload);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("serves health, rejects unknown routes, and handles a bad body", async () => {
    const health = await request(app).get("/health");
    expect(health.status, detail(health)).toBe(200);
    expect(health.body.service).toBe("uniz-academics-service");

    const missing = await request(app).get("/not-a-real-route").set(auth());
    expect(missing.status, detail(missing)).toBe(404);

    const anonymous = await request(app).get("/grades");
    expect(anonymous.status).toBe(401);

    const bad = await request(app)
      .post("/grades/add")
      .set(auth())
      .set("Content-Type", "application/json")
      .send("{");
    expect([400, 500]).toContain(bad.status);
  });

  it("reads grades, attendance, and subjects for admins and students", async () => {
    const cached = await request(app)
      .get("/grades")
      .set(auth("student", "O210008"));
    expect(cached.status, detail(cached)).toBe(200);

    redis.get.mockResolvedValueOnce(
      JSON.stringify({ success: true, grades: [], cgpa: 9 }),
    );
    const hit = await request(app).get("/grades").set(auth("webadmin", "admin1"));
    expect(hit.status, detail(hit)).toBe(200);
    expect(hit.body.source).toBe("cache");

    const filtered = await request(app)
      .get("/grades")
      .query({ studentId: "O210008", semester: "SEM-1", year: "E2" })
      .set(auth());
    expect(filtered.status, detail(filtered)).toBe(200);

    const forbidden = await request(app)
      .get("/grades")
      .query({ studentId: "O210009" })
      .set(auth("student", "O210008"));
    expect(forbidden.status).toBe(403);

    const batch = await request(app)
      .get("/grades/batch")
      .query({
        branch: "CSE",
        year: "E2",
        semesterId: "SEM-1",
        failedOnly: "true",
        page: "1",
        limit: "10",
      })
      .set(auth());
    expect(batch.status, detail(batch)).toBe(200);
    expect(batch.body.success).toBe(true);

    const studentBatch = await request(app)
      .get("/grades/batch")
      .set(auth("student", "O210008"));
    expect(studentBatch.status).toBe(403);

    const attendance = await request(app)
      .get("/attendance")
      .query({ studentId: "O210008", semester: "SEM-1", year: "E2" })
      .set(auth());
    expect(attendance.status, detail(attendance)).toBe(200);

    const subjects = await request(app)
      .get("/subjects")
      .query({
        search: "data",
        department: "CIVIL",
        semester: "E2-SEM-1",
        page: "1",
        limit: "10",
      })
      .set(auth());
    expect(subjects.status, detail(subjects)).toBe(200);

    const browse = await request(app).get("/subjects").set(auth());
    expect(browse.status, detail(browse)).toBe(200);
  });

  it("adds and updates grades and attendance", async () => {
    const denied = await request(app)
      .post("/grades/add")
      .set(auth("student", "O210008"))
      .send({ studentId: "O210008", grades: [] });
    expect(denied.status).toBe(403);

    const added = await request(app)
      .post("/grades/add")
      .set(auth())
      .send({
        studentId: "O210008",
        semesterId: "E2-SEM-1",
        grades: [{ subjectId: "sub-1", grade: 9, subjectNameOverride: "DS Lab" }],
      });
    expect(added.status, detail(added)).toBe(200);

    prisma.grade.upsert.mockRejectedValueOnce(
      Object.assign(new Error("fk"), { code: "P2003" }),
    );
    const fk = await request(app)
      .post("/grades/add")
      .set(auth())
      .send({
        studentId: "O210008",
        grades: [{ subjectId: "sub-1", grade: 8 }],
      });
    expect(fk.status).toBe(400);

    const bulk = await request(app)
      .put("/grades/bulk-update")
      .set(auth())
      .send({
        updates: [
          {
            studentId: "O210008",
            subjectId: "CS2001",
            semesterId: "E2-SEM-1",
            grade: "A",
          },
        ],
      });
    expect(bulk.status, detail(bulk)).toBe(200);

    prisma.grade.findMany.mockResolvedValueOnce([]);
    const created = await request(app)
      .put("/grades/bulk-update")
      .set(auth())
      .send({
        updates: [
          { studentId: "O210008", subjectId: "sub-1", semesterId: "E3-SEM-2", grade: 8 },
        ],
      });
    expect(created.status, detail(created)).toBe(200);

    prisma.grade.findMany.mockResolvedValueOnce([
      {
        id: "ghost",
        studentId: "O210008",
        subjectId: "sub-1",
        semesterId: "OLD",
        grade: 4,
      },
    ]);
    const moved = await request(app)
      .put("/grades/bulk-update")
      .set(auth())
      .send({
        updates: [
          { studentId: "O210008", subjectId: "sub-1", semesterId: "E2-SEM-2", grade: 7 },
        ],
      });
    expect(moved.status, detail(moved)).toBe(200);

    const invalid = await request(app)
      .put("/grades/bulk-update")
      .set(auth())
      .send({
        updates: [
          { studentId: "O210008", subjectId: "NOPE", semesterId: "E2-SEM-1", grade: 15 },
        ],
      });
    expect(invalid.status).toBe(400);

    const shape = await request(app)
      .put("/grades/bulk-update")
      .set(auth())
      .send({});
    expect(shape.status).toBe(400);

    const marked = await request(app)
      .post("/attendance/add")
      .set(auth())
      .send({
        subjectId: "sub-1",
        records: [
          { studentId: "O210008", attended: 8, total: 10, semesterId: "E2-SEM-1" },
        ],
      });
    expect(marked.status, detail(marked)).toBe(200);

    const negative = await request(app)
      .post("/attendance/add")
      .set(auth())
      .send({
        subjectId: "sub-1",
        records: [{ studentId: "O210008", attended: 11, total: 10 }],
      });
    expect(negative.status).toBe(400);
  });

  it("publishes grade and attendance mail in the background", async () => {
    const bad = await request(app)
      .post("/grades/publish-email")
      .set(auth())
      .send({ semesterId: "E2-SEM-1", year: "E2" });
    expect(bad.status).toBe(400);

    const grades = await request(app)
      .post("/grades/publish-email")
      .set(auth("dean", "dean1"))
      .send({ semesterId: "SEM-1", year: "E2" });
    expect(grades.status, detail(grades)).toBe(200);
    await settle();
    expect(notificationAdds()).toBeGreaterThan(0);

    const attendance = await request(app)
      .post("/attendance/publish-email")
      .set(auth())
      .send({ semesterId: "SEM-1", year: "E2", branch: "CSE" });
    expect(attendance.status, detail(attendance)).toBe(200);
    await settle();
  });

  it("reports upload and publish progress, including a stuck job", async () => {
    redis.get.mockResolvedValueOnce(
      JSON.stringify({
        status: "processing",
        lastActive: Date.now() - 20_000,
        percent: 10,
      }),
    );
    const stuck = await request(app)
      .get("/upload/progress")
      .query({ uploadId: "up-1" })
      .set(auth());
    expect(stuck.status, detail(stuck)).toBe(200);
    await settle();

    redis.get.mockResolvedValueOnce(null);
    const expired = await request(app)
      .get("/grades/upload/progress")
      .query({ uploadId: "missing" })
      .set(auth());
    expect(expired.status).toBe(404);

    redis.get.mockImplementation(async (key: string) => {
      if (String(key).includes("publish:progress")) {
        return JSON.stringify({ status: "done", percent: 100 });
      }
      if (String(key).includes("upload:progress")) {
        return JSON.stringify({ status: "done", percent: 100 });
      }
      return null;
    });
    const named = await request(app)
      .get("/attendance/upload/progress")
      .set(auth());
    expect(named.status, detail(named)).toBe(200);

    const publish = await request(app)
      .get("/grades/publish/progress")
      .set(auth());
    expect(publish.status, detail(publish)).toBe(200);
    const idle = await request(app)
      .get("/attendance/publish/progress")
      .set(auth("director", "director1"));
    expect(idle.status, detail(idle)).toBe(200);
  });

  it("manages subjects and purges a student", async () => {
    const created = await request(app).post("/subjects/add").set(auth()).send({
      code: "CS2001",
      name: "Data Structures",
      credits: 4,
      department: "CSE",
      semester: "E2-SEM-1",
    });
    expect(created.status, detail(created)).toBe(200);

    const hodOk = await request(app)
      .post("/subjects/add")
      .set(auth("hod", "hod_cse"))
      .send({
        code: "CS2002",
        name: "OS",
        credits: 4,
        department: "CSE",
        semester: "E2-SEM-2",
      });
    expect(hodOk.status, detail(hodOk)).toBe(200);

    const hodDenied = await request(app)
      .post("/subjects/add")
      .set(auth("hod", "hod_ece"))
      .send({
        code: "CS2002",
        name: "OS",
        credits: 4,
        department: "CSE",
        semester: "E2-SEM-2",
      });
    expect(hodDenied.status).toBe(403);

    const badSem = await request(app).post("/subjects/add").set(auth()).send({
      code: "X",
      name: "X",
      credits: 1,
      department: "CSE",
      semester: "SEM-9",
    });
    expect(badSem.status).toBe(400);

    const updated = await request(app)
      .put("/subjects/sub-1")
      .set(auth())
      .send({
        code: "CS2001",
        name: "Data Structures II",
        credits: 4,
        department: "CSE",
        semester: "E2-SEM-1",
      });
    expect(updated.status, detail(updated)).toBe(200);

    prisma.grade.count.mockResolvedValueOnce(2);
    const blocked = await request(app)
      .delete("/subjects/sub-1")
      .set(auth());
    expect(blocked.status).toBe(409);

    prisma.subject.findUnique.mockResolvedValueOnce(null);
    const missing = await request(app).delete("/subjects/missing").set(auth());
    expect(missing.status).toBe(404);

    const removed = await request(app).delete("/subjects/sub-1").set(auth());
    expect(removed.status, detail(removed)).toBe(200);

    const purged = await request(app)
      .delete("/internal/student/O210008")
      .set(auth());
    expect(purged.status, detail(purged)).toBe(200);
    expect(purged.body.success).toBe(true);
  });

  it("builds templates, accepts spreadsheets, and downloads pdfs", async () => {
    const gradeTemplate = await request(app)
      .get("/grades/template")
      .query({ branch: "CSE", year: "E2", semesterId: "E2-SEM-1", batch: "O21" })
      .set(auth());
    expect(gradeTemplate.status, detail(gradeTemplate)).toBe(200);

    const attendanceTemplate = await request(app)
      .get("/attendance/template")
      .query({ branch: "CSE", year: "E2", semesterId: "E2-SEM-1" })
      .set(auth());
    expect(attendanceTemplate.status, detail(attendanceTemplate)).toBe(200);

    const gradeFile = await workbook(
      ["Student ID", "Subject Code", "Semester ID", "Grade (EX, A, B, C, D, E, R)"],
      [["O210008", "CS2001", "E2-SEM-1", "A"]],
    );
    const uploaded = await request(app)
      .post("/grades/upload")
      .set(auth())
      .attach("file", gradeFile, "grades.xlsx");
    expect(uploaded.status, detail(uploaded)).toBe(202);
    await settle();

    const noFile = await request(app).post("/grades/upload").set(auth());
    expect(noFile.status).toBe(400);

    const attendanceFile = await workbook(
      [
        "Student ID",
        "Subject Code",
        "Semester ID",
        "Total Classes Occurred",
        "Total Classes Attended",
      ],
      [["O210008", "CS2001", "E2-SEM-1", 10, 8]],
    );
    const attendanceUpload = await request(app)
      .post("/attendance/upload")
      .set(auth())
      .attach("file", attendanceFile, "attendance.xlsx");
    expect(attendanceUpload.status, detail(attendanceUpload)).toBe(202);
    await settle();

    const pdf = await request(app)
      .get("/grades/download/E2-SEM-1")
      .query({ studentId: "O210008", reportType: "REMEDIAL" })
      .set(auth());
    expect(pdf.status, detail(pdf)).toBe(200);

    const regular = await request(app)
      .get("/grades/download/E2-SEM-1")
      .query({ reportType: "REGULAR" })
      .set(auth("student", "O210008"));
    expect(regular.status, detail(regular)).toBe(200);

    const slip = await request(app)
      .get("/attendance/download/E2-SEM-1")
      .query({ studentId: "O210008" })
      .set(auth());
    expect(slip.status, detail(slip)).toBe(200);
  });

  it("runs the upload worker for grades, attendance, and bad jobs", async () => {
    prisma.branchAllocation.findMany.mockImplementation(async (args: any) => {
      if (args?.where?.customCode) {
        return [
          {
            customCode: "ACAD2001",
            semesterId: "E2-SEM-1",
            subjectId: "sub-1",
            subject: {
              id: "sub-1",
              code: "CS2001",
              name: "Data Structures",
              credits: 4,
              department: "CSE",
              semester: "E2-SEM-1",
            },
          },
        ];
      }
      return [
        {
          id: "alloc-1",
          semesterId: "E2-SEM-1",
          subjectId: "sub-1",
          branch: "CSE",
          academicYear: "E2",
          batch: "O21",
          isMandatory: true,
          isApproved: true,
          status: "APPROVED",
          electiveGroupId: null,
          customCode: "CS2001",
          customName: "Data Structures",
          customCredits: 4,
          subject: {
            id: "sub-1",
            code: "CS2001",
            name: "Data Structures",
            credits: 4,
            department: "CSE",
            semester: "E2-SEM-1",
          },
        },
      ];
    });
    prisma.grade.findUnique.mockResolvedValueOnce({
      id: "grade-1",
      grade: 0,
      isRemedial: false,
    });

    redis.lpop.mockResolvedValueOnce(
      JSON.stringify({
        type: "GRADES",
        uploadId: "grades-job",
        total: 4,
        filename: "grades.xlsx",
        user: { username: "admin1" },
        rows: [
          {
            "Student ID": "O210008",
            "Subject Code": "CS2001",
            "Semester ID": "E2-SEM-1",
            Grade: "A",
            "Pass Date": "2024-06-01",
            "Is Remedial": "YES",
            "Subject Name": "Data Structures",
          },
          {
            "Student ID": "O210009",
            "Academic Code": "ACAD2001",
            "Academic Semester ID": "E2-SEM-1",
            "Semester ID": "E2-SEM-1",
            Grade: "B",
          },
          { "Student ID": "O210008" },
          {
            "Student ID": "O210008",
            "Subject Code": "MISSING",
            "Semester ID": "E2-SEM-1",
            Grade: "C",
          },
        ],
      }),
    );
    const grades = await processNextBatch();
    expect(grades?.status).toBe("completed");

    redis.lpop.mockResolvedValueOnce(
      JSON.stringify({
        type: "ATTENDANCE",
        uploadId: "att-job",
        total: 1,
        filename: "attendance.xlsx",
        user: { username: "admin1" },
        rows: [
          {
            "Student ID": "O210008",
            "Subject Code": "CS2001",
            Semester: "E2-SEM-1",
            "Total Classes Attended": "8",
            "Total Classes Occurred": "10",
          },
        ],
      }),
    );
    const attendance = await processNextBatch();
    expect(attendance?.status).toBe("completed");

    redis.lpop.mockResolvedValueOnce("not-json");
    expect(await processNextBatch()).toBeNull();
    expect(await processNextBatch()).toBeNull();
  });

  it("guards and drains the internal queue", async () => {
    const denied = await request(app).post("/api/queue/process");
    expect(denied.status).toBe(401);

    const empty = await request(app)
      .post("/api/queue/process")
      .set("x-internal-secret", SECRET);
    expect(empty.status, detail(empty)).toBe(200);
    expect(empty.body.message).toBe("No jobs in queue");

    redis.lpop.mockRejectedValueOnce(new Error("redis exploded"));
    const failed = await request(app)
      .post("/api/queue/process")
      .set("x-internal-secret", SECRET);
    expect(failed.status).toBe(500);

    vi.useFakeTimers();
    const rows = Array.from({ length: 301 }, () => ({}));
    redis.lpop.mockResolvedValueOnce(
      JSON.stringify({
        type: "GRADES",
        rows,
        user: { username: "admin1" },
        uploadId: "continued-1",
        total: 301,
      }),
    );
    const res = mockResponse();
    const pending = processQueue(
      { headers: { "x-internal-secret": SECRET } } as any,
      res as any,
    );
    await vi.advanceTimersByTimeAsync(1000);
    await pending;
    expect(res.statusCode).toBe(200);
    expect((res.body as any).status).toBe("continued");
  });

  it("resumes leftover jobs when the app starts", async () => {
    vi.useFakeTimers();
    redis.llen.mockResolvedValueOnce(2);
    redis.lpop.mockResolvedValue(null);
    createApp();
    await vi.advanceTimersByTimeAsync(5000);

    redis.llen.mockRejectedValueOnce(new Error("redis down"));
    createApp();
    await vi.advanceTimersByTimeAsync(5000);
  });

  it("runs semester, registration, faculty, seating, and analytics routes", async () => {
    const exists = await request(app)
      .post("/semester/init")
      .set(auth())
      .send({ academicSemester: "AY 2024-25 E1-SEM-1", branches: ["CSE"] });
    expect(exists.status).toBe(400);

    prisma.academicSemester.findFirst.mockResolvedValueOnce(null);
    const init = await request(app)
      .post("/semester/init")
      .set(auth("coe", "coe1"))
      .send({
        academicSemester: "AY 2024-25 E1-SEM-1",
        branches: ["CSE", { branchName: "ECE" }, {}],
      });
    expect(init.status, detail(init)).toBe(201);

    const duplicate = await request(app)
      .post("/semester/create")
      .set(auth())
      .send({ name: "E2 Semester 1" });
    expect(duplicate.status).toBe(400);

    prisma.academicSemester.findFirst.mockResolvedValueOnce(null);
    const created = await request(app)
      .post("/semester/create")
      .set(auth("director", "director1"))
      .send({
        name: "AY 2025-26 E2-SEM-2",
        academicYear: "E2",
        batch: "O23",
        submit: true,
        registrationStart: "2026-01-01T09:00",
        registrationEnd: "2026-01-20T17:00",
        electiveGroups: [
          {
            branch: "CSE",
            academicYear: "E2",
            groupCode: "PE1",
            groupName: "Professional Elective",
            selectionLimit: 1,
          },
        ],
        subjects: [
          {
            code: "CS2100",
            name: "Operating Systems",
            credits: 4,
            department: "CSE",
            academicYear: "E2",
            subjectType: "CORE",
            academicCode: "OS2100",
          },
        ],
      });
    expect(created.status, detail(created)).toBe(201);

    const addedSubjects = await request(app)
      .post("/semester/E2-SEM-1/subjects")
      .set(auth("hod", "hod_cse"))
      .send({
        subjects: [
          { code: "CS2101", name: "Networks", credits: 3, department: "CSE", academicYear: "E2" },
          { code: "EC2101", name: "Circuits", credits: 3, department: "ECE", academicYear: "E2" },
        ],
      });
    expect(addedSubjects.status, detail(addedSubjects)).toBe(200);

    const semesters = await request(app).get("/semester").set(auth());
    expect(semesters.status, detail(semesters)).toBe(200);

    const overview = await request(app)
      .get("/semester/overview")
      .query({ semesterId: "E2-SEM-1" })
      .set(auth());
    expect(overview.status, detail(overview)).toBe(200);

    const config = await request(app)
      .put("/semester/E2-SEM-1/config")
      .set(auth())
      .send({
        name: "E2 Semester 1",
        academicYear: "E2",
        registrationStart: "2024-01-01T09:00",
        registrationEnd: "2099-01-01T17:00",
      });
    expect(config.status, detail(config)).toBe(200);

    const status = await request(app)
      .patch("/semester/status/E2-SEM-1")
      .set(auth())
      .send({ status: "DEAN_REVIEW" });
    expect(status.status, detail(status)).toBe(200);

    const blockedOpen = await request(app)
      .put("/semester/status/E2-SEM-1")
      .set(auth())
      .send({ status: "REGISTRATION_OPEN" });
    expect(blockedOpen.status).toBe(403);

    const submitted = await request(app)
      .post("/semester/E2-SEM-1/advance")
      .set(auth())
      .send({ action: "submit" });
    expect(submitted.status, detail(submitted)).toBe(200);

    const rejected = await request(app)
      .post("/semester/E2-SEM-1/advance")
      .set(auth("dean", "dean1"))
      .send({ action: "reject" });
    expect(rejected.status, detail(rejected)).toBe(200);

    prisma.academicSemester.findUnique.mockResolvedValueOnce({
      id: "E2-SEM-1",
      name: "E2 Semester 1",
      status: "DEAN_REVIEW",
    });
    const deanOk = await request(app)
      .post("/semester/E2-SEM-1/advance")
      .set(auth("dean", "dean1"))
      .send({ action: "approve" });
    expect(deanOk.status, detail(deanOk)).toBe(200);

    prisma.academicSemester.findUnique.mockResolvedValueOnce({
      id: "E2-SEM-1",
      name: "E2 Semester 1",
      status: "HOD_REVIEW",
    });
    const hodOk = await request(app)
      .post("/semester/E2-SEM-1/advance")
      .set(auth("hod", "hod_cse"))
      .send({ action: "approve", branch: "CSE" });
    expect(hodOk.status, detail(hodOk)).toBe(200);

    const opened = await request(app)
      .post("/semester/E2-SEM-1/advance")
      .set(auth())
      .send({ action: "approve" });
    expect(opened.status, detail(opened)).toBe(200);

    const groups = await request(app)
      .get("/semester/E2-SEM-1/elective-groups")
      .query({ branch: "CSE" })
      .set(auth());
    expect(groups.status, detail(groups)).toBe(200);

    const group = await request(app)
      .post("/semester/E2-SEM-1/elective-groups")
      .set(auth())
      .send({
        branch: "CSE",
        academicYear: "E2",
        groupCode: "PE1",
        groupName: "Professional Elective",
        selectionLimit: 1,
      });
    expect(group.status, detail(group)).toBe(200);

    const dropGroup = await request(app)
      .delete("/semester/elective-groups/grp-1")
      .set(auth());
    expect(dropGroup.status, detail(dropGroup)).toBe(200);

    prisma.academicSemester.findUnique.mockResolvedValueOnce({
      id: "E2-SEM-1",
      name: "E2 Semester 1",
      status: "HOD_REVIEW",
    });
    const code = await request(app)
      .post("/semester/E2-SEM-1/publish/request-code")
      .set(auth("webadmin", "admin1"));
    expect(code.status, detail(code)).toBe(200);

    const already = await request(app)
      .post("/semester/E2-SEM-1/publish/resend-code")
      .set(auth());
    expect(already.status).toBe(400);

    redis.get.mockResolvedValueOnce("123456");
    prisma.academicSemester.findUnique.mockResolvedValueOnce({
      id: "E2-SEM-1",
      name: "E2 Semester 1",
      status: "HOD_REVIEW",
    });
    const confirm = await request(app)
      .post("/semester/E2-SEM-1/publish")
      .set(auth())
      .send({ code: "123456" });
    expect(confirm.status, detail(confirm)).toBe(200);

    const badCode = await request(app)
      .post("/semester/E2-SEM-1/publish")
      .set(auth())
      .send({ code: "12" });
    expect(badCode.status).toBe(400);

    const review = await request(app)
      .get("/dean/review/CSE")
      .query({ semesterId: "E2-SEM-1", year: "E2", batch: "O21" })
      .set(auth("dean", "dean1"));
    expect(review.status, detail(review)).toBe(200);

    const allocation = await request(app)
      .post("/dean/allocation")
      .set(auth("hod", "hod_cse"))
      .send({
        semesterId: "E2-SEM-1",
        branch: "CSE",
        subjectId: "sub-1",
        academicYear: "E2",
        batch: "O21",
      });
    expect(allocation.status, detail(allocation)).toBe(200);

    const allocationDenied = await request(app)
      .post("/dean/allocation")
      .set(auth("hod", "hod_cse"))
      .send({ semesterId: "E2-SEM-1", branch: "ECE", subjectId: "sub-1" });
    expect(allocationDenied.status).toBe(403);

    const allocationEdit = await request(app)
      .put("/dean/allocation/alloc-1")
      .set(auth())
      .send({ customName: "DS", customCredits: 4, isMandatory: true });
    expect(allocationEdit.status, detail(allocationEdit)).toBe(200);

    const approved = await request(app)
      .post("/dean/approve")
      .set(auth("dean", "dean1"))
      .send({ branch: "CSE", semesterId: "E2-SEM-1", year: "E2" });
    expect(approved.status, detail(approved)).toBe(200);

    const available = await request(app)
      .get("/student/available")
      .query({ branch: "CSE", year: "E2" })
      .set(auth("student", "O210008"));
    expect(available.status, detail(available)).toBe(200);

    const registered = await request(app)
      .post("/student/register")
      .set(auth("student", "O210008"))
      .send({ subjectIds: ["sub-1"] });
    expect(registered.status, detail(registered)).toBe(201);

    prisma.registration.count.mockResolvedValueOnce(1);
    const twice = await request(app)
      .post("/student/register")
      .set(auth("student", "O210008"))
      .send({ subjectIds: ["sub-1"] });
    expect(twice.status).toBe(409);

    const current = await request(app)
      .get("/student/current/O210008")
      .set(auth("student", "O210008"));
    expect(current.status, detail(current)).toBe(200);

    const tracking = await request(app)
      .get("/registrations/tracking")
      .query({
        semesterId: "E2-SEM-1",
        branch: "CSE",
        year: "E2",
        batch: "O21",
        status: "registered",
        query: "O210008",
        page: "1",
        limit: "10",
      })
      .set(auth("hod", "hod_cse"));
    expect(tracking.status, detail(tracking)).toBe(200);

    const regs = await request(app)
      .get("/registrations")
      .query({ branch: "CSE", semesterId: "E2-SEM-1", batch: "O21" })
      .set(auth());
    expect(regs.status, detail(regs)).toBe(200);

    const exported = await request(app)
      .get("/export")
      .query({ type: "registrations", branch: "CSE", semesterId: "E2-SEM-1", batch: "O21" })
      .set(auth());
    expect(exported.status, detail(exported)).toBe(200);

    const catalog = await request(app)
      .get("/registration/subjects/template")
      .query({ semesterId: "E2-SEM-1", branch: "CSE", year: "E2" })
      .set(auth());
    expect(catalog.status, detail(catalog)).toBe(200);

    prisma.registration.count.mockResolvedValue(1);
    const syncPdf = await request(app)
      .get("/student/registration/pdf")
      .query({ semesterId: "E2-SEM-1", studentId: "O210008", sync: "1" })
      .set(auth());
    expect(syncPdf.status, detail(syncPdf)).toBe(200);

    const queuedPdf = await request(app)
      .get("/student/registration/pdf")
      .query({ studentId: "O210008" })
      .set(auth("dean", "dean1"));
    expect(queuedPdf.status, detail(queuedPdf)).toBe(202);

    const bulkPdf = await request(app)
      .get("/registrations/pdf/bulk")
      .query({ semesterId: "E2-SEM-1", branch: "CSE", year: "E2", batch: "O21" })
      .set(auth());
    expect(bulkPdf.status, detail(bulkPdf)).toBe(202);

    const worker = Worker.instances[Worker.instances.length - 1];
    expect(worker).toBeTruthy();
    const single = await worker.processor({
      id: "pdf-1",
      data: {
        jobId: "pdf-1",
        kind: "single",
        semesterId: "E2-SEM-1",
        studentId: "O210008",
        requestedBy: "admin1",
        role: "webadmin",
        filename: "one.pdf",
      },
    });
    expect((single as any).bytes).toBeGreaterThan(0);
    const bulk = await worker.processor({
      id: "pdf-2",
      data: {
        jobId: "pdf-2",
        kind: "bulk",
        semesterId: "E2-SEM-1",
        branch: "CSE",
        year: "E2",
        batch: "O21",
        query: "O21",
        requestedBy: "admin1",
        role: "webadmin",
        authHeader: "",
        filename: "bulk.pdf",
      },
    });
    expect((bulk as any).bytes).toBeGreaterThan(0);
    await worker.handlers.get("failed")?.(
      { id: "pdf-3", data: { jobId: "pdf-3" } },
      new Error("render failed"),
    );

    redis.get.mockImplementation(async (key: string) => {
      if (String(key).endsWith("pdf-done")) {
        return JSON.stringify({
          status: "done",
          percent: 100,
          filename: "done.pdf",
          kind: "single",
        });
      }
      if (String(key).endsWith("pdf-wait")) {
        return JSON.stringify({ status: "processing", percent: 10, kind: "bulk" });
      }
      return null;
    });
    redis.getBuffer.mockResolvedValue(Buffer.from("%PDF-1.4"));
    const ready = await request(app)
      .get("/registrations/pdf/jobs/pdf-done")
      .set(auth());
    expect(ready.status, detail(ready)).toBe(200);
    const download = await request(app)
      .get("/registrations/pdf/jobs/pdf-done/download")
      .set(auth());
    expect(download.status, detail(download)).toBe(200);
    const waiting = await request(app)
      .get("/registrations/pdf/jobs/pdf-wait/download")
      .set(auth());
    expect(waiting.status).toBe(409);
    const unknownJob = await request(app)
      .get("/registrations/pdf/jobs/missing")
      .set(auth());
    expect(unknownJob.status).toBe(404);

    const faculties = await request(app)
      .get("/faculty")
      .query({ department: "CSE" })
      .set(auth());
    expect(faculties.status, detail(faculties)).toBe(200);
    const profile = await request(app).get("/faculty/fac-1").set(auth());
    expect(profile.status, detail(profile)).toBe(200);
    prisma.faculty.findUnique.mockResolvedValueOnce(null);
    const noFaculty = await request(app).get("/faculty/missing").set(auth());
    expect(noFaculty.status).toBe(404);

    const faculty = await request(app).post("/faculty").set(auth()).send({
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      department: "cse",
      designation: "Professor",
      role: "FACULTY",
    });
    expect(faculty.status, detail(faculty)).toBe(201);

    const facultyDenied = await request(app)
      .post("/faculty")
      .set(auth("student", "O210008"))
      .send({ name: "X", email: "x@example.com", department: "CSE" });
    expect(facultyDenied.status).toBe(403);

    const facultyEdit = await request(app)
      .put("/faculty/fac-1")
      .set(auth())
      .send({ name: "Ada", department: "cse", designation: "Professor", role: "DEAN" });
    expect(facultyEdit.status, detail(facultyEdit)).toBe(200);

    const facultyGone = await request(app).delete("/faculty/fac-1").set(auth());
    expect(facultyGone.status, detail(facultyGone)).toBe(200);

    const roleReq = mockRequest(auth());
    (roleReq as any).params = { id: "fac-1" };
    (roleReq as any).body = { role: "DEAN" };
    const roleRes = mockResponse();
    await updateFacultyRole(roleReq as any, roleRes as any);
    expect(roleRes.statusCode).toBe(200);

    const seatMissing = await request(app).get("/seating/template").set(auth());
    expect(seatMissing.status).toBe(400);
    prisma.academicSemester.findUnique.mockResolvedValueOnce(null);
    const seat404 = await request(app)
      .get("/seating/template")
      .query({ semesterId: "missing" })
      .set(auth());
    expect(seat404.status).toBe(404);
    const seat = await request(app)
      .get("/seating/template")
      .query({ semesterId: "E2-SEM-1", branch: "CSE", year: "E2", examName: "MID-1" })
      .set(auth());
    expect(seat.status, detail(seat)).toBe(200);

    const seatFile = await workbook(
      [
        "Student ID",
        "Student Name",
        "Branch",
        "Year",
        "Subject Code",
        "Subject Name",
        "Exam Name",
        "Exam Date (YYYY-MM-DD)",
        "Exam Time",
        "Room",
        "Seat Number",
      ],
      [
        [
          "O210008",
          "Ada",
          "CSE",
          "E2",
          "CS2001",
          "Data Structures",
          "MID-1",
          "2024-03-01",
          "10:00",
          "A1",
          "12",
        ],
      ],
    );
    const seatUpload = await request(app)
      .post("/seating/upload")
      .set(auth())
      .field("semesterId", "E2-SEM-1")
      .attach("file", seatFile, "seating.xlsx");
    expect(seatUpload.status, detail(seatUpload)).toBe(200);

    const seatEmpty = await request(app).post("/seating/upload").set(auth());
    expect(seatEmpty.status).toBe(400);

    const mine = await request(app)
      .get("/seating/student")
      .set(auth("student", "O210008"));
    expect(mine.status, detail(mine)).toBe(200);
    expect(mine.body.seating.length).toBeGreaterThan(0);

    const summary = await request(app)
      .get("/analytics/admin-summary")
      .query({ role: "dean", department: "CSE" })
      .set(auth("dean", "dean1"));
    expect(summary.status, detail(summary)).toBe(200);
    expect(summary.body.data.branchPerformance.length).toBeGreaterThan(0);

    const hodSummary = await request(app)
      .get("/analytics/admin-summary")
      .query({ role: "hod", department: "CSE" })
      .set(auth("hod", "hod_cse"));
    expect(hodSummary.status, detail(hodSummary)).toBe(200);

    const adminSummary = await request(app)
      .get("/analytics/admin-summary")
      .query({ role: "webadmin" })
      .set(auth());
    expect(adminSummary.status, detail(adminSummary)).toBe(200);

    redis.get.mockResolvedValueOnce(
      JSON.stringify({ success: true, data: { totalStudents: 1 } }),
    );
    const cachedSummary = await request(app)
      .get("/analytics/admin-summary")
      .query({ role: "swo" })
      .set(auth());
    expect(cachedSummary.body.data.totalStudents).toBe(1);

    prisma.$queryRawUnsafe.mockRejectedValueOnce(new Error("sql"));
    const queryFailed = await request(app)
      .get("/analytics/admin-summary")
      .query({ role: "director" })
      .set(auth());
    expect(queryFailed.status, detail(queryFailed)).toBe(200);

    const removedSem = await request(app)
      .delete("/semester/E2-SEM-1")
      .set(auth());
    expect(removedSem.status, detail(removedSem)).toBe(200);
    const removedAlloc = await request(app)
      .delete("/dean/allocation/alloc-1")
      .set(auth());
    expect(removedAlloc.status, detail(removedAlloc)).toBe(200);
  });

  it("draws result, attendance, and registration pdfs", async () => {
    const result = await generateResultPdf({
      username: "O210008",
      name: "Ada Lovelace",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E2-SEM-1",
      resultType: "REMEDIAL",
      attempts: [
        {
          label: "REGULAR RESULTS",
          grades: [
            {
              grade: 10,
              attemptNumber: 1,
              isRemedial: false,
              passDate: "2024-05-01",
              subject: { code: "CS2001", name: "Data Structures", credits: 4 },
            },
            {
              grade: 0,
              attemptNumber: 1,
              subject: { code: "CS2002", name: "Discrete Mathematics", credits: 3 },
            },
          ],
        },
        {
          label: "REMEDIAL RESULTS",
          grades: [
            {
              grade: 6,
              attemptNumber: 2,
              isRemedial: true,
              passDate: new Date("2024-08-01"),
              subject: { code: "CS2002", name: "Discrete Mathematics", credits: 3 },
            },
          ],
        },
      ],
    });
    expect(result.length).toBeGreaterThan(100);

    const attendance = await generateAttendancePdf({
      username: "O210008",
      name: "Ada Lovelace",
      branch: "CSE",
      campus: "N/A",
      semesterId: "E2-SEM-1",
      records: [
        {
          attendedClasses: 8,
          totalClasses: 10,
          subject: { code: "CS2001", name: "Data Structures" },
        },
        {
          attendedClasses: 2,
          totalClasses: 10,
          subject: { code: "CS2002", name: "Discrete Mathematics" },
        },
      ],
    });
    expect(attendance.length).toBeGreaterThan(100);

    const slip = {
      username: "O210008",
      name: "Ada Lovelace",
      branch: "CSE",
      batch: "O21",
      year: "E2",
      campus: "Ongole",
      semesterName: "E2 Semester 1",
      semesterId: "E2-SEM-1",
      registrationId: "reg-1",
      submittedAt: new Date("2024-06-01"),
      subjects: [
        { code: "CS2001", name: "Data Structures", credits: 4, type: "CORE" },
        { code: "CS2002", name: "Discrete Mathematics", credits: 3, type: "ELECTIVE" },
      ],
      totalCredits: 7,
    };
    expect((await generateRegistrationPdf(slip)).length).toBeGreaterThan(100);
    expect(
      (await generateBulkRegistrationPdf([slip, { ...slip, username: "O210009" }])).length,
    ).toBeGreaterThan(100);
  });
});

function notificationAdds() {
  return notificationQueue.add.mock.calls.length;
}
