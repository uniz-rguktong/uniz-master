import { describe, expect, it } from "vitest";
import { AttendanceSchema, AttendanceSummarySchema } from "../src/shared/attendance.schema";
import { ErrorCode } from "../src/shared/error-codes";
import { GradeSchema, GradeSummarySchema } from "../src/shared/grade.schema";

describe("grade and attendance schemas", () => {
  it("accepts a grade on the 0 to 10 scale", () => {
    expect(
      GradeSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        grade: 0,
      }).success,
    ).toBe(true);
    expect(
      GradeSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        grade: 10,
        gradeLetter: "EX",
      }).success,
    ).toBe(true);
    expect(
      GradeSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        grade: 10.5,
      }).success,
    ).toBe(false);
    expect(
      GradeSchema.safeParse({
        id: "not-a-uuid",
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        grade: 8,
      }).success,
    ).toBe(false);
  });

  it("accepts a grade summary with a null gpa", () => {
    const parsed = GradeSummarySchema.safeParse({
      studentId: "O210008",
      semesterId: "E2-SEM-1",
      gpa: null,
      grades: [{ subjectName: "Math", grade: 9, credits: 4 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("requires whole non-negative class counts", () => {
    expect(
      AttendanceSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        totalClasses: 10,
        attendedClasses: 0,
      }).success,
    ).toBe(true);
    expect(
      AttendanceSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        totalClasses: 1.5,
        attendedClasses: 1,
      }).success,
    ).toBe(false);
    expect(
      AttendanceSchema.safeParse({
        studentId: "O210008",
        subjectId: "sub",
        semesterId: "E2-SEM-1",
        totalClasses: 10,
        attendedClasses: -1,
      }).success,
    ).toBe(false);
  });

  it("accepts an attendance summary", () => {
    expect(
      AttendanceSummarySchema.safeParse({
        studentId: "O210008",
        semesterId: "E2-SEM-1",
        overallPercentage: 80,
        subjectDetails: [
          { subjectName: "Math", total: 10, attended: 8, percentage: 80 },
        ],
      }).success,
    ).toBe(true);
  });
});

describe("shared error codes", () => {
  it("re-exports the validation code used by the request middleware", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.AUTH_UNAUTHORIZED).toBe("AUTH_UNAUTHORIZED");
  });
});
