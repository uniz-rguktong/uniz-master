import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ExcelJS from "exceljs";
import axios from "axios";
import prisma from "../utils/prisma.util";
import { ErrorCode } from "../shared/error-codes";

const GATEWAY_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const getHeaders = (token: string) => ({ headers: { Authorization: token } });

import { mapGradeToPoint } from "../utils/helpers.util";
import { randomUUID } from "crypto";
import { redis, notificationQueue } from "../utils/redis.util";
import { generateMotivation } from "../utils/ai.util";
import { processNextBatch } from "../services/upload.service";
import { generateResultPdf, generateAttendancePdf } from "../utils/pdf.util";

// GPA calculation and templates now use database-provided subject credits.
// GRADE_MAP and mapGradeToPoint are now imported from helpers.util
// const GRADE_MAP: Record<string, number> = {
//   EX: 10,
//   A: 9,
//   B: 8,
//   C: 7,
//   D: 6,
//   E: 5,
//   R: 0,
// };

// const mapGradeToPoint = (val: string | number): number => {
//   if (typeof val === "number") return val;
//   if (!val) return 0;
//   const upper = String(val).toUpperCase().trim();
//   return GRADE_MAP[upper] ?? (parseFloat(upper) || 0);
// };

export const getUploadProgress = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const uploadId = req.query.uploadId as string;

    if (uploadId) {
      const uploadKey = `upload:progress:${uploadId}`;
      const progressData = await redis.get(uploadKey);

      if (progressData) {
        const progress = JSON.parse(progressData);

        // --- SELF-HEALING: JUMP START STUCK JOBS ---
        // If status is 'queued' or 'processing' but no activity for > 15 seconds,
        // it means the trigger likely failed or timed out. Poke it!
        const isStuck =
          (progress.status === "queued" || progress.status === "processing") &&
          Date.now() - (progress.lastActive || 0) > 15000;

        if (isStuck) {
          console.log(
            `[Academics] 🚨 Job ${uploadId} appears stuck. Jump-starting via Progress Poll...`,
          );
          // Fire and forget a trigger request to ourselves to avoid blocking the user
          // FIX: Use localhost for internal route access, as /api/queue is not exposed via public Gateway/Nginx
          const port = process.env.PORT || 3004;
          const triggerUrl = `http://localhost:${port}/api/queue/process?lb_poll=${Math.random().toString(36).substring(7)}`;

          axios
            .post(
              triggerUrl,
              {},
              {
                headers: {
                  "x-internal-secret":
                    process.env.INTERNAL_SECRET || "uniz-core",
                },
                timeout: 2000,
              },
            )
            .catch(() => {}); // Ignore trigger errors here
        }

        return res.json({
          success: true,
          progress,
        });
      }
      return res.status(404).json({
        success: false,
        message: "Upload not found or expired",
      });
    }

    // Fallback: Check by username for backwards compatibility
    const uploadKey = `upload:progress:${user.username}`;
    const uploadProgress = await redis.get(uploadKey);
    if (uploadProgress) {
      return res.json({ success: true, progress: JSON.parse(uploadProgress) });
    }

    // Fallback to Publish Progress
    const publishKey = `publish:progress:${user.username}`;
    const publishProgress = await redis.get(publishKey);
    if (publishProgress) {
      return res.json({ success: true, progress: JSON.parse(publishProgress) });
    }

    return res.json({ success: true, progress: { status: "idle" } });
  } catch (e: any) {
    console.error("Progress fetch error:", e);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve progress at this time.",
    });
  }
};

export const getPublishProgress = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) {
    console.log("Publish progress error: No user in request");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const key = `publish:progress:${user.username}`;
    const progress = await redis.get(key);
    console.log(
      `Fetching publish progress for ${user.username}, key: ${key}, found: ${!!progress}`,
    );

    return res.status(200).json({
      success: true,
      progress: progress ? JSON.parse(progress) : { status: "idle" },
    });
  } catch (e: any) {
    console.error("Publish progress fetch error:", e);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve publish progress.",
    });
  }
};

