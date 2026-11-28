import { Router } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma.util";
import { redis } from "../utils/redis.util";
import { routerRateLimiter } from "../middlewares/router-limiter";

const router = Router();
router.use(routerRateLimiter);

const ADMIN_SUMMARY_TTL_SEC = 60;

type GradeStatsRow = {
  avg_grade: number | null;
  grade_count: number;
  fail_count: number;
};
type AttendanceStatsRow = {
  student_count: number;
  low_count: number;
  avg_pct: number | null;
};
type RegistrationStatsRow = {
  registered: number;
  dropped: number;
};

/**
 * COUNT / AVG / GROUP BY in SQL. Replaces loading every attendance row and
 * every registered student id into Node just to count them.
 */
function academicWhere(
  semesterId: string | undefined,
  subjectIds: string[] | null,
) {
  const params: unknown[] = [];
  const where: string[] = [];
  if (semesterId) {
    params.push(semesterId);
    where.push(`"semesterId" = $${params.length}`);
  }
  // Subject filter applies to grade and attendance only. Registration counts
  // stay semester-wide, matching the previous groupBy (semesterId + status).
  if (subjectIds) {
    if (subjectIds.length === 0) {
      where.push("FALSE");
    } else {
      params.push(subjectIds);
      where.push(`"subjectId" = ANY($${params.length}::text[])`);
    }
  }
  return {
    params,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

async function aggregateAcademics(
  semesterId: string | undefined,
  subjectIds: string[] | null,
) {
  const graded = academicWhere(semesterId, subjectIds);
  const registered = academicWhere(semesterId, null);

  const [grades, attendance, registration] = await Promise.all([
    prisma.$queryRawUnsafe<GradeStatsRow[]>(
      `SELECT
         AVG("grade")::float AS avg_grade,
         COUNT(*)::int AS grade_count,
         COUNT(*) FILTER (WHERE "grade" < 5)::int AS fail_count
       FROM "Grade"
       ${graded.whereSql}`,
      ...graded.params,
    ),
    prisma.$queryRawUnsafe<AttendanceStatsRow[]>(
      `WITH per_student AS (
         SELECT "studentId",
                SUM("totalClasses") AS total,
                SUM("attendedClasses") AS attended
         FROM "Attendance"
         ${graded.whereSql}
         GROUP BY "studentId"
       )
       SELECT
         COUNT(*) FILTER (WHERE total > 0)::int AS student_count,
         COUNT(*) FILTER (WHERE total > 0 AND attended::float / total < 0.75)::int AS low_count,
         AVG((attended::float / NULLIF(total, 0)) * 100) FILTER (WHERE total > 0)::float AS avg_pct
       FROM per_student`,
      ...graded.params,
    ),
    semesterId
      ? prisma.$queryRawUnsafe<RegistrationStatsRow[]>(
          `SELECT
             COUNT(DISTINCT "studentId") FILTER (WHERE status = 'REGISTERED')::int AS registered,
             COUNT(DISTINCT "studentId") FILTER (WHERE status = 'DROPPED')::int AS dropped
           FROM "Registration"
           ${registered.whereSql}`,
          ...registered.params,
        )
      : Promise.resolve([{ registered: 0, dropped: 0 }] as RegistrationStatsRow[]),
  ]);

  return {
    grade: grades[0] || { avg_grade: null, grade_count: 0, fail_count: 0 },
    attendance: attendance[0] || { student_count: 0, low_count: 0, avg_pct: null },
    registration: registration[0] || { registered: 0, dropped: 0 },
  };
}

/**
 * GET /analytics/admin-summary?role=dean&department=CSE
 *
 * Returns role-tailored academic KPIs aggregated from the Prisma DB.
 * Roles: dean, hod, webadmin, coe, director, swo, caretaker, warden
 */
router.get("/admin-summary", async (req: AuthenticatedRequest, res) => {
  try {
    const role = ((req.query.role as string) || "webadmin").toLowerCase();
    const department = (req.query.department as string) || undefined;

    // Dashboards poll this repeatedly; there are only a handful of distinct
    // (role, department) combinations, so a 60s cache collapses the heavy
    // aggregation to at most one run per combo per window.
    const cacheKey = `analytics:admin-summary:${role}:${department || "all"}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));

    const latestSemester = await prisma.academicSemester.findFirst({
      where: { status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
    });
    const semesterId = latestSemester?.id;

    const [totalSubjects, activeSemesters, totalFaculty] = await Promise.all([
      prisma.subject.count(),
      prisma.academicSemester.count({ where: { status: { not: "DRAFT" } } }),
      prisma.faculty.count(),
    ]);

    let subjectIds: string[] | null = null;
    if (role === "hod" && department) {
      const deptSubjects = await prisma.subject.findMany({
        where: { department: { equals: department, mode: "insensitive" } },
        select: { id: true },
      });
      subjectIds = deptSubjects.map((s) => s.id);
    }

    const stats = await aggregateAcademics(semesterId, subjectIds);
    const registeredStudentCount = Number(stats.registration.registered) || 0;
    const droppedStudentCount = Number(stats.registration.dropped) || 0;
    const attendanceStudentCount = Number(stats.attendance.student_count) || 0;
    const gradeCount = Number(stats.grade.grade_count) || 0;

    // "Enrolled" for the current semester = distinct registered students.
    // Fall back to attendance/grades for older semesters without registration data.
    const totalStudents =
      registeredStudentCount || attendanceStudentCount || gradeCount;

    const avgGPA =
      stats.grade.avg_grade !== null && stats.grade.avg_grade !== undefined
        ? Number(Number(stats.grade.avg_grade).toFixed(2))
        : null;
    const backlogCount = Number(stats.grade.fail_count) || 0;
    const lowAttendanceCount = Number(stats.attendance.low_count) || 0;
    const avgAttendancePct =
      stats.attendance.avg_pct !== null && stats.attendance.avg_pct !== undefined
        ? Number(Number(stats.attendance.avg_pct).toFixed(1))
        : null;

    const base = {
      totalStudents,
      totalSubjects,
      activeSemesters,
      totalFaculty,
      avgGPA,
      backlogCount,
      lowAttendanceCount,
      avgAttendancePct,
      currentSemester: latestSemester?.name || null,
      registration: {
        registered: registeredStudentCount,
        dropped: droppedStudentCount,
      },
    };

    if (role === "dean" || role === "hod" || role === "director") {
      let branchPerf: {
        department: string;
        avg_grade: number;
        student_count: number;
      }[] = [];
      try {
        if (semesterId) {
          branchPerf = await prisma.$queryRawUnsafe<
            { department: string; avg_grade: number; student_count: number }[]
          >(
            `SELECT s."department",
                    AVG(g."grade")::float AS avg_grade,
                    COUNT(DISTINCT g."studentId")::int AS student_count
             FROM "Grade" g
             JOIN "Subject" s ON g."subjectId" = s."id"
             WHERE g."semesterId" = $1
             GROUP BY s."department"
             ORDER BY avg_grade DESC`,
            semesterId,
          );
        } else {
          branchPerf = await prisma.$queryRawUnsafe<
            { department: string; avg_grade: number; student_count: number }[]
          >(
            `SELECT s."department",
                    AVG(g."grade")::float AS avg_grade,
                    COUNT(DISTINCT g."studentId")::int AS student_count
             FROM "Grade" g
             JOIN "Subject" s ON g."subjectId" = s."id"
             GROUP BY s."department"
             ORDER BY avg_grade DESC`,
          );
        }
      } catch (e) {
        console.warn("[Analytics] branchPerformance query failed:", e);
      }

      const out = {
        success: true,
        data: { ...base, branchPerformance: branchPerf },
      };
      await redis
        .setex(cacheKey, ADMIN_SUMMARY_TTL_SEC, JSON.stringify(out))
        .catch(() => {});
      return res.json(out);
    }

    const out = { success: true, data: base };
    await redis
      .setex(cacheKey, ADMIN_SUMMARY_TTL_SEC, JSON.stringify(out))
      .catch(() => {});
    return res.json(out);
  } catch (err: any) {
    console.error("[Analytics] admin-summary error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to compute analytics",
      error: err.message,
    });
  }
});

export default router;
