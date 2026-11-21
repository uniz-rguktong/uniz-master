import { Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { resolveEffectiveRole, UserRole } from "../shared/roles.enum";
import { redis } from "../utils/redis.util";
import { studentHomeSummaryKey } from "../utils/student-cache.util";
import {
  ACADEMICS_SCHEMA,
  AUTH_SCHEMA,
  academicsOverviewSql,
  authAccountsSql,
  branchDistributionSql,
  campusSnapshotSql,
  grievanceSummarySql,
  num,
  numOrNull,
  registrationStatus,
  studentAttendanceSql,
  studentLatestResultsSql,
  studentLatestSgpaSql,
  studentRegistrationSql,
  visibleNotificationsSql,
} from "../utils/overview-summary";

const OVERVIEW_CACHE_KEY = "admin:overview-summary:v1";
const CACHE_TTL_SEC = 60;

const OVERVIEW_ROLES = new Set([
  "webadmin",
  "dean",
  "director",
  "hod",
  "swo",
  "coe",
  "caretaker",
  "warden",
  "security",
  "ao",
  "dsw",
]);

async function readCache(key: string): Promise<string | null> {
  try {
    return await Promise.race([
      redis.get(key),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    ]);
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: string): Promise<void> {
  try {
    await Promise.race([
      redis.setex(key, CACHE_TTL_SEC, value),
      new Promise((resolve) => setTimeout(resolve, 200)),
    ]);
  } catch {
    /* Redis is optional. The SQL result is still returned. */
  }
}

async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql, ...params);
}

/**
 * GET /profile/admin/overview-summary
 * One payload for the webadmin overview cards: campus counts, branch and
 * grievance aggregates, academic KPIs, and account counts. External schemas
 * are optional — a failure there marks that section partial instead of
 * failing the cards this service owns.
 */
export const getAdminOverviewSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const role = resolveEffectiveRole({
    role: req.user?.role,
    username: req.user?.username,
  });
  if (!req.user || !OVERVIEW_ROLES.has(role)) {
    return res.status(403).json({
      success: false,
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Insufficient hierarchy for the overview summary",
    });
  }

  const fresh = req.query.fresh === "1";
  if (!fresh) {
    const cached = await readCache(OVERVIEW_CACHE_KEY);
    if (cached) {
      try {
        return res.json(JSON.parse(cached));
      } catch {
        /* recompute */
      }
    }
  }

  try {
    const academicSql = academicsOverviewSql(ACADEMICS_SCHEMA);
    const [campusRows, branchRows, grievanceRows, academicSettled, accountSettled] =
      await Promise.all([
        queryRows<Record<string, unknown>>(campusSnapshotSql()),
        queryRows<{ branch: string; count: number }>(branchDistributionSql()),
        queryRows<{ category: string; status: string; count: number }>(
          grievanceSummarySql(),
        ),
        queryRows<Record<string, unknown>>(academicSql.semester)
          .then(async (semesters) => {
            const semester = semesters[0] || null;
            const semesterId = semester ? String(semester.id) : null;
            const counts = await queryRows<Record<string, unknown>>(
              academicSql.counts,
              [semesterId],
            );
            return { semester, counts: counts[0] || {} };
          })
          .then(
            (value) => ({ ok: true as const, value }),
            (error: unknown) => ({ ok: false as const, error }),
          ),
        queryRows<{ role: string; active: number; disabled: number }>(
          authAccountsSql(AUTH_SCHEMA),
        ).then(
          (value) => ({ ok: true as const, value }),
          (error: unknown) => ({ ok: false as const, error }),
        ),
      ]);

    const campus = campusRows[0] || {};
    const activeStudents = num(campus.active);
    let academics: Record<string, unknown> | null = null;
    if (academicSettled.ok) {
      const counts = academicSettled.value.counts;
      const registered = num(counts.registered_students);
      academics = {
        totalStudents: registered || activeStudents,
        avgGPA: numOrNull(counts.avg_gpa),
        backlogCount: num(counts.backlog_count),
        activeSemesters: num(counts.active_semesters),
        currentSemester: academicSettled.value.semester
          ? String(academicSettled.value.semester.name || "")
          : null,
      };
    } else {
      console.warn("[overview-summary] academic aggregates skipped:", academicSettled.error);
    }

    let accounts: { role: string; active: number; disabled: number }[] | null =
      null;
    if (accountSettled.ok) {
      accounts = accountSettled.value.map((row) => ({
        role: String(row.role || "unknown"),
        active: num(row.active),
        disabled: num(row.disabled),
      }));
    } else {
      console.warn("[overview-summary] account aggregates skipped:", accountSettled.error);
    }

    const payload = {
      success: true,
      data: {
        campus: {
          totalStudents: num(campus.total),
          activeStudents,
          onCampus: num(campus.on_campus),
          offCampus: num(campus.off_campus),
          suspended: num(campus.suspended),
          pendingRequests: num(campus.pending_requests),
          withBacklogs: num(campus.with_backlogs),
          withPhoto: num(campus.with_photo),
          avgCgpa: numOrNull(campus.avg_cgpa),
        },
        branches: branchRows.map((row) => ({
          branch: String(row.branch || ""),
          count: num(row.count),
        })),
        grievances: grievanceRows.map((row) => ({
          category: String(row.category || "Other"),
          status: String(row.status || "pending"),
          count: num(row.count),
        })),
        academics,
        accounts,
        partial: {
          academics: !academicSettled.ok,
          accounts: !accountSettled.ok,
        },
      },
    };

    if (academicSettled.ok && accountSettled.ok) {
      await writeCache(OVERVIEW_CACHE_KEY, JSON.stringify(payload));
    }
    return res.json(payload);
  } catch (err) {
    console.error("[overview-summary] admin error:", err);
    return res.status(500).json({
      success: false,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to load the overview summary",
    });
  }
};

