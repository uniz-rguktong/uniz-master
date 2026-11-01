import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  exportStudentsSelective,
  getStudentsTemplate,
  getUploadHistory,
  getUploadProgress,
  recordExternalUpload,
  uploadStudents,
} from "../src/controllers/bulk.controller";
import { mockReq, mockRes } from "./http";
import { prismaMock, redisMock } from "./mocks";

const webadmin = { username: "web", role: "webadmin" };

async function sheet(headers: string[], data: unknown[][]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");
  worksheet.addRow(headers);
  for (const row of data) worksheet.addRow(row);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const goodHeaders = [
  "Student ID",
  "Name",
  "Email",
  "Branch",
  "Year",
  "Section",
];

describe("uploadStudents", () => {
  it("restricts the route to webadmin and requires a file", async () => {
    const denied = mockRes();
    await uploadStudents(
      mockReq({ user: { username: "hod_cse", role: "hod" } }),
      denied,
    );
    expect(denied.statusCode).toBe(403);

    const missing = mockRes();
    await uploadStudents(mockReq({ user: webadmin }), missing);
    expect(missing.statusCode).toBe(400);
    expect(missing.body.message).toBe("Excel file required");
  });

  it("rejects a sheet with missing columns and bad rows", async () => {
    const headersOnly = mockRes();
    await uploadStudents(
      mockReq({
        user: webadmin,
        file: {
          buffer: await sheet(["Student ID"], [["O240001"]]),
          originalname: "bad.xlsx",
        },
      }),
      headersOnly,
    );
    expect(headersOnly.statusCode).toBe(400);
    expect(headersOnly.body.errorCount).toBeGreaterThan(0);

    const badRow = mockRes();
    await uploadStudents(
      mockReq({
        user: webadmin,
        file: {
          buffer: await sheet(goodHeaders, [
            ["nope", "", "not-email", "GENERAL", "E9", ""],
          ]),
          originalname: "rows.xlsx",
        },
      }),
      badRow,
    );
    expect(badRow.statusCode).toBe(400);
    expect(badRow.body.success).toBe(false);
    expect(redisMock.rpush).not.toHaveBeenCalled();
  });

  it("queues a valid sheet", async () => {
    const res = mockRes();
    await uploadStudents(
      mockReq({
        user: webadmin,
        file: {
          buffer: await sheet(goodHeaders, [
            ["O240001", "Ada", "ada@rguktong.ac.in", "CSE", "E1", "A"],
          ]),
          originalname: "students.xlsx",
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(202);
    expect(res.body.total).toBe(1);
    expect(redisMock.rpush).toHaveBeenCalledWith(
      "student:job:queue",
      expect.any(String),
    );
    const queued = JSON.parse(redisMock.rpush.mock.calls[0][1]);
    expect(queued.majorityBatch).toBe("O24");
    expect(queued.rows[0]["student id"]).toBe("O240001");
  });

  it("returns 500 for a corrupt workbook", async () => {
    const res = mockRes();
    await uploadStudents(
      mockReq({
        user: webadmin,
        file: { buffer: Buffer.from("not-a-workbook"), originalname: "x.xlsx" },
      }),
      res,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe("upload progress and template", () => {
  it("sends the student template workbook", async () => {
    const res = mockRes();
    await getStudentsTemplate(mockReq({ user: webadmin }), res);
    expect(res.headers["Content-Type"]).toContain("spreadsheetml");
    expect(Buffer.isBuffer(res.body) || res.body instanceof Uint8Array).toBe(
      true,
    );
  });

  it("requires a user and reports idle when nothing is cached", async () => {
    const unauth = mockRes();
    await getUploadProgress(mockReq(), unauth);
    expect(unauth.statusCode).toBe(401);

    redisMock.get.mockResolvedValue(null);
    const idle = mockRes();
    await getUploadProgress(mockReq({ user: webadmin }), idle);
    expect(idle.body.status).toBe("idle");
  });

  it("returns progress and pokes a stuck job", async () => {
    redisMock.get.mockResolvedValue(
      JSON.stringify({
        status: "processing",
        lastActive: Date.now() - 20000,
        processed: 1,
        total: 2,
      }),
    );
    redisMock.lpop.mockResolvedValue(null);
    const res = mockRes();
    await getUploadProgress(mockReq({ user: webadmin }), res);
    expect(res.body.status).toBe("processing");
    await new Promise((resolve) => setImmediate(resolve));
    expect(redisMock.lpop).toHaveBeenCalledWith("student:job:queue");
  });
});

describe("export and upload history", () => {
  it("stops an HOD export when the branch cannot be resolved", async () => {
    const res = mockRes();
    await exportStudentsSelective(
      mockReq({
        user: { username: "faculty", role: "hod" },
        query: {},
      }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("HOD department");
  });

  it("returns 404 when the filter matches nobody", async () => {
    prismaMock.studentProfile.findMany.mockResolvedValue([]);
    const res = mockRes();
    await exportStudentsSelective(
      mockReq({
        user: webadmin,
        query: { branch: "cse", year: "e2" },
      }),
      res,
    );
    expect(res.statusCode).toBe(404);
    expect(prismaMock.studentProfile.findMany.mock.calls[0][0].where).toEqual({
      branch: "CSE",
      year: "E2",
    });
  });

  it("writes an xlsx for the matching students", async () => {
    prismaMock.studentProfile.findMany.mockResolvedValue([
      { username: "O240001", name: "Ada", branch: "CSE" },
    ]);
    const res = mockRes();
    await exportStudentsSelective(
      mockReq({
        user: { username: "hod_cse", role: "hod", department: "CSE" },
        query: { fields: "username,not_a_field" },
      }),
      res,
    );
    expect(res.headers["Content-Disposition"]).toContain("Students_Export_");
    expect(prismaMock.studentProfile.findMany.mock.calls[0][0].where.branch).toBe(
      "CSE",
    );
  });

  it("lists history and records an external upload", async () => {
    prismaMock.uploadHistory.findMany.mockResolvedValue([{ id: "h1" }]);
    const listed = mockRes();
    await getUploadHistory(mockReq({ user: webadmin }), listed);
    expect(listed.body.history).toEqual([{ id: "h1" }]);

    const denied = mockRes();
    await recordExternalUpload(mockReq({ body: {} }), denied);
    expect(denied.statusCode).toBe(403);

    prismaMock.uploadHistory.create.mockResolvedValue({ id: "h2" });
    const saved = mockRes();
    await recordExternalUpload(
      mockReq({
        headers: { "x-internal-secret": "unit-test-internal" },
        body: {
          type: "STUDENTS",
          filename: "a.xlsx",
          totalRows: 2,
          successCount: 1,
          failCount: 1,
          uploadedBy: "academics",
        },
      }),
      saved,
    );
    expect(saved.body.historyId).toBe("h2");
    expect(prismaMock.uploadHistory.create.mock.calls[0][0].data.status).toBe(
      "PARTIAL",
    );
  });
});
