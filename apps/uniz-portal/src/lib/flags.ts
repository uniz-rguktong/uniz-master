/**
 * Portal module flags (build time, Vite). Mirrors FEATURE_* in @uniz/shared:
 * every module defaults on, FEATURE_OUTPASS stays off. Set VITE_FEATURE_<MODULE>=false
 * at build to hide a module.
 */
export type PortalModule =
  | "FACULTY" | "FEES" | "LIBRARY" | "PLACEMENT" | "ALUMNI" | "INFO_CENTRE"
  | "ADMISSIONS" | "EXAM_DUTIES" | "ESTABLISHMENT" | "FEEDBACK" | "CLUBS" | "OUTPASS";

type Env = Record<string, string | boolean | undefined>;

export function isModuleEnabled(mod: PortalModule, env: Env = import.meta.env as Env): boolean {
  if (mod === "OUTPASS") return false;
  const raw = env[`VITE_FEATURE_${mod}`];
  if (raw === undefined || raw === "") return true;
  return !["false", "0", "off", "no"].includes(String(raw).toLowerCase());
}

export interface ModuleNavItem {
  id: string;
  label: string;
  href: string;
  module: PortalModule;
  roles: string[];
}

/** Nav helper: keeps items whose module flag is on and whose roles include the user's role. */
export function moduleNavFor<T extends ModuleNavItem>(items: T[], role: string | undefined, env?: Env): T[] {
  if (!role) return [];
  const r = role.toLowerCase();
  return items.filter((i) => isModuleEnabled(i.module, env) && i.roles.map((x) => x.toLowerCase()).includes(r));
}
