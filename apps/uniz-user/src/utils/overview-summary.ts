/**
 * SQL for the webadmin overview and the student home.
 * Aggregates stay in the database (COUNT / GROUP BY / AVG). Callers pass a
 * schema name that has already passed schemaIdent — never interpolate raw input.
 */

const SCHEMA_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function schemaIdent(name: string | undefined, fallback: string): string {
  const value = (name || "").trim();
  if (SCHEMA_RE.test(value)) return value;
  return fallback;
}

export const ACADEMICS_SCHEMA = schemaIdent(
  process.env.ACADEMICS_DB_SCHEMA,
  "uniz_academics",
);
export const AUTH_SCHEMA = schemaIdent(process.env.AUTH_DB_SCHEMA, "uniz_auth");

export function num(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function campusSnapshotSql(): string {
  return `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "isSuspended" = false)::int AS active,
      COUNT(*) FILTER (WHERE "isSuspended" = false AND "isPresentInCampus" = true)::int AS on_campus,
      COUNT(*) FILTER (WHERE "isSuspended" = false AND "isPresentInCampus" = false)::int AS off_campus,
      COUNT(*) FILTER (WHERE "isSuspended" = true)::int AS suspended,
      COUNT(*) FILTER (WHERE "isApplicationPending" = true)::int AS pending_requests,
      COUNT(*) FILTER (WHERE "totalBacklogs" > 0 AND "isSuspended" = false)::int AS with_backlogs,
      COUNT(*) FILTER (WHERE "profileUrl" <> '' AND "isSuspended" = false)::int AS with_photo,
      ROUND(AVG(cgpa) FILTER (WHERE "isSuspended" = false AND cgpa > 0)::numeric, 2)::float AS avg_cgpa
    FROM "StudentProfile"
  `;
}

export function branchDistributionSql(): string {
  return `
    SELECT branch, COUNT(*)::int AS count
    FROM "StudentProfile"
    WHERE "isSuspended" = false AND branch <> ''
    GROUP BY branch
    ORDER BY count DESC
    LIMIT 8
  `;
}

export function grievanceSummarySql(): string {
  return `
    SELECT category, status, COUNT(*)::int AS count
    FROM "Grievance"
    GROUP BY category, status
    ORDER BY count DESC
  `;
}

export function authAccountsSql(schema: string): string {
  return `
    SELECT
      role,
      COUNT(*) FILTER (WHERE "isDisabled" = false)::int AS active,
      COUNT(*) FILTER (WHERE "isDisabled" = true)::int AS disabled
    FROM ${schema}."AuthCredential"
    GROUP BY role
  `;
}

export function academicsOverviewSql(schema: string): { semester: string; counts: string } {
  return {
    semester: `
      SELECT id, name
      FROM ${schema}."AcademicSemester"
      WHERE status::text <> 'DRAFT'
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
    counts: `
      SELECT
        (SELECT COUNT(*)::int FROM ${schema}."AcademicSemester" WHERE status::text <> 'DRAFT') AS active_semesters,
        (SELECT ROUND(AVG("grade")::numeric, 2)::float
           FROM ${schema}."Grade"
          WHERE ($1::text IS NULL OR "semesterId" = $1)) AS avg_gpa,
        (SELECT COUNT(*)::int
           FROM ${schema}."Grade"
          WHERE "grade" < 5
            AND ($1::text IS NULL OR "semesterId" = $1)) AS backlog_count,
        (SELECT COUNT(DISTINCT "studentId")::int
           FROM ${schema}."Registration"
          WHERE status = 'REGISTERED'
            AND ($1::text IS NULL OR "semesterId" = $1)) AS registered_students
    `,
  };
}

export function studentAttendanceSql(schema: string): string {
  return `
    SELECT CASE
      WHEN COALESCE(SUM("totalClasses"), 0) > 0
        THEN ROUND((SUM("attendedClasses")::numeric / SUM("totalClasses")) * 100, 1)::float
      ELSE NULL
    END AS pct
    FROM ${schema}."Attendance"
    WHERE "studentId" = $1
  `;
}

export function studentLatestSgpaSql(schema: string): string {
  return `
    SELECT "semesterId" AS semester,
           ROUND(AVG("grade")::numeric, 2)::float AS sgpa
    FROM ${schema}."Grade"
    WHERE "studentId" = $1
    GROUP BY "semesterId"
    ORDER BY MAX("createdAt") DESC
    LIMIT 1
  `;
}

export function studentLatestResultsSql(schema: string): string {
  return `
    SELECT
      COALESCE(
        NULLIF("subjectName", ''),
        NULLIF("subjectNameOverride", ''),
        NULLIF("subjectCode", ''),
        'Subject'
      ) AS subject,
      "grade"::float AS grade
    FROM ${schema}."Grade"
    WHERE "studentId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 4
  `;
}

export function studentRegistrationSql(schema: string): string {
  return `
    SELECT sem.name AS semester_name,
           sem.status::text AS semester_status,
           COUNT(r.id) FILTER (WHERE r.status = 'REGISTERED')::int AS subject_count
    FROM ${schema}."AcademicSemester" sem
    LEFT JOIN ${schema}."Registration" r
      ON r."semesterId" = sem.id AND r."studentId" = $1
    WHERE sem.status::text <> 'DRAFT'
    GROUP BY sem.id, sem.name, sem.status, sem."createdAt"
    ORDER BY sem."createdAt" DESC
    LIMIT 1
  `;
}

export function visibleNotificationsSql(): string {
  return `
    SELECT id::text AS id, title, content, link, "createdAt"
    FROM "PublicNotification"
    WHERE "isVisible" = true
    ORDER BY "createdAt" DESC
    LIMIT 5
  `;
}

export type RegistrationInput = {
  semesterName: string | null;
  semesterStatus: string | null;
  subjectCount: number;
};

export function registrationStatus(input: RegistrationInput): {
  label: string;
  detail: string;
  registered: boolean;
  empty: boolean;
} {
  if (!input.semesterName) {
    return {
      label: "Not open",
      detail: "No semester is open for registration.",
      registered: false,
      empty: true,
    };
  }
  if (input.subjectCount > 0) {
    const subjects =
      input.subjectCount === 1 ? "1 subject" : `${input.subjectCount} subjects`;
    return {
      label: "Registered",
      detail: `${input.semesterName} · ${subjects}`,
      registered: true,
      empty: false,
    };
  }
  const status = (input.semesterStatus || "").toUpperCase();
  if (status === "REGISTRATION_OPEN") {
    return {
      label: "Action needed",
      detail: `${input.semesterName} is open and you have not registered.`,
      registered: false,
      empty: false,
    };
  }
  if (status === "REGISTRATION_CLOSED" || status === "APPROVED") {
    return {
      label: "Closed",
      detail: `${input.semesterName} registration is closed.`,
      registered: false,
      empty: false,
    };
  }
  return {
    label: "Pending",
    detail: `${input.semesterName} is not open yet.`,
    registered: false,
    empty: false,
  };
}
