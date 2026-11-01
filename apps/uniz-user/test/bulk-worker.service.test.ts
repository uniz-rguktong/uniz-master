import { describe, expect, it } from "vitest";
import { processNextStudentBatch } from "../src/services/bulk-worker.service";
import { axiosMock, prismaMock, redisMock } from "./mocks";

function job(rows: Record<string, unknown>[], extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    rows,
    username: "webadmin",
    uploadId: "up-1",
    processed: 0,
    total: rows.length,
    fileUrl: "https://files.test/students.xlsx",
    filename: "students.xlsx",
    startTime: Date.now(),
    successCount: 0,
    failCount: 0,
    errors: [],
    majorityBatch: "O24",
    ...extra,
  });
}

function studentRow(id: string, extra: Record<string, unknown> = {}) {
  return {
    "student id": id,
    name: "Ada Lovelace",
    email: "ada@rguktong.ac.in",
    branch: "Computer Science and Engineering",
    year: "E2",
    section: "A",
    batch: "O24",
    "is in campus": "YES",
    ...extra,
  };
}

describe("processNextStudentBatch", () => {
  it("returns null when the queue is empty or the payload is not json", async () => {
    redisMock.lpop.mockResolvedValueOnce(null);
    expect(await processNextStudentBatch()).toBeNull();

    redisMock.lpop.mockResolvedValueOnce("{not json");
    expect(await processNextStudentBatch()).toBeNull();
    expect(prismaMock.studentProfile.upsert).not.toHaveBeenCalled();
  });

  it("upserts a normalized row and records a completed history entry", async () => {
    redisMock.lpop.mockResolvedValueOnce(
      job([
        studentRow("ro240001", {
          gender: "F",
          phone: "999",
          roomno: "C-12",
        }),
      ]),
    );
    prismaMock.studentProfile.upsert.mockResolvedValue({ username: "O240001" });
    prismaMock.uploadHistory.create.mockResolvedValue({ id: "h1" });

    const result = await processNextStudentBatch();

    expect(result).toEqual({ status: "done", processed: 1 });
    const upsert = prismaMock.studentProfile.upsert.mock.calls[0][0];
    expect(upsert.where).toEqual({ username: "O240001" });
    expect(upsert.create).toEqual(
      expect.objectContaining({
        username: "O240001",
        branch: "CSE",
        year: "E2",
        section: "A",
        batch: "O24",
        isPresentInCampus: true,
        roomno: "C-12",
      }),
    );
    expect(redisMock.del).toHaveBeenCalledWith(
      "profile:v2:O240001",
      "bootstrap:v1:O240001",
    );
    expect(axiosMock.post.mock.calls[0][1]).toEqual(
      expect.objectContaining({ username: "O240001", role: "student" }),
    );
    expect(prismaMock.uploadHistory.create.mock.calls[0][0].data.status).toBe(
      "COMPLETED",
    );
  });

  it("fills defaults and still succeeds when auth sync fails", async () => {
    redisMock.lpop.mockResolvedValueOnce(
      job([
        studentRow("O240002", {
          email: "",
          year: "",
          section: "UNKNOWN",
          branch: "",
          "is in campus": "no",
        }),
      ]),
    );
    prismaMock.studentProfile.upsert.mockResolvedValue({});
    axiosMock.post.mockRejectedValue(new Error("auth down"));
    prismaMock.uploadHistory.create.mockResolvedValue({});

    const result = await processNextStudentBatch();
    const created = prismaMock.studentProfile.upsert.mock.calls[0][0].create;
    expect(created.email).toBe("o240002@rguktong.ac.in");
    expect(created.year).toBe("E1");
    expect(created.branch).toBe("N/A");
    expect(["1", "2", "3", "4"]).toContain(created.section);
    expect(created.isPresentInCampus).toBe(false);
    expect(result?.status).toBe("done");
  });

  it("counts a missing id and a database error without aborting the job", async () => {
    redisMock.lpop.mockResolvedValueOnce(
      job([
        studentRow(""),
        studentRow("O240003"),
        { name: { text: "From Rich Text" }, "student id": "S240004" },
      ]),
    );
    prismaMock.studentProfile.upsert
      .mockRejectedValueOnce(new Error("unique"))
      .mockResolvedValueOnce({});
    prismaMock.uploadHistory.create.mockResolvedValue({});

    const result = await processNextStudentBatch();
    expect(result).toEqual({ status: "done", processed: 3 });
    expect(prismaMock.uploadHistory.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        successCount: 1,
        failCount: 2,
        status: "PARTIAL",
      }),
    );
  });

  it("requeues once a run has processed 300 rows", async () => {
    const rows = Array.from({ length: 301 }, (_, i) =>
      studentRow(`O${String(240000 + (i % 100000)).padStart(6, "0")}`),
    );
    rows[300]["student id"] = "O250001";
    redisMock.lpop.mockResolvedValueOnce(job(rows));
    prismaMock.studentProfile.upsert.mockResolvedValue({});

    const result = await processNextStudentBatch();
    expect(result).toEqual({
      status: "continued",
      processedInThisRun: 300,
      total: 301,
    });
    const requeued = JSON.parse(redisMock.rpush.mock.calls[0][1]);
    expect(requeued.rows).toHaveLength(1);
    expect(requeued.rows[0]["student id"]).toBe("O250001");
    expect(requeued.processed).toBe(300);
    expect(prismaMock.uploadHistory.create).not.toHaveBeenCalled();
  });

  it("marks the history FAILED when every row fails", async () => {
    redisMock.lpop.mockResolvedValueOnce(job([studentRow("")]));
    prismaMock.uploadHistory.create.mockResolvedValue({});
    await processNextStudentBatch();
    expect(prismaMock.uploadHistory.create.mock.calls[0][0].data.status).toBe(
      "FAILED",
    );
  });
});
