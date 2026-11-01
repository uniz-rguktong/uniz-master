import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  validateAttendanceUploadRows,
  validateGradesUploadRows,
} from "../src/services/academic-upload-validation.service";
import prisma from "../src/utils/prisma.util";

function gradeRow(partial: Record<string, string> = {}) {
  return {
    "Student ID": "O210008",
    "Subject Code": "CS2001",
    "Semester ID": "E2-SEM-1",
    Grade: "A",
    ...partial,
  };
}

describe("validateGradesUploadRows", () => {
  it("rejects a sheet with no data rows", async () => {
    const errors = await validateGradesUploadRows([
      { "Student ID": "   ", Grade: " " },
    ]);
    expect(errors).toEqual([
      { message: "No data rows found in the Excel file." },
    ]);
    expect(prisma.subject.findMany).not.toHaveBeenCalled();
  });

  it("reports missing fields, a bad campus id, a bad grade, and a duplicate", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "O210008" }] },
    });

    const errors = await validateGradesUploadRows([
      gradeRow({ "Student ID": "", Grade: "" }),
      gradeRow({ "Student ID": "ABC", Grade: "Z" }),
      gradeRow(),
      gradeRow(),
    ]);
    const messages = errors.map((error) => error.message).join("\n");
    expect(messages).toContain("Student ID is required");
    expect(messages).toContain("not a valid campus ID");
    expect(messages).toContain("Grade is missing or invalid");
    expect(messages).toContain("Duplicate entry");
    expect(messages).toContain("also at row 4");
  });

  it("accepts a catalog code for a known student", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "o210008" }] },
    });
    const errors = await validateGradesUploadRows([
      gradeRow({ "student id": "o210008", grade: "EX" }),
    ]);
    expect(errors).toEqual([]);
  });

  it("resolves an academic code inside the semester", async () => {
    prisma.academicSemester.findFirst.mockResolvedValue({ id: "AY-1" });
    prisma.branchAllocation.findMany.mockResolvedValue([
      {
        customCode: "AC101",
        semesterId: "AY-1",
        subject: { id: "sub-2", code: "INT202" },
      },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "O210008" }] },
    });
    const errors = await validateGradesUploadRows([
      gradeRow({ "Subject Code": "ac101" }),
    ]);
    expect(errors).toEqual([]);
  });

  it("flags an ambiguous academic code and an unknown code", async () => {
    prisma.branchAllocation.findMany.mockResolvedValue([
      {
        customCode: "AC101",
        semesterId: "OTHER",
        subject: { id: "sub-a", code: "A" },
      },
      {
        customCode: "AC101",
        semesterId: "OTHER",
        subject: { id: "sub-b", code: "B" },
      },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "O210008" }] },
    });
    const ambiguous = await validateGradesUploadRows([
      gradeRow({ "Subject Code": "AC101" }),
    ]);
    expect(ambiguous.some((error) => error.message.includes("multiple subjects"))).toBe(
      true,
    );

    prisma.branchAllocation.findMany.mockResolvedValue([]);
    const missing = await validateGradesUploadRows([
      gradeRow({ "Subject Code": "ZZ999" }),
    ]);
    expect(missing.some((error) => error.message.includes("was not found"))).toBe(
      true,
    );
  });

  it("reports a student who is missing from profiles", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockResolvedValue({ data: { students: [] } });
    const errors = await validateGradesUploadRows([gradeRow()]);
    expect(errors.map((error) => error.message).join("\n")).toContain(
      "not found in student profiles",
    );
  });

  it("skips the profile check when the user service is unreachable", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockRejectedValue(new Error("offline"));
    const errors = await validateGradesUploadRows([gradeRow()]);
    expect(errors).toEqual([]);
  });
});

describe("validateAttendanceUploadRows", () => {
  it("requires both class counts and rejects attended greater than total", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "O210008" }] },
    });

    const blank = await validateAttendanceUploadRows([
      {
        "Student ID": "O210008",
        "Subject Code": "CS2001",
        "Semester ID": "E2-SEM-1",
      },
    ]);
    expect(blank.map((error) => error.message).join("\n")).toContain(
      "both required",
    );

    const over = await validateAttendanceUploadRows([
      {
        "Student ID": "O210008",
        "Subject Code": "CS2001",
        "Semester ID": "E2-SEM-1",
        "Total Classes Occurred": "-1",
        "Total Classes Attended": "4",
      },
    ]);
    const messages = over.map((error) => error.message).join("\n");
    expect(messages).toContain("non-negative integer");
    expect(messages).toContain("cannot exceed total");

    const ok = await validateAttendanceUploadRows([
      {
        "Student ID": "O210008",
        "Subject Code": "CS2001",
        "Semester ID": "E2-SEM-1",
        "Total Classes Occurred": "10",
        "Total Classes Attended": "8",
      },
    ]);
    expect(ok).toEqual([]);
  });

  it("rejects a duplicate attendance row", async () => {
    prisma.subject.findMany.mockResolvedValue([
      { id: "sub-1", code: "CS2001" },
    ]);
    axios.post.mockResolvedValue({
      data: { students: [{ username: "O210008" }] },
    });
    const row = {
      "Student ID": "O210008",
      "Subject Code": "CS2001",
      "Semester ID": "E2-SEM-1",
      "Total Classes Occurred": "10",
      "Total Classes Attended": "8",
    };
    const errors = await validateAttendanceUploadRows([row, { Grade: " " }, row]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Duplicate entry");
    expect(errors[0].row).toBe(3);
  });
});
