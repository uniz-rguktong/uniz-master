/**
 * Build-time feature flags (Vite). Defaults are off / safe for production.
 * Opt in by setting the matching VITE_* env to "true" at portal image build.
 */

/** Hostel outpass + outing request flows (student + admin). Default: off. */
export const enableOutingsAndOutpasses =
  import.meta.env.VITE_ENABLE_OUTPASS_OUTING === "true";

/** Full-portal maintenance interstitial. Default: off. */
export const isMaintenanceMode =
  import.meta.env.VITE_MAINTENANCE_MODE === "true";

/** Tab / nav ids that belong only to outpass/outing workflows. */
export const OUTPASS_OUTING_TAB_IDS = new Set([
  "outing",
  "outpass",
  "outings",
  "approve_outing",
  "approve_outpass",
  "requestOuting",
  "requestOutpass",
]);

export function filterOutpassOutingTabs<T extends string>(tabs: readonly T[]): T[] {
  if (enableOutingsAndOutpasses) return [...tabs];
  return tabs.filter((t) => !OUTPASS_OUTING_TAB_IDS.has(t));
}

export function filterOutpassOutingNavItems<T extends { id: string }>(
  items: T[],
): T[] {
  if (enableOutingsAndOutpasses) return items;
  return items.filter((item) => !OUTPASS_OUTING_TAB_IDS.has(item.id));
}
