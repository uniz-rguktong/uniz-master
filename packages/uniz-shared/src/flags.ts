/**
 * Server-side module flags. Every FEATURE_<MODULE> defaults on, except
 * FEATURE_OUTPASS which is parked and can never be turned on from env.
 */
export const MODULE_FLAGS = [
  "FEATURE_FACULTY",
  "FEATURE_FEES",
  "FEATURE_LIBRARY",
  "FEATURE_PLACEMENT",
  "FEATURE_ALUMNI",
  "FEATURE_INFO_CENTRE",
  "FEATURE_ADMISSIONS",
  "FEATURE_EXAM_DUTIES",
  "FEATURE_ESTABLISHMENT",
  "FEATURE_FEEDBACK",
  "FEATURE_CLUBS",
  "FEATURE_OUTPASS",
] as const;

export type ModuleFlag = (typeof MODULE_FLAGS)[number];

type Env = Record<string, string | undefined>;

const PARKED: ReadonlySet<string> = new Set(["FEATURE_OUTPASS"]);

export function isFeatureEnabled(flag: ModuleFlag, env: Env = process.env): boolean {
  if (PARKED.has(flag)) return false;
  const raw = env[flag];
  if (raw === undefined || raw.trim() === "") return true;
  return !["false", "0", "off", "no"].includes(raw.trim().toLowerCase());
}

export function getFeatureFlags(env: Env = process.env): Record<ModuleFlag, boolean> {
  const out = {} as Record<ModuleFlag, boolean>;
  for (const f of MODULE_FLAGS) out[f] = isFeatureEnabled(f, env);
  return out;
}
