/** Engineering departments used for student branch allocation and bulk uploads. */
export const ENGINEERING_BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "CHEM",
  "MME",
  "AI/ML",
] as const;

export type EngineeringBranch = (typeof ENGINEERING_BRANCHES)[number];

/** Maps full department names (and legacy codes) to canonical branch codes. */
export const BRANCH_NAME_MAP: Record<string, EngineeringBranch | string> = {
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "MECHANICAL ENGINEERING": "MECH",
  "CIVIL ENGINEERING": "CIVIL",
  "CHEMICAL ENGINEERING": "CHEM",
  "METALLURGICAL AND MATERIALS ENGINEERING": "MME",
  "METALLURGY AND MATERIALS ENGINEERING": "MME",
  "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": "AI/ML",
  "ARTIFICIAL INTELLIGENCE & ML": "AI/ML",
  "ARTIFICAL INTELLIGENCE & ML": "AI/ML",
  "ARTIFICIAL INTELLIGENCE / ML": "AI/ML",
  "AI&ML": "AI/ML",
  "AI / ML": "AI/ML",
  AIML: "AI/ML",
};

export const DEFAULT_STUDENT_BRANCH = "N/A";

const PLACEHOLDER_BRANCH_VALUES = new Set([
  "",
  "-",
  "NA",
  "N/A",
  "NONE",
  "NULL",
  "TBD",
  "UNKNOWN",
  "GENERAL",
]);

export function normalizeBranchCode(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  return BRANCH_NAME_MAP[upper] || trimmed;
}

/** Canonical branch for storage/API responses; never returns empty. */
export function resolveStudentBranch(name?: string | null): string {
  const normalized = normalizeBranchCode(String(name ?? ""));
  const upper = normalized.toUpperCase();
  if (!upper || PLACEHOLDER_BRANCH_VALUES.has(upper)) {
    return DEFAULT_STUDENT_BRANCH;
  }
  return normalized;
}
