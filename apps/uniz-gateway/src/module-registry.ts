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

export const MODULE_ROUTES: ModuleRoute[] = [];

export function activeModuleRoutes(
  env: Record<string, string | undefined> = process.env,
): ModuleRoute[] {
  return MODULE_ROUTES.filter((r) => isFeatureEnabled(r.flag, env));
}
