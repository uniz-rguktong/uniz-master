"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeBranchCode,
  resolveStudentBranch,
  DEFAULT_STUDENT_BRANCH,
  ENGINEERING_BRANCHES,
} = require("../dist/branches.js");

describe("@uniz/shared branches", () => {
  it("maps full department names to canonical codes", () => {
    assert.equal(
      normalizeBranchCode("Computer Science and Engineering"),
      "CSE",
    );
    assert.equal(normalizeBranchCode("AI&ML"), "AI/ML");
  });

  it("returns DEFAULT for placeholders", () => {
    assert.equal(resolveStudentBranch(""), DEFAULT_STUDENT_BRANCH);
    assert.equal(resolveStudentBranch("n/a"), DEFAULT_STUDENT_BRANCH);
    assert.equal(resolveStudentBranch(null), DEFAULT_STUDENT_BRANCH);
  });

  it("keeps known engineering branch codes", () => {
    assert.ok(ENGINEERING_BRANCHES.includes("CSE"));
    assert.equal(resolveStudentBranch("ECE"), "ECE");
  });
});