export const getBatchGrades = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || user.role === "student")
    return res
      .status(403)
      .json({ success: false, message: "Students cannot access batch grades" });

  const {
    branch,
    year,
    semesterId,
    failedOnly,
    page = 1,
    limit = 50,
  } = req.query;
  const p = Math.max(1, Number(page));
  const l = Math.max(1, Math.min(200, Number(limit)));
  const skip = (p - 1) * l;

  try {
    let semesterIdFilter: any = undefined;
    const sem = semesterId as string;
    const y = year as string;

    if (sem && y) {
      if (sem.includes(y)) {
        semesterIdFilter = sem;
      } else {
        semesterIdFilter = `${y.toUpperCase()}-${sem.toUpperCase()}`;
      }
    } else if (sem) {
      semesterIdFilter = { endsWith: `-${sem.toUpperCase()}` };
    }

    const where: any = {
      semesterId: semesterIdFilter || undefined,
      subject: {
        department: (branch as string) || undefined,
        code: year ? { contains: `-${year}-` } : undefined,
      },
    };

    if (failedOnly === "true") {
      where.grade = { lte: 0 };
    }

    // Step 1: Get total count and paginated students
    // Optimization: Count distinct students first
    const counts = await prisma.grade.groupBy({
      by: ["studentId"],
      where,
    });
    const totalStudentsCount = counts.length;

    const studentIdsOnPageResult = await prisma.grade.findMany({
      where,
      select: { studentId: true },
      distinct: ["studentId"],
      skip,
      take: l,
      orderBy: { studentId: "asc" },
    });

    const studentIds = studentIdsOnPageResult.map((s) => s.studentId);

    // Step 2: Fetch all grades for these specific students on this page/semester
    const grades = await prisma.grade.findMany({
      where: {
        ...where,
        studentId: { in: studentIds },
      },
      select: {
        id: true,
        studentId: true,
        grade: true,
        semesterId: true,
        subject: {
          select: {
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    // Fetch student profiles for context
    let studentProfiles: any[] = [];

    try {
      if (studentIds.length > 0) {
        // OPTIMIZATION: Use internal search for batch context if possible,
        // but since user-service might be on a different Vercel instance, we use Gateway with high limit for batching.
        const profilesRes = await axios.post(
          `${GATEWAY_URL}/profile/student/search`,
          {
            branch: branch || undefined,
            year: year || undefined,
            usernames: studentIds, // Use usernames explicitly
            limit: l,
          },
          {
            ...getHeaders(req.headers.authorization || ""),
            timeout: 5000,
          },
        );
        studentProfiles = profilesRes.data.students || [];
      }
    } catch (err) {
      console.warn("Failed to fetch student profiles for batch grades:", err);
    }

    // Create a lookup map for profiles
    const profileMap = new Map(
      studentProfiles.map((p: any) => [p.username, p]),
    );

    // Group by Student
    const grouped: Record<string, any> = {};

    grades.forEach((g) => {
      if (!grouped[g.studentId]) {
        const profile = profileMap.get(g.studentId) || {};
        grouped[g.studentId] = {
          studentId: g.studentId,
          name: profile.name || "Unknown",
          branch: profile.branch || branch || "N/A",
          year: profile.year || year || "N/A",
          batch: profile.batch || "N/A",
          records: [],
        };
      }
      grouped[g.studentId].records.push({
        subjectCode: g.subject.code,
        subjectName: g.subject.name,
        grade: g.grade,
        credits: g.subject.credits,
        semesterId: g.semesterId,
        id: g.id,
      });
    });

    const studentsList = Object.values(grouped);

    return res.json({
      success: true,
      summary: {
        totalStudents: totalStudentsCount,
        pageCount: studentsList.length,
        totalRecords: grades.length,
        failedRecords: grades.filter((g) => g.grade <= 0).length,
        timestamp: new Date().toISOString(),
      },
      meta: {
        total: totalStudentsCount,
        page: p,
        limit: l,
        totalPages: Math.ceil(totalStudentsCount / l),
      },
      students: studentsList,
    });
  } catch (e: any) {
    console.error("[Academics] getBatchGrades Error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve batch grades at this time.",
    });
  }
};

export const getGrades = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false });

  const targetStudentId = (
    (req.query.studentId as string) || user.username
  ).toUpperCase();

  // Security check
  if (targetStudentId !== user.username && user.role === "student") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { semester, year } = req.query;
  const sem = semester as string;
  const y = year as string;

  try {
    const isFiltered = sem || y;
    const cacheKey = `grades:${targetStudentId.toUpperCase()}`;

    if (!isFiltered) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ ...JSON.parse(cached), source: "cache" });
      }
    }

    const where: any = {
      studentId: { equals: targetStudentId, mode: "insensitive" },
    };

    let semesterIdFilter: any = undefined;
    if (sem && y) {
      semesterIdFilter = `${y.toUpperCase()}-${sem.toUpperCase()}`;
    } else if (sem) {
      semesterIdFilter = { endsWith: `-${sem.toUpperCase()}` };
    } else if (y) {
      semesterIdFilter = { startsWith: `${y.toUpperCase()}-` };
    }

    if (semesterIdFilter) {
      where.semesterId = semesterIdFilter;
    }

    // Parallel DB Queries with Field selection
    const [grades, attendance] = await Promise.all([
      prisma.grade.findMany({
        where,
        select: {
          id: true,
          semesterId: true,
          grade: true,
          subject: {
            select: {
              code: true,
              name: true,
              credits: true,
              department: true,
            },
          },
        },
        orderBy: { semesterId: "desc" },
      }),
      prisma.attendance.findMany({
        where: {
          studentId: targetStudentId,
          semesterId: semesterIdFilter || undefined,
        },
        select: {
          id: true,
          semesterId: true,
          totalClasses: true,
          attendedClasses: true,
          subjectId: true,
        },
      }),
    ]);

    // Calculate GPA per Semester using Real-time DB Credits
    const gpaResults: Record<string, any> = {};
    const semPoints: Record<string, number> = {};
    const semCredits: Record<string, number> = {};
    const semFails: Record<string, boolean> = {};

    grades.forEach((g) => {
      const semId = g.semesterId;
      const points = g.grade;
      // Handle optional subject relation if data integrity is poor, though include ensures it.
      const credits = g.subject?.credits || 0;

      if (!semPoints[semId]) semPoints[semId] = 0;
      if (!semCredits[semId]) semCredits[semId] = 0;

      if (points === 0) semFails[semId] = true;

      semPoints[semId] += points * credits;
      semCredits[semId] += credits;
    });

    for (const semId in semCredits) {
      if (semCredits[semId] > 0) {
        const gpa = parseFloat(
          (semPoints[semId] / semCredits[semId]).toFixed(2),
        );
        gpaResults[semId] = {
          gpa,
          status: semFails[semId] ? "FAILED (R)" : "PASSED",
        };
      }
    }

    // 2. Generate AI Motivational Message
    let motivation = "";
    const motivationCacheKey = `motivation:${targetStudentId}:${semester || "all"}:${year || "all"}`;
    const cachedMotivation = await redis.get(motivationCacheKey);

    if (cachedMotivation) {
      motivation = cachedMotivation;
    } else {
      let attSummary = null;
      if (attendance.length > 0) {
        const total = attendance.reduce(
          (acc, curr) => acc + curr.totalClasses,
          0,
        );
        const attended = attendance.reduce(
          (acc, curr) => acc + curr.attendedClasses,
          0,
        );
        const percent = total > 0 ? Math.round((attended / total) * 100) : 0;
        attSummary = {
          overallPercentage: percent,
          status: percent >= 75 ? "GOOD" : "POOR",
        };
      }

      // OPTIMIZATION: Don't await the AI call.
      // Return empty motivation now, but trigger background generation to populate cache for the NEXT refresh.
      // This makes the API feel instant.
      generateMotivation(gpaResults, attSummary)
        .then((mot) => redis.setex(motivationCacheKey, 43200, mot))
        .catch((err) =>
          console.error("Background motivation failed:", err.message),
        );

      motivation = "Fetching your personalized advice... (Refresh in a moment)";
    }

    const responsePayload = {
      success: true,
      grades,
      gpa: gpaResults,
      motivation,
    };

    // 3. Set Cache (Only if no filters)
    if (!isFiltered) {
      await redis.setex(cacheKey, 3600, JSON.stringify(responsePayload));
    }

    return res.json({
      ...responsePayload,
      source: isFiltered ? "db (filtered)" : "db (calculated)",
    });
  } catch (e: any) {
    console.error("getGrades error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve academic records.",
    });
  }
};

