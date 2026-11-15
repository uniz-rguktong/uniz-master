// Initials from a name like "Mr. Krishna Manam M.Tech" -> "KM".
export function initials(name: string): string {
  const words = (name ?? "")
    .replace(/\b(mrs|mr|ms|dr|prof|smt|sri)\.?\s*/gi, " ")
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}
