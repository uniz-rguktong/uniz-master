import { describe, it, expect } from "vitest";
import { MODULE_ROUTES, activeModuleRoutes } from "../src/module-registry";

describe("module registry", () => {
  it("lists leave and duty under FEATURE_FACULTY", () => {
    const prefixes = activeModuleRoutes({}).map((r) => r.prefix);
    expect(prefixes).toContain("/api/v1/leave");
    expect(prefixes).toContain("/api/v1/duty");
    expect(activeModuleRoutes({ FEATURE_FACULTY: "false" })).toEqual([]);
  });

  it("keeps outpass parked", () => {
    const before = MODULE_ROUTES.length;
    MODULE_ROUTES.push({
      flag: "FEATURE_OUTPASS",
      prefix: "/api/v1/outpass-x",
      roles: ["student"],
    });
    expect(
      activeModuleRoutes({ FEATURE_OUTPASS: "true" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/outpass-x");
    MODULE_ROUTES.length = before;
  });
});
