import { describe, expect, it } from "vitest";
import {
  buildSubjectSnapshot,
  displaySubjectCode,
  displaySubjectName,
  resolveDisplaySubjectCode,
  resolveInternalSubjectCode,
} from "../src/utils/subject-snapshot.util";

describe("subject code resolution", () => {
  it("prefers the academic code, then the snapshot, then the catalog code", () => {
    expect(
      resolveDisplaySubjectCode({
        customCode: " cs2001 ",
        snapshotCode: "snap",
        catalogCode: "cat",
      }),
    ).toBe("CS2001");
    expect(
      resolveDisplaySubjectCode({
        customCode: "  ",
        snapshotCode: " snap ",
        catalogCode: "cat",
      }),
    ).toBe("SNAP");
    expect(
      resolveDisplaySubjectCode({
        customCode: null,
        snapshotCode: "",
        catalogCode: " cat ",
      }),
    ).toBe("CAT");
    expect(resolveDisplaySubjectCode({})).toBe("");
  });

  it("normalizes the internal catalog code", () => {
    expect(resolveInternalSubjectCode({ code: " int-1 " })).toBe("INT-1");
    expect(resolveInternalSubjectCode(null)).toBe("");
    expect(resolveInternalSubjectCode({})).toBe("");
  });
});

describe("buildSubjectSnapshot", () => {
  it("keeps the display code and the first non-empty name", () => {
    expect(
      buildSubjectSnapshot({
        code: " int-1 ",
        catalogName: "Catalog",
        customCode: "cs2001",
        subjectNameOverride: " Override ",
        customName: "Custom",
        spreadsheetName: "Sheet",
      }),
    ).toEqual({ subjectCode: "CS2001", subjectName: "Override" });
  });

  it("falls through empty overrides to the catalog name, then the code", () => {
    expect(
      buildSubjectSnapshot({
        code: "int-1",
        catalogName: "Catalog",
        customName: "  ",
        spreadsheetName: "",
      }),
    ).toEqual({ subjectCode: "INT-1", subjectName: "Catalog" });

    expect(
      buildSubjectSnapshot({
        code: "int-1",
        catalogName: "",
        customCode: " ",
      }),
    ).toEqual({ subjectCode: "INT-1", subjectName: "INT-1" });
  });
});

describe("display helpers", () => {
  it("reads a code from the row, its allocation, or the joined subject", () => {
    expect(
      displaySubjectCode({
        customCode: "off",
        subjectCode: "snap",
        subject: { code: "cat" },
      }),
    ).toBe("OFF");
    expect(
      displaySubjectCode({
        allocation: { customCode: " from-alloc " },
        subjectCode: "snap",
      }),
    ).toBe("FROM-ALLOC");
    expect(displaySubjectCode({ subject: { code: "cat" } })).toBe("CAT");
  });

  it("reads a name from the same precedence and falls back to Unknown", () => {
    expect(
      displaySubjectName({
        subjectNameOverride: " Override ",
        customName: "Custom",
        subjectName: "Snap",
        subject: { name: "Catalog", code: "CAT" },
      }),
    ).toBe("Override");
    expect(
      displaySubjectName({
        allocation: { customName: " Alloc " },
        subjectName: "Snap",
      }),
    ).toBe("Alloc");
    expect(displaySubjectName({ subjectName: " Snap " })).toBe("Snap");
    expect(displaySubjectName({ subject: { name: " Catalog ", code: "CAT" } })).toBe(
      "Catalog",
    );
    expect(displaySubjectName({ subject: { name: " ", code: " cat " } })).toBe(
      "cat",
    );
    expect(displaySubjectName({})).toBe("Unknown");
  });
});
