import { describe, it, expect } from "vitest";
import { MODULE_ROUTES, activeModuleRoutes } from "../src/module-registry";

describe("module registry", () => {
  it("drops routes whose flag is off and keeps outpass parked", () => {
    MODULE_ROUTES.push({
      flag: "FEATURE_FEES",
      prefix: "/api/v1/fees",
      roles: ["student"],
    });
    MODULE_ROUTES.push({
      flag: "FEATURE_OUTPASS",
      prefix: "/api/v1/outpass-x",
      roles: ["student"],
    });
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toEqual([
      "/api/v1/fees",
    ]);
    expect(activeModuleRoutes({ FEATURE_FEES: "false" })).toEqual([]);
    MODULE_ROUTES.length = 0;
  });
});
