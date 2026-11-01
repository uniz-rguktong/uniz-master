import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDENT_BRANCH,
  normalizeBranchCode,
  resolveStudentBranch,
} from "../src/branches";

describe("normalizeBranchCode", () => {
  it("maps full department names to codes", () => {
    expect(normalizeBranchCode("Computer Science and Engineering")).toBe("CSE");
    expect(normalizeBranchCode("  METALLURGY AND MATERIALS ENGINEERING ")).toBe(
      "MME",
    );
  });

  it("maps the AI/ML spellings we see in uploads", () => {
    for (const name of [
      "AIML",
      "AI&ML",
      "ai / ml",
      "Artifical Intelligence & ML",
    ]) {
      expect(normalizeBranchCode(name)).toBe("AI/ML");
    }
  });

  it("returns unknown values trimmed but otherwise untouched", () => {
    expect(normalizeBranchCode(" cse ")).toBe("cse");
    expect(normalizeBranchCode("PUC")).toBe("PUC");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeBranchCode("")).toBe("");
    expect(normalizeBranchCode("   ")).toBe("");
  });
});

describe("resolveStudentBranch", () => {
  it("falls back to N/A for missing or placeholder values", () => {
    for (const v of [
      undefined,
      null,
      "",
      "-",
      "na",
      "None",
      "TBD",
      "general",
    ]) {
      expect(resolveStudentBranch(v)).toBe(DEFAULT_STUDENT_BRANCH);
    }
  });

  it("normalizes real branches", () => {
    expect(
      resolveStudentBranch("Electronics and Communication Engineering"),
    ).toBe("ECE");
    expect(resolveStudentBranch("CSE")).toBe("CSE");
  });
});