export const addGrades = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (
    !user ||
    !["webmaster", "dean", "director"].includes(user.role as string)
  ) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { studentId: rawStudentId, semesterId, grades } = req.body;
  const studentId = String(rawStudentId || "").toUpperCase();

  try {
    // Resolve subject semesters to ensure canonical format
    const subjectIds = grades.map((g: any) => g.subjectId);
    const resolvedSubjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });
    const subMap = new Map(resolvedSubjects.map((s) => [s.id, s.semester]));

    const results = await Promise.all(
      grades.map((g: any) => {
        const canonicalSemester =
          semesterId || subMap.get(g.subjectId) || "SEM-1";
        return prisma.grade.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId,
              subjectId: g.subjectId,
              semesterId: canonicalSemester,
            },
          },
          update: { grade: g.grade, updatedAt: new Date() },
          create: {
            studentId,
            subjectId: g.subjectId,
            semesterId: canonicalSemester,
            grade: g.grade,
          },
        });
      }),
    );

    // Invalidate Cache
    await redis.del(`grades:${studentId.toUpperCase()}`);

    return res.json({ success: true, count: results.length });
  } catch (e: any) {
    if (e.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "The provided Student or Subject details are invalid.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while adding grades.",
    });
  }
};

export const bulkUpdateGrades = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { updates } = req.body; // Array of { studentId, subjectId, semesterId, grade }
  const user = req.user;

  if (
    !user ||
    !["webmaster", "dean", "director"].includes(user.role as string)
  ) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  if (!Array.isArray(updates)) {
    return res
      .status(400)
      .json({ success: false, message: "updates must be an array" });
  }

  try {
    // Pre-fetch all needed subjects to avoid N+1 queries during resolution
    const subjectCodes = updates.map((u) => u.subjectId);
    const subjects = await prisma.subject.findMany({
      where: {
        OR: [{ id: { in: subjectCodes } }, { code: { in: subjectCodes } }],
      },
    });

    const subjectMap = new Map();
    subjects.forEach((s) => {
      subjectMap.set(s.id, s);
      subjectMap.set(s.code, s);
    });

    const results = await Promise.all(
      updates.map(async (u) => {
        const subject = subjectMap.get(u.subjectId);

        if (!subject) {
          throw new Error(`Subject [${u.subjectId}] not found.`);
        }

        const resolvedSubjectId = subject.id;
        const canonicalSemester = u.semesterId || subject.semester || "SEM-1";

        const pointValue = mapGradeToPoint(u.grade);
        if (pointValue < 0 || pointValue > 10) {
          throw new Error(
            `Invalid grade point ${pointValue} for ${u.studentId}`,
          );
        }

        const studentId = String(u.studentId || "").toUpperCase();
        const batch = studentId.substring(0, 3);

        // 1. Find all existing grade entries for this student and subject
        const existingGrades = await prisma.grade.findMany({
          where: {
            studentId,
            subjectId: resolvedSubjectId,
          },
        });

        // Target Record: the one that HAS the correct canonical semesterID
        const canonicalMatch = existingGrades.find(
          (g) => g.semesterId === canonicalSemester,
        );

        if (canonicalMatch) {
          // If we found a canonical record, we update it.
          // ALSO delete any "ghost" records that might exist in wrong buckets (like E2-SEM-1)
          // to keep the unique constraint and GPA summary clean.
          if (existingGrades.length > 1) {
            await prisma.grade.deleteMany({
              where: {
                studentId,
                subjectId: resolvedSubjectId,
                id: { not: canonicalMatch.id },
              },
            });
          }

          return prisma.grade.update({
            where: { id: canonicalMatch.id },
            data: { grade: pointValue, batch, updatedAt: new Date() },
          });
        } else if (existingGrades.length > 0) {
          // If no canonical record exists but "alternate" ones do (e.g. user previously manually added E2-SEM-1):
          // Pick one to "fix" into the canonical format, and delete the rest.
          const targetId = existingGrades[0].id;

          await prisma.grade.deleteMany({
            where: {
              studentId,
              subjectId: resolvedSubjectId,
              id: { not: targetId },
            },
          });

          return prisma.grade.update({
            where: { id: targetId },
            data: {
              semesterId: canonicalSemester,
              grade: pointValue,
              batch,
              updatedAt: new Date(),
            },
          });
        } else {
          // CREATE new record if none exist at all
          return prisma.grade.create({
            data: {
              studentId,
              subjectId: resolvedSubjectId,
              semesterId: canonicalSemester,
              grade: pointValue,
              batch,
            },
          });
        }
      }),
    );

    // Clear relevant caches (Safe operation)
    try {
      const uniqueStudentIds = [
        ...new Set(updates.map((u) => String(u.studentId || "").toUpperCase())),
      ];
      for (const sid of uniqueStudentIds) {
        await redis.del(`grades:${sid}`);
      }
    } catch (redisErr) {
      console.warn("Cache invalidation skipped (Redis unreachable)");
    }

    return res.json({
      success: true,
      message: `Successfully updated ${results.length} records`,
      count: results.length,
    });
  } catch (e: any) {
    if (e.code === "P2003") {
      // Foreign Key Violation
      return res.status(400).json({
        success: false,
        message: "Cannot update grades: One or more IDs provided are invalid.",
      });
    }
    // Handle custom thrown errors (like "Subject not found")
    if (e instanceof Error) {
      return res.status(400).json({ success: false, message: e.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Bulk grade update failed." });
  }
};

export const getAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false });

  const targetStudentId = (
    (req.query.studentId as string) || user.username
  ).toUpperCase();

  // Security check
  if (targetStudentId !== user.username && user.role === "student") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const { semester, year } = req.query;
    const sem = semester as string;
    const y = year as string;

    const where: any = {
      studentId: { equals: targetStudentId, mode: "insensitive" },
    };

    let semesterIdFilter: any = undefined;
    if (sem && y) {
      semesterIdFilter = `${y.toUpperCase()}-${sem.toUpperCase()}`;
    } else if (sem) {
      semesterIdFilter = { endsWith: `-${sem.toUpperCase()}` };
    } else if (y) {
      semesterIdFilter = { startsWith: `${y.toUpperCase()}-` };
    }

    if (semesterIdFilter) {
      where.semesterId = semesterIdFilter;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: { subject: true },
      orderBy: { semesterId: "desc" },
    });

    // Calculate summaries and percentages
    const attendanceWithInsights = attendance.map((a) => ({
      ...a,
      percentage:
        a.totalClasses > 0
          ? parseFloat(((a.attendedClasses / a.totalClasses) * 100).toFixed(2))
          : 0,
    }));

    const summary: Record<string, any> = {};
    attendance.forEach((a) => {
      if (!summary[a.semesterId]) {
        summary[a.semesterId] = { total: 0, attended: 0 };
      }
      summary[a.semesterId].total += a.totalClasses;
      summary[a.semesterId].attended += a.attendedClasses;
    });

    for (const sem in summary) {
      summary[sem].percentage =
        summary[sem].total > 0
          ? parseFloat(
              ((summary[sem].attended / summary[sem].total) * 100).toFixed(2),
            )
          : 0;
    }

    return res.json({
      success: true,
      attendance: attendanceWithInsights,
      summary,
    });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const addAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (
    !user ||
    !["webmaster", "dean", "director"].includes(user.role as string)
  ) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  const { subjectId, records } = req.body;

  if (!Array.isArray(records)) {
    return res
      .status(400)
      .json({ success: false, message: "records must be an array" });
  }

  try {
    // Validation
    for (const r of records) {
      if (r.attended < 0 || r.total < 0) {
        return res.status(400).json({
          success: false,
          message: "Attendance values cannot be negative",
        });
      }
      if (r.attended > r.total) {
        return res.status(400).json({
          success: false,
          message: "Attended classes cannot exceed total classes",
        });
      }
    }

    const results = await Promise.all(
      records.map((r: any) =>
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId: r.studentId,
              subjectId,
              semesterId: r.semesterId || "CURRENT",
            },
          },
          update: { attendedClasses: r.attended, totalClasses: r.total },
          create: {
            studentId: r.studentId,
            subjectId,
            semesterId: r.semesterId || "CURRENT",
            attendedClasses: r.attended,
            totalClasses: r.total,
          },
        }),
      ),
    );
    return res.json({ success: true, count: results.length });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const publishResults = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (
    !user ||
    !["webmaster", "director", "dean"].includes(user.role as string)
  ) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const { semesterId, year } = req.body;

  // Validation
  const validYears = ["E1", "E2", "E3", "E4"];
  const validSems = ["SEM-1", "SEM-2"];

  if (!semesterId || !validSems.includes(semesterId.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid or missing semesterId. Valid values are: SEM-1, SEM-2",
    });
  }

  if (!year || !validYears.includes(year.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid or missing year. Valid values are: E1, E2, E3, E4",
    });
  }

  const authHeader = req.headers.authorization as string;

  // Background process
  const processPublishing = async () => {
    try {
      console.log(`[GRADES-PUBLISH] Starting for ${semesterId}, Year: ${year}`);
      const cleanYear = year
        ? String(year).toUpperCase().replace(/^0/, "O")
        : undefined;

      const where: any = {};

      // Smart semester matching
      if (semesterId && cleanYear) {
        // If both are provided, we check if semesterId already contains the year
        if (semesterId.toUpperCase().includes(cleanYear)) {
          where.semesterId = semesterId.toUpperCase();
        } else {
          // Try both padded and separate
          where.OR = [
            { semesterId: semesterId.toUpperCase(), batch: cleanYear },
            { semesterId: `${cleanYear}-${semesterId.toUpperCase()}` },
          ];
        }
      } else if (semesterId) {
        where.semesterId = { endsWith: semesterId.toUpperCase() };
      } else if (cleanYear) {
        where.batch = cleanYear;
      }

      const displaySemester =
        cleanYear && semesterId && !semesterId.toUpperCase().includes(cleanYear)
          ? `${cleanYear} ${semesterId.toUpperCase()}`
          : semesterId.toUpperCase();

      if (year && !where.OR) {
        where.subject = {
          code: { contains: `-${year.toUpperCase()}-` },
        };
      }

      // 1. Fetch ALL grades for the target slice
      console.log(
        `[Publish] Fetching grades for ${semesterId}, Year: ${year || "All"}...`,
      );

      const grades = await prisma.grade.findMany({
        where,
        include: { subject: true },
      });

      if (grades.length === 0) {
        await redis.setex(
          `publish:progress:${user.username}`,
          3600,
          JSON.stringify({
            status: "done",
            total: 0,
            sent: 0,
            percent: 100,
            message: "No records found for the specified filters.",
          }),
        );
        return;
      }

      // 2. Fetch Student Profiles in Bulk (Optimization)
      console.log(
        `[Publish] Fetching student profiles in bulk for ${year || "All"}...`,
      );
      let profilesMap: Record<string, any> = {};
      try {
        const searchBody: any = { limit: 10000 };
        if (year) searchBody.year = year;

        const searchRes = await axios.post(
          `${GATEWAY_URL}/profile/student/search`,
          searchBody,
          {
            headers: { Authorization: authHeader },
          },
        );

        if (searchRes.data && searchRes.data.success) {
          searchRes.data.students.forEach((s: any) => {
            profilesMap[s.username] = s;
          });
        }
      } catch (err: any) {
        console.warn(
          `[Publish] Bulk profile fetch failed, falling back to defaults: ${err.message}`,
        );
      }

      // 3. Group by Student
      const studentGrades: Record<string, typeof grades> = {};
      grades.forEach((g) => {
        if (!studentGrades[g.studentId]) studentGrades[g.studentId] = [];
        studentGrades[g.studentId].push(g);
      });

      const students = Object.keys(studentGrades);
      const total = students.length;
      console.log(`[Publish] Starting email dispatch for ${total} students...`);

      // Initialize Progress
      await redis.setex(
        `publish:progress:${user.username}`,
        3600,
        JSON.stringify({
          status: "processing",
          total,
          sent: 0,
          percent: 0,
          semesterId: displaySemester,
        }),
      );

      // 4. Send Emails via Microservice
      let sentCount = 0;
      const chunkSize = 50; // Optimized for Redis queue throughput

      for (let i = 0; i < total; i += chunkSize) {
        const batch = students.slice(i, i + chunkSize);
        await Promise.all(
          batch.map(async (studentId) => {
            const email = `${studentId.toLowerCase()}@rguktong.ac.in`;
            const profile = profilesMap[studentId];

            const name = profile?.name || "Student";
            const branch = profile?.branch || "General";
            const campus = "Ongole";

            try {
              // Push to Queue (Fire and Forget)
              const job = await notificationQueue.add(
                "RESULTS",
                {
                  username: studentId,
                  name,
                  branch,
                  campus,
                  semesterId: displaySemester,
                  grades: studentGrades[studentId],
                },
                {
                  removeOnComplete: true,
                  attempts: 5,
                  backoff: {
                    type: "exponential",
                    delay: 10_000,
                  },
                },
              );

              sentCount++;
              console.log(
                `[Publish] Queued RESULTS email job for ${studentId} -> ${email} (jobId=${job.id}, attempts=${job.opts.attempts})`,
              );
            } catch (e: any) {
              console.error(
                `[Publish] Failed to queue RESULTS email for ${studentId}: ${e.message}`,
              );
            }
          }),
        );

        // Update Progress in Redis
        const currentProcessed = Math.min(i + chunkSize, total);
        await redis.setex(
          `publish:progress:${user.username}`,
          3600,
          JSON.stringify({
            status: currentProcessed >= total ? "done" : "processing",
            total,
            sent: sentCount,
            percent: Math.round((currentProcessed / total) * 100),
            semesterId: displaySemester,
          }),
        );
      }
      console.log(`[Publish] Completed. Sent: ${sentCount}/${total}`);
    } catch (err: any) {
      console.error("[Publish] Fatal Error:", err);
      await redis.setex(
        `publish:progress:${user.username}`,
        300,
        JSON.stringify({
          status: "failed",
          message: err.message,
        }),
      );
    }
  };

  await processPublishing();

  return res.json({
    success: true,
    message: "Result publishing started in background.",
    target: {
      semesterId,
      year: year ? String(year).replace(/^0/, "O") : "All",
    },
  });
};

