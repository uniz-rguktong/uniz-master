import { describe, it, expect } from "vitest";
import { MODULE_ROUTES, activeModuleRoutes } from "../src/module-registry";

describe("module registry", () => {
  it("lists leave and duty under FEATURE_FACULTY", () => {
    const prefixes = activeModuleRoutes({}).map((r) => r.prefix);
    expect(prefixes).toContain("/api/v1/leave");
    expect(prefixes).toContain("/api/v1/duty");
    expect(
      activeModuleRoutes({
        FEATURE_FACULTY: "false",
        FEATURE_EXAM_DUTIES: "false",
        FEATURE_FEEDBACK: "false",
        FEATURE_FEES: "false",
        FEATURE_LIBRARY: "false",
        FEATURE_PLACEMENT: "false",
        FEATURE_ALUMNI: "false",
      }),
    ).toEqual([]);
  });

  it("lists examduty under FEATURE_EXAM_DUTIES", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/examduty",
    );
    expect(
      activeModuleRoutes({ FEATURE_EXAM_DUTIES: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/examduty");
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
  it("lists feedback under FEATURE_FEEDBACK", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/feedback",
    );
    expect(
      activeModuleRoutes({ FEATURE_FEEDBACK: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/feedback");
  });

  it("lists fees under FEATURE_FEES", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/fees",
    );
    expect(
      activeModuleRoutes({ FEATURE_FEES: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/fees");
  });

  it("lists library under FEATURE_LIBRARY", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/library",
    );
    expect(
      activeModuleRoutes({ FEATURE_LIBRARY: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/library");
  });

  it("lists placement under FEATURE_PLACEMENT", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/placement",
    );
    expect(
      activeModuleRoutes({ FEATURE_PLACEMENT: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/placement");
  });

  it("lists alumni under FEATURE_ALUMNI", () => {
    expect(activeModuleRoutes({}).map((r) => r.prefix)).toContain(
      "/api/v1/alumni",
    );
    expect(
      activeModuleRoutes({ FEATURE_ALUMNI: "false" }).map((r) => r.prefix),
    ).not.toContain("/api/v1/alumni");
  });
});
