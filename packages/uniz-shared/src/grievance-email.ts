/** Human-readable category label for student-facing grievance emails. */
export function formatGrievanceCategoryLabel(category: string): string {
  const key = (category || "").trim().toLowerCase();
  switch (key) {
    case "hostel":
      return "hostel / mess";
    case "mess":
      return "mess / hostel";
    case "academic":
      return "academic matters";
    case "infrastructure":
      return "campus infrastructure";
    default:
      return (category || "your concern").trim().toLowerCase();
  }
}

/**
 * Returns false when the description is too vague, too short, or looks like
 * random input — SWO should close with a "please resubmit" style message.
 */
export function isActionableGrievanceDescription(description: string): boolean {
  const text = (description || "").trim();
  if (text.length < 20) return false;

  const words = text
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-zA-Z]/g, "").length >= 3);
  if (words.length < 2) return false;

  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 15) return false;

  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  if (vowels / letters.length < 0.22) return false;

  // Single keyboard-mash token (no spaces)
  if (!/\s/.test(text) && letters.length > 12) return false;

  return true;
}

export function formatStudentDisplayName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Student";
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
