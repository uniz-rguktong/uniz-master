/** Acronyms and codes that should stay uppercase when formatting labels. */
const PRESERVE_ACRONYMS = new Set([
  "AI",
  "AO",
  "API",
  "CGPA",
  "COE",
  "CSE",
  "CSV",
  "ECE",
  "EEE",
  "EWS",
  "HOD",
  "HTTP",
  "ID",
  "IT",
  "LIB",
  "ME",
  "MID",
  "ML",
  "MME",
  "N/A",
  "OBC",
  "PDF",
  "PED",
  "PWA",
  "RGUKT",
  "RTI",
  "SC",
  "SEM",
  "SGPA",
  "ST",
  "SWO",
  "URL",
  "CIVIL",
  "CHEM",
  "MECH",
]);

function titleCaseWord(word: string): string {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (PRESERVE_ACRONYMS.has(upper)) return upper;
  if (/^[A-Z]{2,4}$/.test(upper) && /^[A-Za-z&]+$/.test(word)) return upper;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Converts screaming snake_case / ALL CAPS strings into readable title case
 * while preserving known acronyms (CSE, CGPA, etc.).
 */
export function formatDisplayText(
  value: string | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined) return fallback;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;

  if (trimmed !== trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    return trimmed;
  }

  if (trimmed.includes("_")) {
    return trimmed.split("_").filter(Boolean).map(titleCaseWord).join(" ");
  }

  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).filter(Boolean).map(titleCaseWord).join(" ");
  }

  return titleCaseWord(trimmed);
}

export const formatStatus = formatDisplayText;
export const formatRoleLabel = formatDisplayText;