export const publishAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { semesterId, year, branch } = req.body;
  const user = req.user;
  const authHeader = req.headers.authorization;

  // Validation
  const validYears = ["E1", "E2", "E3", "E4"];
  const validSems = ["SEM-1", "SEM-2"];

  if (!semesterId || !validSems.includes(semesterId.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid or missing semesterId. Valid values are: SEM-1, SEM-2",
    });
  }

  if (!year || !validYears.includes(year.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid or missing year. Valid values are: E1, E2, E3, E4",
    });
  }

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const processPublishing = async () => {
    try {
      console.log(
        `[ATTENDANCE-PUBLISH] Starting for ${semesterId}, Year: ${year}`,
      );
      const cleanYear = year
        ? String(year).toUpperCase().replace(/^0/, "O")
        : undefined;

      const where: any = {};

      if (semesterId && cleanYear) {
        if (semesterId.toUpperCase().includes(cleanYear)) {
          where.semesterId = semesterId.toUpperCase();
        } else {
          where.OR = [
            { semesterId: semesterId.toUpperCase(), batch: cleanYear },
            { semesterId: `${cleanYear}-${semesterId.toUpperCase()}` },
          ];
        }
      } else if (semesterId) {
        where.semesterId = { endsWith: semesterId.toUpperCase() };
      } else if (cleanYear) {
        where.batch = cleanYear;
      }

      const displaySemester =
        cleanYear && semesterId && !semesterId.includes(cleanYear)
          ? `${cleanYear} ${semesterId.toUpperCase()}`
          : semesterId.toUpperCase();

      if (branch) {
        where.subject = {
          department: branch,
        };
      }

      console.log(
        `[ATTENDANCE-PUBLISH] Querying DB with where: ${JSON.stringify(where)}`,
      );
      // 1. Fetch data
      const attendance = await prisma.attendance.findMany({
        where,
        include: { subject: true },
      });

      console.log(
        `[ATTENDANCE-PUBLISH] Found ${attendance.length} records in DB`,
      );

      if (attendance.length === 0) {
        console.log(
          `[ATTENDANCE-PUBLISH] No records found for ${JSON.stringify(where)}`,
        );
        await redis.setex(
          `publish:progress:${user.username}`,
          3600,
          JSON.stringify({
            status: "done",
            type: "attendance",
            total: 0,
            sent: 0,
            percent: 100,
            semesterId: displaySemester,
            message: "No attendance records found for the specified filters.",
          }),
        );
        return;
      }

      // 2. Fetch Profiles for metadata
      const studentIds = [...new Set(attendance.map((a) => a.studentId))];
      const profilesMap: Record<string, any> = {};

      try {
        const searchRes = await axios.post(
          `${GATEWAY_URL}/profile/student/search`,
          {
            userIds: studentIds,
            limit: 1000,
          },
          {
            headers: { Authorization: authHeader },
          },
        );

        if (searchRes.data && searchRes.data.success) {
          searchRes.data.students.forEach((s: any) => {
            profilesMap[s.username] = s;
          });
        }
      } catch (err: any) {
        console.warn(`[Publish-Att] Bulk profile fetch failed: ${err.message}`);
      }

      // 3. Group by Student
      const studentAttendance: Record<string, typeof attendance> = {};
      attendance.forEach((a) => {
        if (!studentAttendance[a.studentId])
          studentAttendance[a.studentId] = [];
        studentAttendance[a.studentId].push(a);
      });

      const students = Object.keys(studentAttendance);
      const total = students.length;
      console.log(
        `[ATTENDANCE-PUBLISH] Loaded ${attendance.length} attendance rows for ${total} students (semester=${displaySemester}, year=${
          cleanYear || "ALL"
        }, branch=${branch || "ALL"})`,
      );

      // Initialize Progress
      await redis.setex(
        `publish:progress:${user.username}`,
        3600,
        JSON.stringify({
          status: "processing",
          type: "attendance",
          total,
          sent: 0,
          percent: 0,
          semesterId: displaySemester,
        }),
      );

      // 4. Send Emails via Queue
      let sentCount = 0;
      const chunkSize = 50;

      for (let i = 0; i < total; i += chunkSize) {
        const batch = students.slice(i, i + chunkSize);

        // Parallel dispatch with error handling per item
        await Promise.all(
          batch.map(async (studentId) => {
            const email = `${studentId.toLowerCase()}@rguktong.ac.in`;
            const profile = profilesMap[studentId];

            try {
              const job = await notificationQueue.add(
                "ATTENDANCE_REPORT",
                {
                  username: studentId,
                  name: profile?.name || "Student",
                  branch: profile?.branch || "General",
                  campus: "Ongole",
                  semesterId: displaySemester,
                  records: studentAttendance[studentId],
                },
                {
                  removeOnComplete: true,
                  attempts: 5,
                  backoff: {
                    type: "exponential",
                    delay: 10_000,
                  },
                },
              );

              sentCount++;
              console.log(
                `[Publish-Att] Queued ATTENDANCE_REPORT job for ${studentId} -> ${email} (jobId=${job.id})`,
              );
            } catch (e: any) {
              console.error(
                `[Publish-Att] Failed to queue ATTENDANCE_REPORT job for ${studentId}: ${e.message}`,
              );
            }
          }),
        );

        const currentProcessed = Math.min(i + chunkSize, total);
        await redis.setex(
          `publish:progress:${user.username}`,
          3600,
          JSON.stringify({
            status: currentProcessed >= total ? "done" : "processing",
            type: "attendance",
            total,
            sent: sentCount,
            percent: Math.round((currentProcessed / total) * 100),
            semesterId: displaySemester,
          }),
        );
      }
      console.log(
        `[ATTENDANCE-PUBLISH] Completed dispatch. Sent: ${sentCount}/${total} (semester=${displaySemester})`,
      );
    } catch (err: any) {
      console.error("[Publish-Att] Fatal Error:", err);
      await redis.setex(
        `publish:progress:${user.username}`,
        300,
        JSON.stringify({
          status: "failed",
          type: "attendance",
          message: err.message,
          semesterId: semesterId?.toUpperCase?.() ?? semesterId,
        }),
      );
    }
  };

  // Run in background (awaiting here to ensure reliability in dev/lambdas)
  await processPublishing();

  return res.json({
    success: true,
    message: "Attendance result publishing completed.",
    target: {
      semesterId,
      year: year ? String(year).replace(/^0/, "O") : "All",
    },
  });
};

