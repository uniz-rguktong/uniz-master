import { describe, expect, it } from "vitest";
import { resolveHodBranch } from "../src/admin-role";

describe("resolveHodBranch edges", () => {
  it("returns an empty code when nothing identifies a branch", () => {
    expect(resolveHodBranch({})).toBe("");
    expect(resolveHodBranch({ username: '"admin"' })).toBe("");
  });
});
