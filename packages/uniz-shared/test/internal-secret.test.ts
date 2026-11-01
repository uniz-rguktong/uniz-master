import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getInternalSecret,
  isValidInternalSecret,
} from "../src/internal-secret";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getInternalSecret", () => {
  it("uses INTERNAL_SECRET when set, trimmed", () => {
    vi.stubEnv("INTERNAL_SECRET", "  test-value  ");
    expect(getInternalSecret()).toBe("test-value");
  });

  it("falls back to the dev value outside production", () => {
    vi.stubEnv("INTERNAL_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getInternalSecret()).toBe("uniz-core");
  });

  it("throws in production when unset", () => {
    vi.stubEnv("INTERNAL_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getInternalSecret()).toThrow(
      "INTERNAL_SECRET is required in production",
    );
  });
});

describe("isValidInternalSecret", () => {
  it("matches only the configured value", () => {
    vi.stubEnv("INTERNAL_SECRET", "test-value");
    expect(isValidInternalSecret("test-value")).toBe(true);
    expect(isValidInternalSecret(" test-value ")).toBe(true);
    expect(isValidInternalSecret("wrong")).toBe(false);
  });

  it("rejects missing and array headers", () => {
    vi.stubEnv("INTERNAL_SECRET", "test-value");
    expect(isValidInternalSecret(undefined)).toBe(false);
    expect(isValidInternalSecret(["test-value"])).toBe(false);
  });
});
