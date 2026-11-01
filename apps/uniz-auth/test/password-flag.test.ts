import { describe, expect, it } from "vitest";
import { isOwnCampusDefaultPassword } from "../src/utils/password.util";
import { resolveLoginPasswordFlag } from "../src/utils/password-flag";

describe("campus default detection", () => {
  it("matches only this user's own default, including letter case", () => {
    expect(isOwnCampusDefaultPassword("O210001@rguktong", "o210001")).toBe(
      true,
    );
    expect(isOwnCampusDefaultPassword("o210001@rguktong", "O210001")).toBe(
      true,
    );
    expect(isOwnCampusDefaultPassword("o210002@rguktong", "o210001")).toBe(
      false,
    );
    expect(isOwnCampusDefaultPassword("a-real-password", "o210001")).toBe(
      false,
    );
  });
});

describe("resolveLoginPasswordFlag", () => {
  const base = {
    submittedPassword: "o210001@rguktong",
    username: "o210001",
    passwordChangedAt: null as Date | null,
    alreadyFlagged: false,
  };

  it("does not expose the flag when enforcement is off", () => {
    const result = resolveLoginPasswordFlag({ ...base, enforce: false });
    expect(result.expose).toBe(false);
    expect(result.persistFlag).toBe(true);
  });

  it("never forces an existing user who is not on the campus default", () => {
    const result = resolveLoginPasswordFlag({
      enforce: true,
      submittedPassword: "a-real-password",
      username: "o210001",
      passwordChangedAt: null,
      alreadyFlagged: false,
    });
    expect(result).toEqual({ persistFlag: false, expose: false });
  });

  it("does not force a user who already changed their password", () => {
    const result = resolveLoginPasswordFlag({
      ...base,
      enforce: true,
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    });
    expect(result.expose).toBe(false);
    expect(result.persistFlag).toBe(false);
  });

  it("flags a first login that is still the campus default", () => {
    expect(resolveLoginPasswordFlag({ ...base, enforce: true })).toEqual({
      persistFlag: true,
      expose: true,
    });
  });

  it("keeps an admin reset flagged even when the temporary password is custom", () => {
    const result = resolveLoginPasswordFlag({
      enforce: true,
      submittedPassword: "temporary-password",
      username: "o210001",
      passwordChangedAt: null,
      alreadyFlagged: true,
    });
    expect(result).toEqual({ persistFlag: false, expose: true });
  });

  it("does not flag or expose load-test accounts", () => {
    expect(
      resolveLoginPasswordFlag({
        enforce: true,
        submittedPassword: "load_test_stu_001@rguktong",
        username: "LOAD_TEST_STU_001",
        passwordChangedAt: null,
        alreadyFlagged: true,
      }),
    ).toEqual({ persistFlag: false, expose: false });
  });
});
