import { describe, expect, it } from "vitest";
import {
  studentUploadRejected,
  validateStudentUploadHeaders,
  validateStudentUploadRows,
} from "../src/utils/student-upload-validation.util";

const headers = [
  "Student ID",
  "Name",
  "Email",
  "Branch",
  "Year",
  "Section",
];

function row(overrides: Record<string, unknown> = {}) {
  return {
    "student id": "O240001",
    name: "Ada Lovelace",
    email: "ada@rguktong.ac.in",
    branch: "Computer Science and Engineering",
    year: "e2",
    section: "a",
    ...overrides,
  };
}

describe("validateStudentUploadHeaders", () => {
  it("accepts required headers regardless of case", () => {
    expect(validateStudentUploadHeaders(headers)).toEqual([]);
  });

  it("reports each missing column", () => {
    const errors = validateStudentUploadHeaders(["Student ID", "Name"]);
    expect(errors.map((e) => e.field)).toEqual([
      "email",
      "branch",
      "year",
      "section",
    ]);
    expect(errors[0].message).toContain("Email");
  });
});

describe("validateStudentUploadRows", () => {
  it("accepts a valid row and normalizes an RO id", () => {
    expect(
      validateStudentUploadRows([
        row({ "student id": "ro240001" }),
        { name: "   " },
      ]),
    ).toEqual([]);
  });

  it("rejects an empty sheet", () => {
    expect(validateStudentUploadRows([{}, { name: "" }])).toEqual([
      { message: "No data rows found in the Excel file." },
    ]);
  });

  it("collects id, duplicate, email, branch, year, and section errors", () => {
    const errors = validateStudentUploadRows([
      row({ "student id": "O240001" }),
      row({
        "student id": "o240001",
        email: "not-an-email",
        branch: "GENERAL",
        year: "E5",
        section: "UNKNOWN",
        name: "",
      }),
      row({
        "student id": "",
        studentid: "ABC",
        name: "Bad Id",
      }),
    ]);

    const messages = errors.map((e) => e.message).join("\n");
    expect(messages).toContain('Duplicate Student ID "O240001"');
    expect(messages).toContain('Email "not-an-email" is not valid');
    expect(messages).toContain("Branch is required");
    expect(messages).toContain('Year "E5" is invalid');
    expect(messages).toContain("Section is required");
    expect(messages).toContain("Name is required");
    expect(messages).toContain('Student ID "ABC" is not valid');
  });

  it("accepts an S id and a canonical branch code", () => {
    expect(
      validateStudentUploadRows([
        row({ "student id": "S240010", branch: "AI/ML", year: "E4" }),
      ]),
    ).toEqual([]);
  });

  it("requires an email when the id is missing", () => {
    const errors = validateStudentUploadRows([
      row({ "student id": "", email: "" }),
    ]);
    expect(errors.some((e) => e.field === "Student ID")).toBe(true);
    expect(errors.some((e) => e.message.includes("Email is required"))).toBe(
      true,
    );
  });
});

describe("studentUploadRejected", () => {
  it("caps the returned errors at 200", () => {
    const errors = Array.from({ length: 201 }, (_, i) => ({
      message: `err ${i}`,
    }));
    const payload = studentUploadRejected(errors);
    expect(payload.success).toBe(false);
    expect(payload.errorCount).toBe(201);
    expect(payload.errors).toHaveLength(200);
    expect(payload.message).toContain("201 validation error(s)");
  });
});