/**
 * GET /profile/student/home-summary
 * Compact home cards for the signed-in student. Cached per username for 60s.
 */
export const getStudentHomeSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || resolveEffectiveRole(user) !== UserRole.STUDENT) {
    return res.status(403).json({
      success: false,
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Students only",
    });
  }

  const username = String(user.username || "")
    .replace(/"/g, "")
    .trim()
    .toUpperCase();
  if (!username) {
    return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
  }

  const cacheKey = studentHomeSummaryKey(username);
  const cached = await readCache(cacheKey);
  if (cached) {
    try {
      return res.json(JSON.parse(cached));
    } catch {
      /* recompute */
    }
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { username },
      select: {
        cgpa: true,
        totalBacklogs: true,
        branch: true,
        year: true,
        name: true,
      },
    });
    if (!profile) {
      return res.status(404).json({
        success: false,
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Profile not found",
      });
    }

    const [attendanceSettled, sgpaSettled, resultsSettled, registrationSettled, notices] =
      await Promise.all([
        queryRows<{ pct: number | null }>(studentAttendanceSql(ACADEMICS_SCHEMA), [
          username,
        ]).then(
          (rows) => ({ ok: true as const, pct: numOrNull(rows[0]?.pct) }),
          (error: unknown) => ({ ok: false as const, error }),
        ),
        queryRows<{ semester: string; sgpa: number }>(
          studentLatestSgpaSql(ACADEMICS_SCHEMA),
          [username],
        ).then(
          (rows) => ({ ok: true as const, row: rows[0] || null }),
          (error: unknown) => ({ ok: false as const, error }),
        ),
        queryRows<{ subject: string; grade: number }>(
          studentLatestResultsSql(ACADEMICS_SCHEMA),
          [username],
        ).then(
          (rows) => ({ ok: true as const, rows }),
          (error: unknown) => ({ ok: false as const, error }),
        ),
        queryRows<{
          semester_name: string;
          semester_status: string;
          subject_count: number;
        }>(studentRegistrationSql(ACADEMICS_SCHEMA), [username]).then(
          (rows) => ({ ok: true as const, row: rows[0] || null }),
          (error: unknown) => ({ ok: false as const, error }),
        ),
        queryRows<{
          id: string;
          title: string;
          content: string;
          link: string | null;
          createdAt: Date | string;
        }>(visibleNotificationsSql()).catch(() => []),
      ]);

    if (!attendanceSettled.ok) {
      console.warn("[overview-summary] student attendance skipped:", attendanceSettled.error);
    }
    if (!sgpaSettled.ok) {
      console.warn("[overview-summary] student sgpa skipped:", sgpaSettled.error);
    }
    if (!resultsSettled.ok) {
      console.warn("[overview-summary] student results skipped:", resultsSettled.error);
    }
    if (!registrationSettled.ok) {
      console.warn("[overview-summary] student registration skipped:", registrationSettled.error);
    }

    const registration = registrationStatus({
      semesterName: registrationSettled.ok
        ? registrationSettled.row?.semester_name || null
        : null,
      semesterStatus: registrationSettled.ok
        ? registrationSettled.row?.semester_status || null
        : null,
      subjectCount: registrationSettled.ok
        ? num(registrationSettled.row?.subject_count)
        : 0,
    });

    const payload = {
      success: true,
      data: {
        name: profile.name || "",
        branch: profile.branch || "",
        year: profile.year || "",
        cgpa: profile.cgpa > 0 ? Number(profile.cgpa.toFixed(2)) : null,
        backlogs: profile.totalBacklogs || 0,
        attendancePct: attendanceSettled.ok ? attendanceSettled.pct : null,
        latestSemester:
          sgpaSettled.ok && sgpaSettled.row ? String(sgpaSettled.row.semester) : null,
        latestSgpa:
          sgpaSettled.ok && sgpaSettled.row ? numOrNull(sgpaSettled.row.sgpa) : null,
        latestResults: resultsSettled.ok
          ? resultsSettled.rows.map((row) => ({
              subject: String(row.subject || "Subject"),
              grade: num(row.grade),
            }))
          : [],
        registration: {
          semesterName: registrationSettled.ok
            ? registrationSettled.row?.semester_name || null
            : null,
          status: registrationSettled.ok
            ? registrationSettled.row?.semester_status || null
            : null,
          registered: registration.registered,
          subjectCount: registrationSettled.ok
            ? num(registrationSettled.row?.subject_count)
            : 0,
          label: registration.label,
          detail: registration.detail,
          empty: registration.empty || !registrationSettled.ok,
        },
        notifications: notices.map((row) => ({
          id: String(row.id),
          title: String(row.title || "Campus update"),
          content: String(row.content || ""),
          link: row.link || null,
          createdAt:
            row.createdAt instanceof Date
              ? row.createdAt.toISOString()
              : String(row.createdAt || ""),
        })),
        partial: {
          attendance: !attendanceSettled.ok,
          results: !sgpaSettled.ok || !resultsSettled.ok,
          registration: !registrationSettled.ok,
        },
      },
    };

    await writeCache(cacheKey, JSON.stringify(payload));
    return res.json(payload);
  } catch (err) {
    console.error("[overview-summary] student error:", err);
    return res.status(500).json({
      success: false,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to load your overview",
    });
  }
};