export const getSubjects = async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10, search, department, semester } = req.query;
  const p = Math.max(1, Number(page));
  const l = Math.max(1, Math.min(100, Number(limit)));
  const skip = (p - 1) * l;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { code: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (department && department !== "ALL")
      where.department = department as string;
    if (semester && semester !== "ALL") where.semester = semester as string; // Exact match for year-sem structure

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: l,
        orderBy: [{ semester: "asc" }, { code: "asc" }],
      }),
      prisma.subject.count({ where }),
    ]);

    return res.json({
      success: true,
      subjects,
      meta: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (e) {
    console.error("[Academics] getSubjects Error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch subjects" });
  }
};
export const addSubject = async (req: AuthenticatedRequest, res: Response) => {
  const { code, name, credits, department, semester } = req.body;
  const user = req.user;

  // Only Webmaster or Dean/Director can add/update subjects
  const allowed = ["webmaster", "dean", "director"];
  if (!user || !allowed.includes(user.role as string)) {
    return res.status(403).json({
      success: false,
      message: "Only administrators can manage subjects",
    });
  }

  if (!code || !name || !credits || !department || !semester) {
    return res.status(400).json({
      success: false,
      message:
        "All fields (code, name, credits, department, semester) are required",
    });
  }

  // Validate semester format for subjects. Only allow canonical forms:
  // E1-SEM-1, E1-SEM-2, ..., E4-SEM-1, E4-SEM-2
  const validSemesters = [
    "E1-SEM-1",
    "E1-SEM-2",
    "E2-SEM-1",
    "E2-SEM-2",
    "E3-SEM-1",
    "E3-SEM-2",
    "E4-SEM-1",
    "E4-SEM-2",
  ];

  if (!validSemesters.includes(String(semester).toUpperCase())) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid semester code. Allowed values are: " +
        validSemesters.join(", "),
    });
  }

  try {
    const subject = await prisma.subject.upsert({
      where: { code },
      update: { name, credits: Number(credits), department, semester },
      create: { code, name, credits: Number(credits), department, semester },
    });
    return res.json({ success: true, subject });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: "Unable to add or update the subject at this moment.",
    });
  }
};

