import { describe, expect, it } from "vitest";
import { buildStudentCohortWhere } from "../src/utils/student-cohort.util";

describe("buildStudentCohortWhere", () => {
  it("keeps extra clauses and skips ALL filters", () => {
    expect(
      buildStudentCohortWhere(
        { branch: "ALL", year: "all", batch: "All" },
        { isSuspended: false },
      ),
    ).toEqual({ isSuspended: false });
  });

  it("adds case-insensitive equals for branch, year, and batch", () => {
    expect(
      buildStudentCohortWhere({ branch: "CSE", year: "E2", batch: "O21" }),
    ).toEqual({
      branch: { equals: "CSE", mode: "insensitive" },
      year: { equals: "E2", mode: "insensitive" },
      batch: { equals: "O21", mode: "insensitive" },
    });
  });

  it("ignores empty filter values", () => {
    expect(buildStudentCohortWhere({ branch: "", year: undefined })).toEqual(
      {},
    );
  });
});
