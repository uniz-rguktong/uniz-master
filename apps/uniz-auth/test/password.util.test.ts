import { describe, expect, it } from "vitest";
import {
  campusDefaultPasswordCandidates,
  comparePassword,
  comparePasswordForUser,
  defaultCampusPassword,
  hashPassword,
  isCampusDefaultPassword,
} from "../src/utils/password.util";

describe("campus default passwords", () => {
  it("recognises the issued id@rguktong format only", () => {
    expect(isCampusDefaultPassword(" o210008@rguktong ")).toBe(true);
    expect(isCampusDefaultPassword("O210008@rguktong")).toBe(true);
    expect(isCampusDefaultPassword("my own password")).toBe(false);
    expect(isCampusDefaultPassword("o210008@rguktongole")).toBe(false);
  });

  it("builds the canonical lowercase default", () => {
    expect(defaultCampusPassword(" O210008 ")).toBe("o210008@rguktong");
  });

  it("returns a custom password unchanged", () => {
    expect(campusDefaultPasswordCandidates("  MySecret1  ", "o210008")).toEqual(
      ["MySecret1"],
    );
  });

  it("adds upper and lower id variants for a default password", () => {
    expect(
      campusDefaultPasswordCandidates("O210008@rguktong", "o210008").sort(),
    ).toEqual(["O210008@rguktong", "o210008@rguktong"]);
  });
});

describe("hashPassword / comparePassword", () => {
  it("round-trips a password", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toBe("correct horse");
    expect(await comparePassword("correct horse", hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });

  it("accepts a default password in either id case", async () => {
    const hash = await hashPassword("o210008@rguktong");
    expect(
      await comparePasswordForUser("O210008@rguktong", hash, "o210008"),
    ).toBe(true);
    expect(await comparePasswordForUser("nope", hash, "o210008")).toBe(false);
  });
});