export const updateSubject = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const { code, name, credits, department, semester } = req.body;
  const user = req.user;

  const allowed = ["webmaster", "dean", "director"];
  if (!user || !allowed.includes(user.role as string)) {
    return res.status(403).json({
      success: false,
      message: "Only administrators can manage subjects",
    });
  }

  try {
    const subject = await prisma.subject.update({
      where: { id },
      data: {
        code,
        name,
        credits: credits ? Number(credits) : undefined,
        department,
        semester,
      },
    });
    return res.json({ success: true, subject });
  } catch (e: any) {
    console.error("[Academics] updateSubject Error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update subject" });
  }
};

export const deleteSubject = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;

  const allowed = ["webmaster", "dean", "director"];
  if (!user || !allowed.includes(user.role as string)) {
    return res.status(403).json({
      success: false,
      message: "Only administrators can manage subjects",
    });
  }

  try {
    await prisma.subject.delete({ where: { id } });
    return res.json({ success: true, message: "Subject deleted successfully" });
  } catch (e: any) {
    console.error("[Academics] deleteSubject Error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete subject" });
  }
};

// --- EXCEL TEMPLATES & BULK IMPORTS ---

const generateExcel = async (
  headers: string[][],
  filename: string,
  res: Response,
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Template");

  headers.forEach((row) => {
    worksheet.addRow(row);
  });

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1A237E" }, // Deep Navy
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Style data rows and set widths
  worksheet.columns.forEach((col: any) => {
    col.width = 25;
    col.alignment = { vertical: "middle", horizontal: "left" };
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);

  const buffer = await workbook.xlsx.writeBuffer();
  return res.send(buffer);
};

export const getGradesTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, year, semesterId, subjectCode, remedialsOnly } = req.query;
  const token = req.headers.authorization;

  try {
    let students: any[] = [];
    const headers = [
      [
        "Student ID",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Semester ID",
        "Grade (EX, A, B, C, D, E, R)",
      ],
    ];

    if (remedialsOnly === "true" && subjectCode) {
      const subject = await prisma.subject.findUnique({
        where: { code: subjectCode as string },
      });
      if (!subject)
        return res.status(404).json({ message: "Subject not found" });

      const failures = await prisma.grade.findMany({
        where: {
          subjectId: subject.id,
          grade: 0,
          semesterId: semesterId as string,
        },
      });
      students = failures.map((f) => ({
        username: f.studentId,
        name: "REMEDIAL STUDENT",
      }));
    } else {
      const profilesRes = await axios.post(
        `${GATEWAY_URL}/profile/student/search`,
        {
          branch,
          year,
          limit: 10000, // High limit for all students
        },
        getHeaders(token!),
      );
      students = profilesRes.data.students || [];
    }

    // Fetch matching subjects if not specific
    const subjects = await prisma.subject.findMany({
      where: {
        department: (branch as string) || undefined,
        semester: (semesterId as string) || undefined,
        code: { startsWith: (year as string) || undefined },
      },
    });

    const activeSubjects = subjectCode
      ? subjects.filter((s) => s.code === subjectCode)
      : subjects;

    students.forEach((s: any) => {
      activeSubjects.forEach((sub) => {
        headers.push([
          s.username,
          s.name,
          sub.code,
          sub.name,
          (semesterId as string) || sub.semester,
          "",
        ]);
      });
    });

    return generateExcel(headers, `Grades_Template_${year}_${branch}`, res);
  } catch (e: any) {
    return res.status(500).json({
      message:
        "An internal error occurred while generating the template. Please try again.",
    });
  }
};

