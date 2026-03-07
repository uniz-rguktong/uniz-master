/**
 * Shared utility for calculating trends
 */
export function calculateTrend(
  current: number,
  previous: number | null | undefined,
): { value: string; isPositive: boolean } | null {
  if (previous === 0 || previous === null || previous === undefined) {
    if (current > 0) {
      return { value: "+100%", isPositive: true };
    }
    return null;
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);

  if (rounded === 0) {
    return { value: "0%", isPositive: true };
  }

  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
    isPositive: rounded >= 0,
  };
}
