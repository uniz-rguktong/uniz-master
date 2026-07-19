import axios from "axios";
import prisma from "../utils/prisma.util";
import { isValidGradeValue } from "../utils/helpers.util";
import {
  pickRowValue,
  rowNumberFromIndex,
  UploadValidationError,
} from "../utils/excel-strict-validation.util";
import { resolveAcademicSemesterId } from "../utils/semester-subject.util";

const USER_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-user-service:3002"
    : process.env.USER_SERVICE_URL) || "http://localhost:3002"
).replace(/\/$/, "");

type SubjectResolver = {
  resolve(
    code: string,
    academicSemesterId?: string,
  ): Promise<{
    subject: { id: string; code: string } | null;
    ambiguous: boolean;
  }>;
};

async function buildSubjectResolver(): Promise<SubjectResolver> {
  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map(
    allSubjects.map((s) => [s.code.trim().toUpperCase(), s]),
  );

  const academicCodeLookup = new Map<
    string,
    Array<{ subject: (typeof allSubjects)[number]; semesterId: string }>
  >();
  const allocationRows = await prisma.branchAllocation.findMany({
    where: { customCode: { not: null } },
    include: { subject: true },
  });
  for (const alloc of allocationRows) {
    const key = String(alloc.customCode || "")
      .trim()
      .toUpperCase();
    if (!key) continue;
    const list = academicCodeLookup.get(key) || [];
    list.push({ subject: alloc.subject, semesterId: alloc.semesterId });
    academicCodeLookup.set(key, list);
  }

  return {
    async resolve(rawCode, academicSemesterId) {
      const code = String(rawCode || "")
        .trim()
        .toUpperCase();
      if (!code) return { subject: null, ambiguous: false };

      const direct = subjectMap.get(code);
      if (direct) return { subject: direct, ambiguous: false };

      const matches = academicCodeLookup.get(code) || [];
      const resolvedSemesterId = academicSemesterId
        ? await resolveAcademicSemesterId(academicSemesterId)
        : null;
      const semesterCandidates = [
        academicSemesterId,
        resolvedSemesterId,
      ].filter(Boolean) as string[];

      if (semesterCandidates.length) {
        const scoped = matches.filter((m) =>
          semesterCandidates.includes(m.semesterId),
        );
        if (scoped.length === 1)
          return { subject: scoped[0].subject, ambiguous: false };
        if (scoped.length > 1) return { subject: null, ambiguous: true };
      }
      if (matches.length === 1)
        return { subject: matches[0].subject, ambiguous: false };
      if (matches.length > 1) return { subject: null, ambiguous: true };
      return { subject: null, ambiguous: false };
    },
  };
}

async function loadKnownStudentIds(ids: string[]): Promise<Set<string>> {
  const unique = [
    ...new Set(ids.map((id) => id.trim().toUpperCase()).filter(Boolean)),
  ];
  if (!unique.length) return new Set();

  const found = new Set<string>();
  const chunkSize = 500;
  const secret = process.env.INTERNAL_SECRET || "uniz-core";

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    try {
      const res = await axios.post(
        `${USER_SERVICE_URL}/internal/bulk-profiles`,
        { usernames: chunk },
        {
          headers: { "x-internal-secret": secret },
          timeout: 30000,
        },
      );
      for (const student of res.data?.students || []) {
        if (student?.username)
          found.add(String(student.username).toUpperCase());
      }
    } catch {
      // If profile service is unreachable, skip student-exists checks rather than blocking uploads.
      return new Set(unique);
    }
  }
  return found;
}

function isDataRow(row: Record<string, string>): boolean {
  return Object.values(row).some((v) => String(v ?? "").trim() !== "");
}