export const uploadGrades = async (req: any, res: Response) => {
  const user = req.user;
  if (!req.file)
    return res.status(400).json({ message: "Excel file required" });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return res.status(400).json({ message: "Empty file" });

    const rows: any[] = [];
    const headerRow = worksheet.getRow(1);
    const colCount = worksheet.columnCount;
    const headers: string[] = [];
    for (let i = 1; i <= colCount; i++) {
      const cell = headerRow.getCell(i);
      headers.push(cell.value ? String(cell.value).trim() : "");
    }

    // Header Validation
    const requiredHeaders = [
      "Student ID",
      "Subject Code",
      "Semester ID",
      "Grade (EX, A, B, C, D, E, R)",
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid Excel format. Missing required columns: ${missingHeaders.join(", ")}`,
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      for (let i = 1; i <= colCount; i++) {
        const header = headers[i - 1];
        if (header) {
          const val = row.getCell(i).value;
          rowData[header] =
            val && typeof val === "object" && "text" in val
              ? (val as any).text
              : String(val ?? "").trim();
        }
      }
      rows.push(rowData);
    });

    const total = rows.length;
    // If rows > 2000, consider chunking or storing in Blob storage.
    // Assuming < 2000 rows as per requirements.

    // Create Job Payload
    const uploadId = randomUUID();
    const job = {
      jobId: uploadId, // Use uploadId as jobId for consistency
      uploadId, // Add explicit uploadId field
      type: "GRADES",
      rows,
      total,
      user: { username: user.username }, // Minimal user info needed
      filename: req.file.originalname,
      createdAt: Date.now(),
    };

    // Initialize Progress in Redis using uploadId
    await redis.setex(
      `upload:progress:${uploadId}`,
      3600, // 1 hour TTL
      JSON.stringify({
        uploadId,
        status: "queued",
        type: "grades",
        username: user.username,
        filename: req.file.originalname,
        processed: 0,
        total,
        success: 0,
        fail: 0,
        percent: 0,
        etaSeconds: 0,
        lastActive: Date.now(),
      }),
    );

    // Enqueue
    await redis.rpush("job:queue", JSON.stringify(job));

    // START PROCESSING IMMEDIATELY (Reliable start on Vercel)
    // We process the first batch in the current request context AND await it.
    // This ensures the progress is updated and the recursive trigger is fired
    // before the serverless function terminates.
    console.log(
      `[Academics] Starting first batch for ${user.username} inline...`,
    );
    try {
      const result = await processNextBatch();

      // If there are more batches, trigger the queue worker to continue
      if (result && result.status === "continued") {
        const protocol = req.protocol || "http";
        const host = req.get("host");
        let url = `${protocol}://${host}/api/queue/process`;

        // Local development gateway handling
        if (
          host?.includes("localhost:3000") ||
          host?.includes("127.0.0.1:3000")
        ) {
          url = `${protocol}://${host}/api/v1/academics/api/queue/process`;
        }

        const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

        // Loop Buster: Add random param to avoid 508 Loop Detected
        const triggerUrl = `${url}?lb=${Math.random().toString(36).substring(7)}`;

        // Fire and forget trigger to background the processing
        axios
          .post(
            triggerUrl,
            {},
            {
              headers: { "x-internal-secret": INTERNAL_SECRET },
              timeout: 5000,
            },
          )
          .catch((err) =>
            console.warn(
              `[Academics] Background trigger poke (Grades): ${err.message}`,
            ),
          );

        // Increased delay to ensure request is dispatched and proxy "rests"
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(`[Academics] Successfully triggered queue worker`);
      }
    } catch (e) {
      console.error("First batch inline error:", e);
    }

    return res.status(202).json({
      success: true,
      message: "Bulk grades ingestion started.",
      uploadId,
      total,
      monitor_url: `/academics/upload/progress?uploadId=${uploadId}`,
    });
  } catch (e: any) {
    console.error("Upload setup error:", e);
    return res
      .status(500)
      .json({ message: "Failed to process the upload request." });
  }
};

export const getAttendanceTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, year, semesterId } = req.query;
  const token = req.headers.authorization;

  try {
    const profilesRes = await axios.post(
      `${GATEWAY_URL}/profile/student/search`,
      {
        branch,
        year,
        limit: 10000,
      },
      getHeaders(token!),
    );

    const students = profilesRes.data.students || [];
    const headers = [
      [
        "Student ID",
        "Student Name",
        "Subject Code",
        "Subject Name",
        "Semester ID",
        "Total Classes Occurred",
        "Total Classes Attended",
      ],
    ];

    // Fetch matching subjects
    const subjects = await prisma.subject.findMany({
      where: {
        department: (branch as string) || undefined,
        semester: (semesterId as string) || undefined,
        code: { startsWith: (year as string) || undefined },
      },
    });

    students.forEach((s: any) => {
      subjects.forEach((sub) => {
        headers.push([
          s.username,
          s.name,
          sub.code,
          sub.name,
          (semesterId as string) || sub.semester,
          "",
          "",
        ]);
      });
    });

    return generateExcel(headers, `Attendance_Template_${year}_${branch}`, res);
  } catch (e: any) {
    return res
      .status(500)
      .json({ message: "Unable to generate the attendance template." });
  }
};

