import { describe, expect, it } from "vitest";
import prisma from "../src/utils/prisma.util";
import {
  canonicalSubjectSemester,
  deriveSemesterSuffix,
  loadTemplateSubjectsFromSemester,
  resolveAcademicSemesterId,
} from "../src/utils/semester-subject.util";

describe("semester labels", () => {
  it("reads SEM-1 and SEM 2 from a label", () => {
    expect(deriveSemesterSuffix("AY-2026 SEM-1")).toBe("SEM-1");
    expect(deriveSemesterSuffix("sem 2")).toBe("SEM-2");
  });

  it("defaults when the label has no semester marker", () => {
    expect(deriveSemesterSuffix("")).toBe("SEM-1");
    expect(deriveSemesterSuffix("Semester 1")).toBe("SEM-1");
  });

  it("builds a canonical catalog semester", () => {
    expect(canonicalSubjectSemester("e3", "Odd SEM-2")).toBe("E3-SEM-2");
    expect(canonicalSubjectSemester(undefined, "anything")).toBe("E1-SEM-1");
  });
});

describe("resolveAcademicSemesterId", () => {
  it("returns null for a blank id without querying", async () => {
    await expect(resolveAcademicSemesterId("  ")).resolves.toBeNull();
    expect(prisma.academicSemester.findUnique).not.toHaveBeenCalled();
  });

  it("returns a semester that already matches the id", async () => {
    prisma.academicSemester.findUnique.mockResolvedValue({ id: "AY-2026-SEM-1" });
    await expect(resolveAcademicSemesterId("AY-2026-SEM-1")).resolves.toBe(
      "AY-2026-SEM-1",
    );
    expect(prisma.academicSemester.findFirst).not.toHaveBeenCalled();
  });

  it("resolves a bare SEM-2 suffix to the latest open semester", async () => {
    prisma.academicSemester.findFirst.mockResolvedValue({ id: "resolved-sem" });
    await expect(resolveAcademicSemesterId("SEM 2")).resolves.toBe("resolved-sem");
    expect(prisma.academicSemester.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: expect.objectContaining({
            in: expect.arrayContaining(["REGISTRATION_OPEN", "APPROVED"]),
          }),
        }),
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("falls back to a partial id or name match", async () => {
    prisma.academicSemester.findFirst.mockResolvedValue({ id: "partial-sem" });
    await expect(resolveAcademicSemesterId("ay-2025")).resolves.toBe("partial-sem");
  });

  it("returns null when nothing matches", async () => {
    await expect(resolveAcademicSemesterId("missing")).resolves.toBeNull();
  });
});

describe("loadTemplateSubjectsFromSemester", () => {
  it("returns no subjects when the semester cannot be resolved", async () => {
    const result = await loadTemplateSubjectsFromSemester({
      academicSemesterId: "missing",
    });
    expect(result).toEqual({ semesterId: null, subjects: [] });
    expect(prisma.branchAllocation.findMany).not.toHaveBeenCalled();
  });

  it("returns no subjects when the resolved semester row is gone", async () => {
    prisma.academicSemester.findUnique
      .mockResolvedValueOnce({ id: "sem-1" })
      .mockResolvedValueOnce(null);
    const result = await loadTemplateSubjectsFromSemester({
      academicSemesterId: "sem-1",
    });
    expect(result).toEqual({ semesterId: null, subjects: [] });
  });

  it("maps allocations and filters by official or internal code", async () => {
    prisma.academicSemester.findUnique.mockResolvedValue({
      id: "sem-1",
      name: "E2 SEM-1",
    });
    prisma.branchAllocation.findMany.mockResolvedValue([
      {
        subjectId: "s1",
        customName: " DS ",
        customCredits: 4,
        branch: "CSE",
        academicYear: "e2",
        batch: "O23",
        customCode: " cs2001 ",
        subjectType: "CORE",
        electiveGroupId: null,
        electiveGroupName: null,
        electiveLimit: null,
        isMandatory: true,
        subject: { code: "INT-1", name: "Internal", credits: 3 },
      },
      {
        subjectId: "s2",
        customName: "",
        customCredits: null,
        branch: "ECE",
        academicYear: "E2",
        batch: "O23",
        customCode: null,
        subjectType: "ELECTIVE",
        electiveGroupId: "g1",
        electiveGroupName: "Elective 1",
        electiveLimit: 1,
        isMandatory: false,
        subject: { code: "INT-2", name: "Networks", credits: 3 },
      },
    ]);

    const filtered = await loadTemplateSubjectsFromSemester({
      academicSemesterId: "sem-1",
      branch: "all",
      academicYear: "ALL",
      batch: "All",
      subjectCode: "cs2001",
      approvedOnly: true,
    });

    expect(filtered.semesterId).toBe("sem-1");
    expect(filtered.subjects).toEqual([
      {
        id: "s1",
        code: "INT-1",
        name: "DS",
        credits: 4,
        department: "CSE",
        semester: "E2-SEM-1",
        academicCode: "CS2001",
        academicYear: "e2",
        batch: "O23",
        subjectType: "CORE",
        electiveGroupId: null,
        electiveGroupName: null,
        electiveLimit: null,
        isMandatory: true,
      },
    ]);
    expect(prisma.branchAllocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { semesterId: "sem-1", isApproved: true },
      }),
    );

    const open = await loadTemplateSubjectsFromSemester({
      academicSemesterId: "sem-1",
      branch: "cse",
      academicYear: "e2",
      batch: "o23",
      subjectCode: "ALL",
    });
    expect(open.subjects).toHaveLength(2);
    expect(open.subjects[1].name).toBe("Networks");
    expect(open.subjects[1].credits).toBe(3);
    expect(prisma.branchAllocation.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          semesterId: "sem-1",
          branch: { equals: "CSE", mode: "insensitive" },
          academicYear: { equals: "E2", mode: "insensitive" },
          batch: { equals: "O23", mode: "insensitive" },
        },
      }),
    );
  });
});