export async function validateGradesUploadRows(
  rows: Record<string, string>[],
): Promise<UploadValidationError[]> {
  const errors: UploadValidationError[] = [];
  const dataRows = rows.filter(isDataRow);
  if (!dataRows.length) {
    errors.push({ message: "No data rows found in the Excel file." });
    return errors;
  }

  const resolver = await buildSubjectResolver();
  const duplicateKeys = new Map<string, number>();
  const studentIds: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNo = rowNumberFromIndex(i);
    const studentId = pickRowValue(row, [
      "Student ID",
      "student id",
    ]).toUpperCase();
    const code = pickRowValue(row, [
      "Subject Code",
      "Academic Code",
      "Internal Code",
    ]).toUpperCase();
    const semesterId = pickRowValue(row, ["Semester ID", "semester id"]);
    const grade = pickRowValue(row, [
      "Grade (EX, A, B, C, D, E, R)",
      "Grade",
      "grade",
    ]);

    if (!studentId) {
      errors.push({
        row: rowNo,
        field: "Student ID",
        message: `Row ${rowNo}: Student ID is required.`,
      });
    } else {
      studentIds.push(studentId);
      if (!/^[OS]\d{6}$/i.test(studentId)) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Student ID",
          message: `Row ${rowNo}: Student ID "${studentId}" is not a valid campus ID (expected O###### or S######).`,
        });
      }
    }

    if (!code) {
      errors.push({
        row: rowNo,
        studentId,
        field: "Subject Code",
        message: `Row ${rowNo}: Subject Code or Academic Code is required.`,
      });
    }

    if (!semesterId) {
      errors.push({
        row: rowNo,
        studentId,
        field: "Semester ID",
        message: `Row ${rowNo}: Semester ID is required (e.g. E2-SEM-1).`,
      });
    }

    if (!isValidGradeValue(grade)) {
      errors.push({
        row: rowNo,
        studentId,
        field: "Grade",
        message: `Row ${rowNo}: Grade is missing or invalid for student ${studentId || "(unknown)"}. Allowed: EX, A, B, C, D, E, R or a numeric grade.`,
      });
    }

    if (studentId && code && semesterId) {
      const dupKey = `${studentId}|${code}|${semesterId.toUpperCase()}`;
      if (duplicateKeys.has(dupKey)) {
        errors.push({
          row: rowNo,
          studentId,
          message: `Row ${rowNo}: Duplicate entry for student ${studentId}, subject ${code}, semester ${semesterId} (also at row ${duplicateKeys.get(dupKey)}).`,
        });
      } else {
        duplicateKeys.set(dupKey, rowNo);
      }
    }

    if (code) {
      const resolved = await resolver.resolve(code, semesterId);
      if (resolved.ambiguous) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Subject Code",
          message: `Row ${rowNo}: Subject code "${code}" matches multiple subjects. Add Academic Semester ID or use Internal Code.`,
        });
      } else if (!resolved.subject) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Subject Code",
          message: `Row ${rowNo}: Subject code "${code}" was not found for semester "${semesterId || "(missing)"}".`,
        });
      }
    }
  }

  const knownStudents = await loadKnownStudentIds(studentIds);
  const uniqueStudentIds = [...new Set(studentIds.map((s) => s.toUpperCase()))];
  const profileCheckSkipped =
    knownStudents.size === uniqueStudentIds.length &&
    uniqueStudentIds.length > 0 &&
    uniqueStudentIds.every((id) => knownStudents.has(id));

  if (!profileCheckSkipped) {
    for (let i = 0; i < dataRows.length; i++) {
      const studentId = pickRowValue(dataRows[i], [
        "Student ID",
        "student id",
      ]).toUpperCase();
      if (!studentId || knownStudents.has(studentId)) continue;
      errors.push({
        row: rowNumberFromIndex(i),
        studentId,
        field: "Student ID",
        message: `Row ${rowNumberFromIndex(i)}: Student ID "${studentId}" was not found in student profiles.`,
      });
    }
  }

  return errors;
}

