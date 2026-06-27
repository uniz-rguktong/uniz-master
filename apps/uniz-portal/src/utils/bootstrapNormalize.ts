/** Bootstrap stores full academics API envelopes — normalize to arrays for UI. */
export function asGradeList(grades: unknown): unknown[] {
  if (Array.isArray(grades)) return grades;
  if (grades && typeof grades === "object") {
    const nested = (grades as { grades?: unknown }).grades;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

export function asAttendanceList(attendance: unknown): unknown[] {
  if (Array.isArray(attendance)) return attendance;
  if (attendance && typeof attendance === "object") {
    const nested = (attendance as { attendance?: unknown }).attendance;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

export function gradeSemesterLabel(grade: {
  semester?: { name?: string };
  semesterId?: string;
}): string {
  return grade.semester?.name || grade.semesterId || "Unknown";
}