export const uploadAttendance = async (req: any, res: Response) => {
  const user = req.user;
  if (!req.file)
    return res.status(400).json({ message: "Excel file required" });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return res.status(400).json({ message: "Empty file" });

    const rows: any[] = [];
    const headerRow = worksheet.getRow(1);
    const colCount = worksheet.columnCount;
    const headers: string[] = [];
    for (let i = 1; i <= colCount; i++) {
      const cell = headerRow.getCell(i);
      headers.push(cell.value ? String(cell.value).trim() : "");
    }

    // Header Validation
    const requiredHeaders = [
      "Student ID",
      "Subject Code",
      "Semester ID",
      "Total Classes Occurred",
      "Total Classes Attended",
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid Excel format. Missing required columns: ${missingHeaders.join(", ")}`,
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData: any = {};
      for (let i = 1; i <= colCount; i++) {
        const header = headers[i - 1];
        if (header) {
          const val = row.getCell(i).value;
          rowData[header] =
            val && typeof val === "object" && "text" in val
              ? (val as any).text
              : String(val ?? "").trim();
        }
      }
      rows.push(rowData);
    });

    const total = rows.length;

    // Create Job Payload
    const uploadId = randomUUID();
    const job = {
      jobId: uploadId,
      uploadId,
      type: "ATTENDANCE",
      rows,
      total,
      user: { username: user.username },
      filename: req.file.originalname,
      createdAt: Date.now(),
    };

    // Initialize Progress in Redis using uploadId
    await redis.setex(
      `upload:progress:${uploadId}`,
      3600,
      JSON.stringify({
        uploadId,
        status: "queued",
        type: "attendance",
        username: user.username,
        filename: req.file.originalname,
        processed: 0,
        total,
        success: 0,
        fail: 0,
        percent: 0,
        etaSeconds: 0,
        lastActive: Date.now(),
      }),
    );

    // Enqueue
    await redis.rpush("job:queue", JSON.stringify(job));

    // START PROCESSING IMMEDIATELY
    console.log(
      `[Academics] Starting first attendance batch for ${user.username} inline...`,
    );
    try {
      const result = await processNextBatch();

      // If there are more batches, trigger the queue worker to continue
      if (result && result.status === "continued") {
        const protocol = req.protocol || "http";
        const host = req.get("host");
        let url = `${protocol}://${host}/api/queue/process`;

        // Local development gateway handling
        if (
          host?.includes("localhost:3000") ||
          host?.includes("127.0.0.1:3000")
        ) {
          url = `${protocol}://${host}/api/v1/academics/api/queue/process`;
        }

        const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

        // Loop Buster: Add random param to avoid 508 Loop Detected
        const triggerUrl = `${url}?lb=${Math.random().toString(36).substring(7)}`;

        // Fire and forget trigger to background the processing
        axios
          .post(
            triggerUrl,
            {},
            {
              headers: { "x-internal-secret": INTERNAL_SECRET },
              timeout: 5000,
            },
          )
          .catch((err) =>
            console.warn(
              `[Academics] Background trigger poke (Attendance): ${err.message}`,
            ),
          );

        // Increased delay to ensure request is dispatched
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(`[Academics] Successfully triggered queue worker`);
      }
    } catch (e) {
      console.error("First attendance batch inline error:", e);
    }

    return res.status(202).json({
      success: true,
      message: "Bulk attendance ingestion started.",
      uploadId,
      total,
      monitor_url: `/academics/upload/progress?uploadId=${uploadId}`,
    });
  } catch (e: any) {
    console.error("Upload error:", e);
    return res
      .status(500)
      .json({ message: "Failed to process the uploaded file." });
  }
};

export const downloadGrades = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false });

  const targetStudentId = (
    (req.query.studentId as string) || user.username
  ).toUpperCase();
  const semesterId = req.params.semesterId;

  // Security check
  if (targetStudentId !== user.username && user.role === "student") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const grades = await prisma.grade.findMany({
      where: {
        studentId: { equals: targetStudentId, mode: "insensitive" },
        semesterId: { equals: semesterId, mode: "insensitive" },
      },
      include: { subject: true },
      orderBy: { subject: { code: "asc" } },
    });

    if (!grades.length) {
      return res.status(404).json({
        success: false,
        message: "No grades found for this semester.",
      });
    }

    // Attempt to fetch profile details using GATEWAY_URL (optional)
    let profileName = targetStudentId;
    let branch = "N/A";
    let campus = "RGUKT";
    try {
      const searchRes = await axios.post(
        `${GATEWAY_URL}/profile/internal/bulk-profiles`,
        { usernames: [targetStudentId] },
        {
          headers: {
            "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
          },
          timeout: 5000,
        },
      );
      if (
        searchRes.data &&
        searchRes.data.students &&
        searchRes.data.students[0]
      ) {
        const p = searchRes.data.students[0];
        profileName = p.name || targetStudentId;
        branch = p.branch || branch;
        campus = p.campus || campus;
      }
    } catch (e: any) {
      console.warn(
        "Could not fetch profile for download, using defaults.",
        e.message,
        e.response?.data,
      );
    }

    const pdfBuffer = await generateResultPdf({
      username: targetStudentId,
      name: profileName,
      branch: branch,
      campus: campus,
      semesterId,
      grades: grades.map((g) => ({
        grade: g.grade,
        subject: {
          code: g.subject.code,
          name: g.subject.name,
          credits: g.subject.credits,
        },
      })),
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="RESULTS_${targetStudentId}_${semesterId}.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("PDF Download Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate PDF." });
  }
};

export const downloadAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false });

  const targetStudentId = (
    (req.query.studentId as string) || user.username
  ).toUpperCase();
  const semesterId = req.params.semesterId;

  // Security check
  if (targetStudentId !== user.username && user.role === "student") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const records = await prisma.attendance.findMany({
      where: {
        studentId: { equals: targetStudentId, mode: "insensitive" },
        semesterId: { equals: semesterId, mode: "insensitive" },
      },
      include: { subject: true },
      orderBy: { subject: { code: "asc" } },
    });

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this semester.",
      });
    }

    let profileName = targetStudentId;
    let branch = "N/A";
    let campus = "RGUKT";
    try {
      const searchRes = await axios.post(
        `${GATEWAY_URL}/profile/internal/bulk-profiles`,
        { usernames: [targetStudentId] },
        {
          headers: {
            "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
          },
          timeout: 5000,
        },
      );
      if (
        searchRes.data &&
        searchRes.data.students &&
        searchRes.data.students[0]
      ) {
        const p = searchRes.data.students[0];
        profileName = p.name || targetStudentId;
        branch = p.branch || branch;
        campus = p.campus || campus;
      }
    } catch (e: any) {
      console.warn(
        "Could not fetch profile for download, using defaults.",
        e.message,
        e.response?.data,
      );
    }

    const pdfBuffer = await generateAttendancePdf({
      username: targetStudentId,
      name: profileName,
      branch: branch,
      campus: campus,
      semesterId,
      records: records.map((r) => ({
        attendedClasses: r.attendedClasses,
        totalClasses: r.totalClasses,
        subject: {
          code: r.subject.code,
          name: r.subject.name,
        },
      })),
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ATTENDANCE_${targetStudentId}_${semesterId}.pdf"`,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("PDF Download Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate PDF." });
  }
};