export async function validateAttendanceUploadRows(
  rows: Record<string, string>[],
): Promise<UploadValidationError[]> {
  const errors: UploadValidationError[] = [];
  const dataRows = rows.filter(isDataRow);
  if (!dataRows.length) {
    errors.push({ message: "No data rows found in the Excel file." });
    return errors;
  }

  const resolver = await buildSubjectResolver();
  const duplicateKeys = new Map<string, number>();
  const studentIds: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNo = rowNumberFromIndex(i);
    const studentId = pickRowValue(row, [
      "Student ID",
      "student id",
    ]).toUpperCase();
    const code = pickRowValue(row, [
      "Subject Code",
      "Academic Code",
      "Internal Code",
    ]).toUpperCase();
    const semesterId = pickRowValue(row, ["Semester ID", "semester id"]);
    const totalRaw = pickRowValue(row, [
      "Total Classes Occurred",
      "total classes occurred",
    ]);
    const attendedRaw = pickRowValue(row, [
      "Total Classes Attended",
      "total classes attended",
    ]);

    if (!studentId) {
      errors.push({
        row: rowNo,
        field: "Student ID",
        message: `Row ${rowNo}: Student ID is required.`,
      });
    } else {
      studentIds.push(studentId);
    }

    if (!code) {
      errors.push({
        row: rowNo,
        studentId,
        field: "Subject Code",
        message: `Row ${rowNo}: Subject Code or Academic Code is required.`,
      });
    }

    if (!semesterId) {
      errors.push({
        row: rowNo,
        studentId,
        field: "Semester ID",
        message: `Row ${rowNo}: Semester ID is required (e.g. E2-SEM-1).`,
      });
    }

    if (isBlank(totalRaw) || isBlank(attendedRaw)) {
      errors.push({
        row: rowNo,
        studentId,
        message: `Row ${rowNo}: Total Classes Occurred and Total Classes Attended are both required.`,
      });
    } else {
      const total = Number.parseInt(totalRaw, 10);
      const attended = Number.parseInt(attendedRaw, 10);
      if (!Number.isFinite(total) || total < 0) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Total Classes Occurred",
          message: `Row ${rowNo}: Total Classes Occurred must be a non-negative integer.`,
        });
      }
      if (!Number.isFinite(attended) || attended < 0) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Total Classes Attended",
          message: `Row ${rowNo}: Total Classes Attended must be a non-negative integer.`,
        });
      }
      if (
        Number.isFinite(total) &&
        Number.isFinite(attended) &&
        attended > total
      ) {
        errors.push({
          row: rowNo,
          studentId,
          message: `Row ${rowNo}: Attended (${attended}) cannot exceed total (${total}) for student ${studentId || "(unknown)"}.`,
        });
      }
    }

    if (studentId && code && semesterId) {
      const dupKey = `${studentId}|${code}|${semesterId.toUpperCase()}`;
      if (duplicateKeys.has(dupKey)) {
        errors.push({
          row: rowNo,
          studentId,
          message: `Row ${rowNo}: Duplicate entry for student ${studentId}, subject ${code}, semester ${semesterId} (also at row ${duplicateKeys.get(dupKey)}).`,
        });
      } else {
        duplicateKeys.set(dupKey, rowNo);
      }
    }

    if (code) {
      const resolved = await resolver.resolve(code, semesterId);
      if (resolved.ambiguous) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Subject Code",
          message: `Row ${rowNo}: Subject code "${code}" matches multiple subjects. Add Academic Semester ID or use Internal Code.`,
        });
      } else if (!resolved.subject) {
        errors.push({
          row: rowNo,
          studentId,
          field: "Subject Code",
          message: `Row ${rowNo}: Subject code "${code}" was not found for semester "${semesterId || "(missing)"}".`,
        });
      }
    }
  }

  const knownStudents = await loadKnownStudentIds(studentIds);
  const uniqueStudentIds = [...new Set(studentIds.map((s) => s.toUpperCase()))];
  const profileCheckSkipped =
    knownStudents.size === uniqueStudentIds.length &&
    uniqueStudentIds.length > 0 &&
    uniqueStudentIds.every((id) => knownStudents.has(id));

  if (!profileCheckSkipped) {
    for (let i = 0; i < dataRows.length; i++) {
      const studentId = pickRowValue(dataRows[i], [
        "Student ID",
        "student id",
      ]).toUpperCase();
      if (!studentId || knownStudents.has(studentId)) continue;
      errors.push({
        row: rowNumberFromIndex(i),
        studentId,
        field: "Student ID",
        message: `Row ${rowNumberFromIndex(i)}: Student ID "${studentId}" was not found in student profiles.`,
      });
    }
  }

  return errors;
}

function isBlank(value: unknown): boolean {
  return String(value ?? "").trim() === "";
}
