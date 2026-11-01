import { describe, expect, it } from "vitest";
import {
  formatGrievanceCategoryLabel,
  formatStudentDisplayName,
  isActionableGrievanceDescription,
} from "../src/grievance-email";

describe("formatGrievanceCategoryLabel", () => {
  it("maps the categories used in student emails", () => {
    expect(formatGrievanceCategoryLabel("hostel")).toBe("hostel / mess");
    expect(formatGrievanceCategoryLabel("  MESS ")).toBe("mess / hostel");
    expect(formatGrievanceCategoryLabel("Academic")).toBe("academic matters");
    expect(formatGrievanceCategoryLabel("INFRASTRUCTURE")).toBe(
      "campus infrastructure",
    );
  });

  it("lowercases unknown categories and fills in a blank", () => {
    expect(formatGrievanceCategoryLabel("  Library Hours  ")).toBe(
      "library hours",
    );
    expect(formatGrievanceCategoryLabel("")).toBe("your concern");
    expect(formatGrievanceCategoryLabel("   ")).toBe("");
  });
});

describe("isActionableGrievanceDescription", () => {
  it("accepts a description a warden can act on", () => {
    expect(
      isActionableGrievanceDescription(
        "The hostel water supply has been broken since Monday morning.",
      ),
    ).toBe(true);
  });

  it("rejects empty, short, and numeric input", () => {
    expect(isActionableGrievanceDescription("")).toBe(false);
    expect(isActionableGrievanceDescription("water is off")).toBe(false);
    expect(isActionableGrievanceDescription("12345678901234567890")).toBe(
      false,
    );
  });

  it("rejects text that has too few letters to be a real complaint", () => {
    expect(isActionableGrievanceDescription("abc def 123456789012")).toBe(
      false,
    );
  });

  it("rejects consonant mash that is long enough but not readable", () => {
    expect(isActionableGrievanceDescription("rhythm rhythms myrrh")).toBe(
      false,
    );
  });

  it("rejects one long token with no spaces", () => {
    expect(isActionableGrievanceDescription("abcdefghijklmnopqrstuvwxyz")).toBe(
      false,
    );
  });
});

describe("formatStudentDisplayName", () => {
  it("title-cases each word", () => {
    expect(formatStudentDisplayName("  ravi KUMAR  ")).toBe("Ravi Kumar");
    expect(formatStudentDisplayName("a")).toBe("A");
  });

  it("uses Student when the name is blank", () => {
    expect(formatStudentDisplayName("")).toBe("Student");
    expect(formatStudentDisplayName("   ")).toBe("Student");
  });
});
