import { describe, expect, it } from "vitest";
import {
  aliasWebadminRole,
  isHodUser,
  resolveEffectiveRole,
  resolveHodBranch,
} from "../src/admin-role";

describe("aliasWebadminRole", () => {
  it("maps legacy webmaster to webadmin", () => {
    expect(aliasWebadminRole("webmaster")).toBe("webadmin");
    expect(aliasWebadminRole('"WebMaster"')).toBe("webadmin");
  });

  it("leaves other roles as they are", () => {
    expect(aliasWebadminRole("Dean")).toBe("Dean");
    expect(aliasWebadminRole(undefined)).toBe("");
  });
});

describe("resolveEffectiveRole", () => {
  it("defaults to student", () => {
    expect(resolveEffectiveRole({})).toBe("student");
  });

  it("lowercases and strips quotes", () => {
    expect(resolveEffectiveRole({ role: '"DEAN"' })).toBe("dean");
  });

  it("treats faculty with hod_ username as hod", () => {
    expect(resolveEffectiveRole({ role: "faculty", username: "hod_cse" })).toBe(
      "hod",
    );
    expect(resolveEffectiveRole({ role: "teacher", username: "HOD-ece" })).toBe(
      "hod",
    );
  });

  it("does not promote non faculty roles or other usernames", () => {
    expect(resolveEffectiveRole({ role: "student", username: "hod_cse" })).toBe(
      "student",
    );
    expect(
      resolveEffectiveRole({ role: "faculty", username: "rhod_cse" }),
    ).toBe("faculty");
  });

  it("maps webmaster to webadmin", () => {
    expect(resolveEffectiveRole({ role: "webmaster" })).toBe("webadmin");
  });
});

describe("isHodUser / resolveHodBranch", () => {
  it("detects hod users", () => {
    expect(isHodUser({ role: "faculty", username: "hod_mech" })).toBe(true);
    expect(isHodUser({ role: "faculty", username: "ravi" })).toBe(false);
  });

  it("prefers department from the token", () => {
    expect(resolveHodBranch({ username: "hod_cse", department: "ece" })).toBe(
      "ECE",
    );
  });

  it("falls back to the username suffix when department is missing or GENERAL", () => {
    expect(resolveHodBranch({ username: "hod_cse" })).toBe("CSE");
    expect(
      resolveHodBranch({ username: "hod-eee", department: "General" }),
    ).toBe("EEE");
    expect(resolveHodBranch({ username: "admin" })).toBe("");
  });
});
