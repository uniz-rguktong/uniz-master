import { isFeatureEnabled, type ModuleFlag } from "@uniz/shared";

/**
 * Stub registry for upcoming module routes. Each module PR adds its entry and
 * mounts its own handlers; nothing here is routed yet.
 */
export interface ModuleRoute {
  flag: ModuleFlag;
  prefix: string;
  roles: string[];
}

export const MODULE_ROUTES: ModuleRoute[] = [
  {
    flag: "FEATURE_FACULTY",
    prefix: "/api/v1/leave",
    roles: ["faculty", "teacher", "hod", "dean", "director", "webadmin"],
  },
  {
    flag: "FEATURE_FACULTY",
    prefix: "/api/v1/duty",
    roles: ["faculty", "teacher", "hod", "dean", "director", "webadmin"],
  },
  {
    flag: "FEATURE_EXAM_DUTIES",
    prefix: "/api/v1/examduty",
    roles: ["coe", "dean", "director", "webadmin", "faculty", "teacher", "hod"],
  },
  {
    flag: "FEATURE_FEEDBACK",
    prefix: "/api/v1/feedback",
    roles: [
      "student",
      "faculty",
      "teacher",
      "hod",
      "coe",
      "dean",
      "director",
      "webadmin",
    ],
  },
  {
    flag: "FEATURE_FEES",
    prefix: "/api/v1/fees",
    roles: ["student", "webadmin", "director", "dean"],
  },
  {
    flag: "FEATURE_LIBRARY",
    prefix: "/api/v1/library",
    roles: [
      "student",
      "faculty",
      "teacher",
      "hod",
      "librarian",
      "webadmin",
      "director",
    ],
  },
  {
    flag: "FEATURE_PLACEMENT",
    prefix: "/api/v1/placement",
    roles: ["student", "webadmin", "director", "dean"],
  },
  {
    flag: "FEATURE_ALUMNI",
    prefix: "/api/v1/alumni",
    roles: ["student", "webadmin", "director", "dean"],
  },
];

export function activeModuleRoutes(
  env: Record<string, string | undefined> = process.env,
): ModuleRoute[] {
  return MODULE_ROUTES.filter((r) => isFeatureEnabled(r.flag, env));
}
