import * as ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import prisma from "../src/utils/prisma.util";
import {
  coerceCampusStudentId,
  internalSubjectCode,
  isValidCampusStudentId,
  parseRegistrationFormWorkbook,
  parseSubjectCatalogWorkbook,
  parseSubjectSelection,
  upsertSemesterSubjectCatalog,
  validateSubjectCatalogRows,
  type SubjectImportRow,
} from "../src/services/semester-registration-import.service";

function catalogRow(
  partial: Partial<SubjectImportRow> = {},
): SubjectImportRow {
  return {
    branch: "CSE",
    academicYear: "E2",
    batch: "O23",
    officialCode: "CS2001",
    subjectName: "Data Structures",
    subjectType: "CORE",
    mode: "Theory",
    credits: 4,
    delivery: "Regular",
    ...partial,
  };
}

async function workbookBuffer(
  build: (workbook: ExcelJS.Workbook) => void,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  build(workbook);
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}

describe("campus student ids", () => {
  it.each([
    ["O210008", "O210008"],
    ["o210008", "O210008"],
    ["o210008@rgukt.ac.in", "O210008"],
    ["xxO210008yy", "O210008"],
    ["0210008", "O210008"],
    ["210008", "O210008"],
    ["N210008", "O210008"],
    ["I210008", "O210008"],
    ["RO210008", "O210008"],
    ["OW10008", "O210008"],
    ["S220011", "S220011"],
    ["", ""],
    ["student", ""],
  ])("coerceCampusStudentId(%j) -> %j", (input, expected) => {
    expect(coerceCampusStudentId(input)).toBe(expected);
  });

  it("accepts only O###### and S###### campus ids", () => {
    expect(isValidCampusStudentId("o210008")).toBe(true);
    expect(isValidCampusStudentId("S220011")).toBe(true);
    expect(isValidCampusStudentId("o210008@rgukt.ac.in")).toBe(false);
    expect(isValidCampusStudentId("210008")).toBe(false);
    expect(isValidCampusStudentId("O21008")).toBe(false);
  });
});

describe("internalSubjectCode", () => {
  const row = {
    semesterId: "sem-1",
    branch: "CSE",
    academicYear: "E2",
    batch: "O23",
    officialCode: "CS 2001",
    subjectName: "Data Structures",
  };

  it("is stable, uppercase, and changes when the title changes", () => {
    const first = internalSubjectCode(row);
    expect(internalSubjectCode(row)).toBe(first);
    expect(first).toBe(first.toUpperCase());
    expect(first.startsWith("SEMREG-SEM-1-CSE-E2-O23-")).toBe(true);
    expect(first.length).toBeLessThanOrEqual(180);
    expect(
      internalSubjectCode({ ...row, subjectName: "Other Title" }),
    ).not.toBe(first);
  });

  it("caps a very long code at 180 characters", () => {
    const code = internalSubjectCode({
      ...row,
      semesterId: "S".repeat(200),
    });
    expect(code).toHaveLength(180);
    expect(code.startsWith("SEMREG-")).toBe(true);
  });
});

describe("parseSubjectSelection", () => {
  it("splits a form choice into code, name, and type", () => {
    expect(parseSubjectSelection("CS2001 - Data Structures - Core")).toEqual({
      raw: "CS2001 - Data Structures - Core",
      code: "CS2001",
      name: "Data Structures",
      type: "Core",
    });
    expect(parseSubjectSelection("CS2001 - Networks - Elective -2")).toMatchObject(
      { code: "CS2001", name: "Networks", type: "Elective" },
    );
    expect(
      parseSubjectSelection("CS 2001 - Linear Algebra - Open Elective"),
    ).toMatchObject({
      code: "CS2001",
      name: "Linear Algebra",
      type: "Open Elective",
    });
  });

  it("drops affirmations, semester headings, short codes, and short names", () => {
    expect(parseSubjectSelection("I hereby submit - this form")).toBeNull();
    expect(parseSubjectSelection("Semester - I Physics")).toBeNull();
    expect(parseSubjectSelection("just a name")).toBeNull();
    expect(parseSubjectSelection("AB12 - Long Enough Name")).toBeNull();
    expect(parseSubjectSelection("CS2001 - Ab")).toBeNull();
  });
});

