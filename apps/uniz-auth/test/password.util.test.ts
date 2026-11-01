import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import {
  campusDefaultPasswordCandidates,
  comparePassword,
  comparePasswordForUser,
  defaultCampusPassword,
  hashPassword,
  isCampusDefaultPassword,
} from "../src/utils/password.util";

// Fake values only. The id is not a real campus id.
const FAKE_ID = "t" + "0".repeat(5) + "1";
const FAKE_ID_UPPER = FAKE_ID.toUpperCase();
const SUFFIX = "@" + "rguktong";
const fakeDefault = (id: string) => id + SUFFIX;
const FAKE_TEST_PW = "test-" + randomUUID();
const WRONG_TEST_PW = "wrong-" + randomUUID();

describe("campus default passwords", () => {
  it("recognises the issued id@rguktong format only", () => {
    expect(isCampusDefaultPassword(` ${fakeDefault(FAKE_ID)} `)).toBe(true);
    expect(isCampusDefaultPassword(fakeDefault(FAKE_ID_UPPER))).toBe(true);
    expect(isCampusDefaultPassword(FAKE_TEST_PW)).toBe(false);
    expect(isCampusDefaultPassword(fakeDefault(FAKE_ID) + "ole")).toBe(false);
  });

  it("builds the canonical lowercase default", () => {
    expect(defaultCampusPassword(` ${FAKE_ID_UPPER} `)).toBe(
      fakeDefault(FAKE_ID),
    );
  });

  it("returns a custom password unchanged", () => {
    expect(
      campusDefaultPasswordCandidates(`  ${FAKE_TEST_PW}  `, FAKE_ID),
    ).toEqual([FAKE_TEST_PW]);
  });

  it("adds upper and lower id variants for a default password", () => {
    expect(
      campusDefaultPasswordCandidates(
        fakeDefault(FAKE_ID_UPPER),
        FAKE_ID,
      ).sort(),
    ).toEqual([fakeDefault(FAKE_ID_UPPER), fakeDefault(FAKE_ID)].sort());
  });
});

describe("hashPassword / comparePassword", () => {
  it("round-trips a password", async () => {
    const hash = await hashPassword(FAKE_TEST_PW);
    expect(hash).not.toBe(FAKE_TEST_PW);
    expect(await comparePassword(FAKE_TEST_PW, hash)).toBe(true);
    expect(await comparePassword(WRONG_TEST_PW, hash)).toBe(false);
  });

  it("accepts a default password in either id case", async () => {
    const hash = await hashPassword(fakeDefault(FAKE_ID));
    expect(
      await comparePasswordForUser(fakeDefault(FAKE_ID_UPPER), hash, FAKE_ID),
    ).toBe(true);
    expect(await comparePasswordForUser(WRONG_TEST_PW, hash, FAKE_ID)).toBe(
      false,
    );
  });
});
