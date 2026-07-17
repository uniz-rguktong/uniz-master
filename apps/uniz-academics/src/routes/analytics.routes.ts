import { Router } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma.util";

const router = Router();

/**
 * GET /analytics/admin-summary?role=dean&department=CSE
 *
 * Returns role-tailored academic KPIs aggregated from the Prisma DB.
 * Roles: dean, hod, webmaster, coe, director, swo, caretaker, warden
 */
router.get("/admin-summary", async (req: AuthenticatedRequest, res) => {
  try {
    const role = ((req.query.role as string) || "webmaster").toLowerCase();
    const department = (req.query.department as string) || undefined;

    const latestSemester = await prisma.academicSemester.findFirst({
      where: { status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
    });
    const semesterId = latestSemester?.id;

    const [
      totalSubjects,
      activeSemesters,
      totalFaculty,
    ] = await Promise.all([
      prisma.subject.count(),
      prisma.academicSemester.count({ where: { status: { not: "DRAFT" } } }),
      prisma.faculty.count(),
    ]);

    const gradeWhere: Record<string, unknown> = {};
    if (semesterId) gradeWhere.semesterId = semesterId;

    const attendanceWhere: Record<string, unknown> = {};
    if (semesterId) attendanceWhere.semesterId = semesterId;

    if (role === "hod" && department) {
      const deptSubjects = await prisma.subject.findMany({
        where: { department: { equals: department, mode: "insensitive" } },
        select: { id: true },
      });
      const deptSubjectIds = deptSubjects.map((s) => s.id);
      gradeWhere.subjectId = { in: deptSubjectIds };
      attendanceWhere.subjectId = { in: deptSubjectIds };
    }

    const [gradeAgg, failCount, allAttendance, registeredStudentIds, droppedStudentIds] =
      await Promise.all([
        prisma.grade.aggregate({
          where: gradeWhere,
          _avg: { grade: true },
          _count: { id: true },
        }),
        prisma.grade.count({
          where: { ...gradeWhere, grade: { lt: 5.0 } },
        }),
        prisma.attendance.findMany({
          where: attendanceWhere,
          select: { studentId: true, totalClasses: true, attendedClasses: true },
        }),
        semesterId
          ? prisma.registration.groupBy({
              by: ["studentId"],
              where: { semesterId, status: "REGISTERED" },
            })
          : Promise.resolve([] as { studentId: string }[]),
        semesterId
          ? prisma.registration.groupBy({
              by: ["studentId"],
              where: { semesterId, status: "DROPPED" },
            })
          : Promise.resolve([] as { studentId: string }[]),
      ]);

    const distinctAttendanceStudents = new Set(
      allAttendance.map((a) => a.studentId),
    );
    const registeredStudentCount = registeredStudentIds.length;
    const droppedStudentCount = droppedStudentIds.length;

    // "Enrolled" for the current semester = distinct registered students.
    // Fall back to attendance/grades for older semesters without registration data.
    const totalStudents =
      registeredStudentCount ||
      distinctAttendanceStudents.size ||
      gradeAgg._count.id;

    const avgGPA = gradeAgg._avg.grade
      ? Number(gradeAgg._avg.grade.toFixed(2))
      : null;
    const backlogCount = failCount;

    const studentAttendanceMap = new Map<
      string,
      { total: number; attended: number }
    >();
    for (const row of allAttendance) {
      const prev = studentAttendanceMap.get(row.studentId) || {
        total: 0,
        attended: 0,
      };
      prev.total += row.totalClasses;
      prev.attended += row.attendedClasses;
      studentAttendanceMap.set(row.studentId, prev);
    }

    let lowAttendanceCount = 0;
    let totalAttendancePct = 0;
    let attendanceStudentCount = 0;
    for (const [, v] of studentAttendanceMap) {
      if (v.total > 0) {
        const pct = (v.attended / v.total) * 100;
        totalAttendancePct += pct;
        attendanceStudentCount++;
        if (pct < 75) lowAttendanceCount++;
      }
    }

    const avgAttendancePct =
      attendanceStudentCount > 0
        ? Number((totalAttendancePct / attendanceStudentCount).toFixed(1))
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
      let branchPerf: { department: string; avg_grade: number; student_count: number }[] = [];
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

      return res.json({
        success: true,
        data: { ...base, branchPerformance: branchPerf },
      });
    }

    return res.json({ success: true, data: base });
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
