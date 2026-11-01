import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { isOwnCampusDefaultPassword } from "../src/utils/password.util";
import { resolveLoginPasswordFlag } from "../src/utils/password-flag";

// Fake values only. Ids are not real campus ids.
const FAKE_ID = "t" + "0".repeat(5) + "1";
const OTHER_FAKE_ID = "t" + "0".repeat(5) + "2";
const SUFFIX = "@" + "rguktong";
const fakeDefault = (id: string) => id + SUFFIX;
const FAKE_TEST_PW = "test-" + randomUUID();
const TEMP_TEST_PW = "temp-" + randomUUID();
const LOAD_TEST_PW = "load-" + randomUUID();

describe("campus default detection", () => {
  it("matches only this user's own default, including letter case", () => {
    expect(isOwnCampusDefaultPassword(fakeDefault(FAKE_ID), FAKE_ID)).toBe(
      true,
    );
    expect(
      isOwnCampusDefaultPassword(fakeDefault(FAKE_ID.toUpperCase()), FAKE_ID),
    ).toBe(true);
    expect(
      isOwnCampusDefaultPassword(fakeDefault(OTHER_FAKE_ID), FAKE_ID),
    ).toBe(false);
    expect(isOwnCampusDefaultPassword(FAKE_TEST_PW, FAKE_ID)).toBe(false);
  });
});

describe("resolveLoginPasswordFlag", () => {
  const base = {
    submittedPassword: fakeDefault(FAKE_ID),
    username: FAKE_ID,
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
      submittedPassword: FAKE_TEST_PW,
      username: FAKE_ID,
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
      submittedPassword: TEMP_TEST_PW,
      username: FAKE_ID,
      passwordChangedAt: null,
      alreadyFlagged: true,
    });
    expect(result).toEqual({ persistFlag: false, expose: true });
  });

  it("does not flag or expose load-test accounts", () => {
    expect(
      resolveLoginPasswordFlag({
        enforce: true,
        submittedPassword: LOAD_TEST_PW,
        username: "LOAD_TEST_STU_001",
        passwordChangedAt: null,
        alreadyFlagged: true,
      }),
    ).toEqual({ persistFlag: false, expose: false });
  });
});
