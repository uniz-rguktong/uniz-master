/** Engineering branches for student records, uploads, and admin filters. */
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

export const ENGINEERING_BRANCH_OPTIONS = ["ALL", ...ENGINEERING_BRANCHES] as const;

/** Shown when branch is missing or not yet allocated. */
export const DEFAULT_STUDENT_BRANCH = "N/A";
