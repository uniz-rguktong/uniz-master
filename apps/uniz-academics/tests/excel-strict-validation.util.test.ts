import { describe, expect, it } from "vitest";
import {
  isBlank,
  pickRowValue,
  rowNumberFromIndex,
  uploadRejected,
} from "../src/utils/excel-strict-validation.util";

describe("upload row helpers", () => {
  it("treats nullish and whitespace as blank", () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank("  ")).toBe(true);
    expect(isBlank("a")).toBe(false);
  });

  it("turns a zero-based data index into an Excel row number", () => {
    expect(rowNumberFromIndex(0)).toBe(2);
    expect(rowNumberFromIndex(4)).toBe(6);
  });

  it("picks the first filled alias, then a case-insensitive match", () => {
    expect(
      pickRowValue({ "Student ID": " O210008 " }, ["Student ID", "ID"]),
    ).toBe("O210008");
    expect(pickRowValue({ "student id": " S220011 " }, ["Student ID"])).toBe(
      "S220011",
    );
    expect(pickRowValue({ Name: "Ada" }, ["Student ID"])).toBe("");
    expect(pickRowValue({ "Student ID": "   ", ID: "O210008" }, ["Student ID", "ID"])).toBe(
      "O210008",
    );
  });
});

describe("uploadRejected", () => {
  it("summarizes the error list and keeps at most 200 rows", () => {
    const errors = Array.from({ length: 205 }, (_, index) => ({
      row: index + 2,
      message: `problem ${index}`,
    }));
    const rejected = uploadRejected(errors);
    expect(rejected.success).toBe(false);
    expect(rejected.errorCount).toBe(205);
    expect(rejected.errors).toHaveLength(200);
    expect(rejected.message).toContain("205 validation error(s)");
    expect(rejected.message).toContain("No data was saved");
  });

  it("uses a caller-supplied summary", () => {
    const rejected = uploadRejected(
      [{ message: "bad header" }],
      "The sheet header is wrong.",
    );
    expect(rejected.message).toBe("The sheet header is wrong.");
    expect(rejected.errorCount).toBe(1);
  });
});
