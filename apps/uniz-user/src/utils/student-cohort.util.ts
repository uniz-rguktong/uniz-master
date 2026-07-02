export type StudentCohortFilters = {
  branch?: string;
  year?: string;
  batch?: string;
};

/** Prisma where clause for optional branch / year / batch cohort filters. */
export function buildStudentCohortWhere(
  filters: StudentCohortFilters,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = { ...extra };
  const { branch, year, batch } = filters;

  if (branch && String(branch).toUpperCase() !== "ALL") {
    where.branch = { equals: String(branch), mode: "insensitive" };
  }
  if (year && String(year).toUpperCase() !== "ALL") {
    where.year = { equals: String(year), mode: "insensitive" };
  }
  if (batch && String(batch).toUpperCase() !== "ALL") {
    where.batch = { equals: String(batch), mode: "insensitive" };
  }

  return where;
}
