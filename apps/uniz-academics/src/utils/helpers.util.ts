export const GRADE_MAP: Record<string, number> = {
  EX: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  R: 0,
};

export function mapGradeToPoint(val: string | number): number {
  if (typeof val === "number") return val;
  const v = String(val).toUpperCase().trim();
  if (GRADE_MAP[v] !== undefined) return GRADE_MAP[v];

  // Try parsing float (e.g. "8.5")
  const num = parseFloat(v);
  if (!isNaN(num)) return num;

  return 0; // Default fail
}