describe("validateSubjectCatalogRows", () => {
  it("rejects an empty sheet", () => {
    const errors = validateSubjectCatalogRows([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No valid subject rows");
  });

  it("checks year, batch, credits, and duplicates", () => {
    const errors = validateSubjectCatalogRows([
      catalogRow({ academicYear: "e2", batch: "23", credits: -1 }),
      catalogRow(),
      catalogRow({ subjectName: "data-structures" }),
    ]);
    const messages = errors.map((error) => error.message).join("\n");
    expect(messages).toContain('Academic Year must be E1, E2, E3, or E4');
    expect(messages).toContain("Batch must be like O23");
    expect(messages).toContain("Credits must be 0 or greater");
    expect(messages).toContain("Duplicate subject");
    expect(messages).toContain("also at row 3");
  });

  it("accepts a clean catalog row", () => {
    expect(validateSubjectCatalogRows([catalogRow({ credits: 0 })])).toEqual(
      [],
    );
  });
});

describe("upsertSemesterSubjectCatalog dry run", () => {
  it("counts valid rows and does not touch Prisma", async () => {
    const result = await upsertSemesterSubjectCatalog({
      semesterId: "sem-1",
      semesterName: "E2 SEM-1",
      rows: [catalogRow(), catalogRow({ branch: "" })],
      dryRun: true,
    });
    expect(result.dryRun).toBe(true);
    expect(result.semesterId).toBe("sem-1");
    expect(result.parsedRows).toBe(2);
    expect(result.validRows).toBe(1);
    expect(result.subjectsUpserted).toBe(0);
    expect(result.errors.some((error) => error.message.includes("Missing branch"))).toBe(
      true,
    );
    expect(prisma.subject.findMany).not.toHaveBeenCalled();
    expect(prisma.branchAllocation.findMany).not.toHaveBeenCalled();
  });
});

describe("parseSubjectCatalogWorkbook", () => {
  it("reads a flat catalog and infers elective groups", async () => {
    const buffer = await workbookBuffer((workbook) => {
      const sheet = workbook.addWorksheet("Catalog");
      sheet.addRow([
        "Branch",
        "Academic Year",
        "Batch",
        "Subject Code",
        "Subject Name",
        "Type",
        "Credits",
      ]);
      sheet.addRow(["CSE", "E2", "O23", "CS2001", "Data Structures", "Core", 4]);
      sheet.addRow([
        "AI/ML",
        "E3",
        "O22",
        "OE3001",
        "French",
        "Open Elective",
        3,
      ]);
      sheet.addRow(["ECE", "E4", "O21", "EC4001", "VLSI", "Elective - 2", 3]);
      sheet.addRow(["ME", "E2", "O23", "", "Missing code", "Core", 3]);
    });

    const rows = await parseSubjectCatalogWorkbook(buffer);
    expect(rows.map((row) => [row.branch, row.officialCode, row.subjectType])).toEqual([
      ["CSE", "CS2001", "CORE"],
      ["AIML", "OE3001", "OPEN_ELECTIVE"],
      ["ECE", "EC4001", "ELECTIVE"],
    ]);
    expect(rows[2].electiveGroupCode).toBe("ELECTIVE-2");
    expect(rows[1].electiveGroupCode).toBe("OPEN_ELECTIVE");
  });

  it("reads the per-branch sheet layout", async () => {
    const buffer = await workbookBuffer((workbook) => {
      const sheet = workbook.addWorksheet("Civil Engineering");
      sheet.addRow(["E3 - O22 BATCH"]);
      sheet.addRow(["S.No", "Subject Code", "Subject Name", "Type", "Mode", "Credits", "Delivery"]);
      sheet.addRow([1, "CS3001", "Compilers", "Core", "Theory", 4, "Regular"]);
      sheet.addRow([2, "CS3002", "Graphics", "Elective 1, 2", "Theory", "nope", "NPTEL"]);
    });

    const rows = await parseSubjectCatalogWorkbook(buffer);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      branch: "CE",
      academicYear: "E3",
      batch: "O22",
      officialCode: "CS3001",
      subjectType: "CORE",
      credits: 4,
    });
    expect(rows[1]).toMatchObject({
      officialCode: "CS3002",
      subjectType: "ELECTIVE",
      electiveGroupCode: "ELECTIVE-1,2",
      electiveLimit: 2,
      credits: 0,
    });
  });
});

describe("parseRegistrationFormWorkbook", () => {
  it("keeps the latest submission and coerces the campus id", async () => {
    const buffer = await workbookBuffer((workbook) => {
      const sheet = workbook.addWorksheet("Responses");
      const header = new Array(24).fill("");
      header[0] = "Timestamp";
      header[1] = "Email";
      sheet.addRow(header);

      const early = new Array(24).fill("");
      early[0] = 45000;
      early[1] = "ada@example.com";
      early[2] = "CSE";
      early[3] = "E2 (O23 BATCH)";
      early[4] = "O210008";
      early[5] = "O210008@example.com";
      early[6] = "First";
      early[7] = "9999999999";
      early[8] = "CS2001 - Data Structures - Core, MA2001 - Linear Algebra - Core";
      sheet.addRow(early);

      const later = [...early];
      later[0] = 46000;
      later[6] = "Second";
      sheet.addRow(later);

      const fromEmail = new Array(24).fill("");
      fromEmail[0] = 45500;
      fromEmail[1] = "o220001@example.com";
      fromEmail[3] = "E2 (O23 BATCH)";
      fromEmail[8] = "CS2001 - Data Structures - Core";
      sheet.addRow(fromEmail);

      const junk = new Array(24).fill("");
      junk[0] = 45500;
      junk[1] = "nobody@example.com";
      junk[3] = "E2 (O23 BATCH)";
      junk[4] = "not-an-id";
      sheet.addRow(junk);
    });

    const rows = await parseRegistrationFormWorkbook(buffer, "ECE");
    expect(rows).toHaveLength(2);
    const ada = rows.find((row) => row.studentId === "O210008");
    expect(ada).toMatchObject({
      name: "Second",
      email: "o210008@example.com",
      branch: "ECE",
      academicYear: "E2",
      batch: "O23",
    });
    expect(ada?.subjects.map((subject) => subject.code)).toEqual([
      "CS2001",
      "MA2001",
    ]);
    expect(rows.some((row) => row.studentId === "O220001")).toBe(true);
    expect(ada && ada.submittedAt.getTime()).toBeGreaterThan(0);
  });
});
