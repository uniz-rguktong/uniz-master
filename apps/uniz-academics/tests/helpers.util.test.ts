import { describe, expect, it, vi } from "vitest";
import {
  GRADE_MAP,
  getGpaDialogue,
  isValidGradeValue,
  mapGradeToPoint,
} from "../src/utils/helpers.util";

function dialogue(cgpa: number, random: number) {
  const spy = vi.spyOn(Math, "random").mockReturnValue(random);
  try {
    return getGpaDialogue(cgpa);
  } finally {
    spy.mockRestore();
  }
}

describe("mapGradeToPoint", () => {
  it("keeps numeric grades, including zero", () => {
    expect(mapGradeToPoint(0)).toBe(0);
    expect(mapGradeToPoint(8.5)).toBe(8.5);
  });

  it("maps letter grades without caring about case or surrounding space", () => {
    expect(mapGradeToPoint(" ex ")).toBe(10);
    expect(mapGradeToPoint("a")).toBe(9);
    expect(mapGradeToPoint("B")).toBe(8);
    expect(mapGradeToPoint("c")).toBe(7);
    expect(mapGradeToPoint("D")).toBe(6);
    expect(mapGradeToPoint("e")).toBe(5);
    expect(mapGradeToPoint("r")).toBe(0);
  });

  it("parses numeric strings and treats unknown text as zero", () => {
    expect(mapGradeToPoint("  8.5 ")).toBe(8.5);
    expect(mapGradeToPoint("hello")).toBe(0);
  });

  it("covers every letter in the grade map", () => {
    for (const [letter, point] of Object.entries(GRADE_MAP)) {
      expect(mapGradeToPoint(letter)).toBe(point);
    }
  });
});

describe("isValidGradeValue", () => {
  it("rejects empty and non-finite values", () => {
    expect(isValidGradeValue(null)).toBe(false);
    expect(isValidGradeValue(undefined)).toBe(false);
    expect(isValidGradeValue("   ")).toBe(false);
    expect(isValidGradeValue(Number.NaN)).toBe(false);
    expect(isValidGradeValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidGradeValue("nope")).toBe(false);
    expect(isValidGradeValue("Infinity")).toBe(false);
  });

  it("accepts letters and finite numbers", () => {
    expect(isValidGradeValue(0)).toBe(true);
    expect(isValidGradeValue(8)).toBe(true);
    expect(isValidGradeValue("  A  ")).toBe(true);
    expect(isValidGradeValue("8.5")).toBe(true);
    expect(isValidGradeValue("10abc")).toBe(true);
  });
});

describe("getGpaDialogue", () => {
  const bands: Array<[number, string]> = [
    [9.5, "Phenomenal performance"],
    [9.49, "Incredible consistency"],
    [9, "Incredible consistency"],
    [8.99, "Solid performance"],
    [8, "Solid performance"],
    [7.99, "Good job"],
    [7, "Good job"],
    [6.99, "Safe and sound"],
    [6, "Safe and sound"],
    [5.99, "Persistence is your best friend"],
    [5, "Persistence is your best friend"],
    [4.99, "serious turnaround"],
    [0, "serious turnaround"],
    [-1, "serious turnaround"],
  ];

  it.each(bands)("cgpa %s uses the %s band", (cgpa, snippet) => {
    expect(dialogue(cgpa, 0)).toContain(snippet);
  });

  it("can pick the last line in a band", () => {
    expect(dialogue(9.5, 0.99)).toContain("S-Tier performance");
  });
});
