import prisma from "./prisma.util";

export function deriveSemesterSuffix(label: string): string {
  const match = String(label || "").match(/SEM[-\s]?([12])/i);
  return match ? `SEM-${match[1]}` : "SEM-1";
}

/** Canonical catalog semester string, e.g. E3-SEM-1. */
export function canonicalSubjectSemester(
  academicYear: string | undefined,
  semesterLabel: string,
): string {
  const yr = (academicYear || "E1").toUpperCase();
  return `${yr}-${deriveSemesterSuffix(semesterLabel)}`;
}

/** Resolve SEM-1 / AY-2026-27-SEM-1 / full AcademicSemester.id to a semester row id. */
export async function resolveAcademicSemesterId(
  raw?: string | null,
): Promise<string | null> {
  const value = String(raw || "").trim();
  if (!value) return null;

  const direct = await prisma.academicSemester.findUnique({
    where: { id: value },
    select: { id: true },
  });
  if (direct) return direct.id;

  const upper = value.toUpperCase();
  const suffixMatch = upper.match(/^SEM[-\s]?([12])$/);
  if (suffixMatch) {
    const suffix = `SEM-${suffixMatch[1]}`;
    const sem = await prisma.academicSemester.findFirst({
      where: {
        OR: [
          { id: { endsWith: suffix, mode: "insensitive" } },
          { name: { contains: suffix, mode: "insensitive" } },
        ],
        status: {
          in: [
            "DRAFT",
            "DEAN_REVIEW",
            "HOD_REVIEW",
            "APPROVED",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    return sem?.id || null;
  }

  const partial = await prisma.academicSemester.findFirst({
    where: {
      OR: [
        { id: { contains: upper, mode: "insensitive" } },
        { name: { contains: upper, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return partial?.id || null;
}

export type TemplateSubjectRow = {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: string;
  academicCode: string | null;
  academicYear: string | null;
  batch: string | null;
  subjectType: string | null;
  electiveGroupId: string | null;
  electiveGroupName: string | null;
  electiveLimit: number | null;
  isMandatory: boolean;
};

/** Load subjects for templates via branch allocations (official codes + hierarchy). */
export async function loadTemplateSubjectsFromSemester(opts: {
  academicSemesterId?: string | null;
  branch?: string | null;
  academicYear?: string | null;
  batch?: string | null;
  subjectCode?: string | null;
  approvedOnly?: boolean;
}): Promise<{ semesterId: string | null; subjects: TemplateSubjectRow[] }> {
  const semesterId = await resolveAcademicSemesterId(opts.academicSemesterId);
  if (!semesterId) return { semesterId: null, subjects: [] };

  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
    select: { id: true, name: true },
  });
  if (!semester) return { semesterId: null, subjects: [] };

  const branch =
    opts.branch && String(opts.branch).toUpperCase() !== "ALL"
      ? String(opts.branch).toUpperCase()
      : undefined;
  const academicYear =
    opts.academicYear && String(opts.academicYear).toUpperCase() !== "ALL"
      ? String(opts.academicYear).toUpperCase()
      : undefined;
  const batch =
    opts.batch && String(opts.batch).toUpperCase() !== "ALL"
      ? String(opts.batch).toUpperCase()
      : undefined;
  const subjectCode = String(opts.subjectCode || "")
    .trim()
    .toUpperCase();

  const allocations = await prisma.branchAllocation.findMany({
    where: {
      semesterId,
      ...(opts.approvedOnly ? { isApproved: true } : {}),
      ...(branch ? { branch: { equals: branch, mode: "insensitive" } } : {}),
      ...(academicYear
        ? { academicYear: { equals: academicYear, mode: "insensitive" } }
        : {}),
      ...(batch ? { batch: { equals: batch, mode: "insensitive" } } : {}),
    },
    include: { subject: true },
    orderBy: [
      { branch: "asc" },
      { academicYear: "asc" },
      { batch: "asc" },
      { customCode: "asc" },
      { customName: "asc" },
    ],
  });

  let subjects = allocations.map((alloc) => ({
    id: alloc.subjectId,
    code: alloc.subject.code,
    name: (alloc.customName || alloc.subject.name || "").trim(),
    credits: alloc.customCredits ?? alloc.subject.credits ?? 0,
    department: alloc.branch,
    semester: canonicalSubjectSemester(
      alloc.academicYear || undefined,
      semester.name,
    ),
    academicCode: alloc.customCode?.trim().toUpperCase() || null,
    academicYear: alloc.academicYear,
    batch: alloc.batch,
    subjectType: alloc.subjectType,
    electiveGroupId: alloc.electiveGroupId,
    electiveGroupName: alloc.electiveGroupName,
    electiveLimit: alloc.electiveLimit,
    isMandatory: alloc.isMandatory,
  }));

  if (subjectCode && subjectCode !== "ALL") {
    subjects = subjects.filter(
      (s) =>
        s.code.toUpperCase() === subjectCode ||
        (s.academicCode || "").toUpperCase() === subjectCode ||
        s.code.toUpperCase().includes(subjectCode) ||
        (s.academicCode || "").toUpperCase().includes(subjectCode),
    );
  }

  return { semesterId, subjects };
}
