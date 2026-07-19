import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma.util";
import { ErrorCode } from "../shared/error-codes";
import { resolveEffectiveRole } from "@uniz/shared";
import axios from "axios";
import * as ExcelJS from "exceljs";
import { redis } from "../utils/redis.util";
import { enforcePublishOtpRateLimit } from "../middlewares/publish-otp-ratelimit.middleware";
import {
  generateRegistrationPdf,
  generateBulkRegistrationPdf,
  RegistrationPdfData,
} from "../utils/pdf.util";
import {
  enqueueRegistrationPdfJob,
  getPdfProgress,
  getPdfResult,
  registerRegistrationPdfBuilder,
  type RegistrationPdfJobData,
} from "../workers/registration-pdf.queue";
import { randomUUID } from "crypto";
import {
  buildSubjectTemplateWorkbook,
  importRegistrationRows,
  parseRegistrationFormWorkbook,
  parseSubjectCatalogWorkbook,
  upsertSemesterSubjectCatalog,
  type RegistrationImportMode,
} from "../services/semester-registration-import.service";
import { validateRegistrationSubjectIds } from "../services/registration-validation.service";
import { uploadRejected } from "../utils/excel-strict-validation.util";

/**
 * @desc Initialize a new semester with branch allocations
 * @access Webmaster
 */
const GATEWAY_URL =
  process.env.GATEWAY_URL || "http://uniz-gateway-api:3000/api/v1";

const USER_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-user-service:3002"
    : process.env.USER_SERVICE_URL) || "http://localhost:3002"
).replace(/\/$/, "");

function normalizeStudentId(id?: string | null): string {
  return String(id || "")
    .trim()
    .toUpperCase();
}

/** RGUKT Ongole campus — datetime-local values from the portal are IST wall times. */
const CAMPUS_TZ = "+05:30";

function parseCampusDateTime(input: unknown): Date | null {
  if (input == null || input === "") return null;
  if (input instanceof Date) {
    return campusDateFromUtcWall(input);
  }
  const raw = String(input).trim();
  if (!raw) return null;
  if (/Z$|[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const normalized = raw.length === 16 ? `${raw}:00` : raw;
    return new Date(`${normalized}${CAMPUS_TZ}`);
  }
  return new Date(raw);
}

/** IST wall-clock values were often persisted with UTC digit components — reinterpret for comparisons. */
function campusDateFromUtcWall(d: Date): Date {
  const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}${CAMPUS_TZ}`;
  return new Date(iso);
}

function formatCampusDateTime(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function getRegistrationWindowState(sem: {
  registrationStart?: Date | string | null;
  registrationEnd?: Date | string | null;
}) {
  const now = Date.now();
  const start = parseCampusDateTime(sem.registrationStart);
  const end = parseCampusDateTime(sem.registrationEnd);

  if (start && now < start.getTime()) {
    return {
      isOpen: false,
      message: `Registration opens on ${formatCampusDateTime(start)} (IST)`,
      opensAt: start,
      closesAt: end,
    };
  }
  if (end && now > end.getTime()) {
    return {
      isOpen: false,
      message: "The registration window has closed.",
      opensAt: start,
      closesAt: end,
    };
  }
  return {
    isOpen: true,
    message: null as string | null,
    opensAt: start,
    closesAt: end,
  };
}

export const initSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { academicSemester, branches } = req.body; // academicSemester is the label like "AY 2024-25 E1-SEM-1"
  const user = req.user;
  if (!user || !isSemesterAdmin(user.role as string)) {
    return res.status(403).json({ error: "Webmaster access required" });
  }

  try {
    // 0. Check if semester already exists to prevent duplicates
    const existing = await prisma.academicSemester.findFirst({
      where: { name: academicSemester },
    });

    if (existing) {
      return res.status(400).json({
        error: "A semester with this label already exists.",
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
      });
    }

    // 1. Create Academic Semester record
    const semester = await prisma.academicSemester.create({
      data: {
        id: academicSemester.replace(/\s+/g, "-").toUpperCase(),
        name: academicSemester,
        status: "DEAN_REVIEW",
      },
    });

    const suffixMatch = academicSemester.match(/SEM-[1-2]/i);
    const semSuffix = suffixMatch ? suffixMatch[0].toUpperCase() : null;

    if (semSuffix) {
      const years = ["E1", "E2", "E3", "E4"];

      // Fetch the small subject catalog for this base semester once, then bucket
      // in JS — avoids a subject.findMany per (year × branch) combination.
      const allSemSubjects = await prisma.subject.findMany({
        where: { semester: { equals: semSuffix, mode: "insensitive" } },
      });

      for (const yearSuffix of years) {
        const semesterKey = `${yearSuffix}-${semSuffix}`;
        const romanKey = semesterKey
          .replace("-SEM-1", "-SEM-I")
          .replace("-SEM-2", "-SEM-II");

        for (const b of branches) {
          const branchName =
            typeof b === "string"
              ? b.toUpperCase()
              : b.branchName?.toUpperCase();
          if (!branchName) continue;

          // Match subjects by department + year code from the pre-fetched
          // catalog (equivalent to the previous insensitive equals/contains).
          const yearToken = `-${yearSuffix.toUpperCase()}-`;
          const subjects = allSemSubjects.filter(
            (s: any) =>
              String(s.department || "").toUpperCase() === branchName &&
              String(s.code || "")
                .toUpperCase()
                .includes(yearToken),
          );

          // Infer batch from AY (e.g. AY 2024-25 -> 24)
          let inferredBatch = "";
          const ayMatch = academicSemester.match(/AY\s*(\d{4})/i);
          if (ayMatch) {
            const startYear = parseInt(ayMatch[1]);
            const yearIndex = parseInt(yearSuffix.substring(1)); // E1 -> 1
            if (yearSuffix.startsWith("E")) {
              const entryYear = startYear - (yearIndex - 1);
              inferredBatch = "O" + entryYear.toString().substring(2);
            } else if (yearSuffix.startsWith("P")) {
              const entryYear = startYear - (yearIndex - 1);
              inferredBatch = "P" + entryYear.toString().substring(2);
            }
          }

          if (subjects.length > 0) {
            await prisma.branchAllocation.createMany({
              data: subjects.map(
                (s: any) =>
                  ({
                    branch: branchName,
                    subjectId: s.id,
                    semesterId: semester.id,
                    academicYear: yearSuffix,
                    batch: inferredBatch,
                    isApproved: false,
                  }) as any,
              ),
              skipDuplicates: true, // Safety check
            });
          }
        }
      }
    }

    // 4. Trigger Notification to Dean
    try {
      const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
      const headers = { "x-internal-secret": INTERNAL_SECRET };
      const NOTIFY_URL =
        process.env.NOTIFY_URL || "http://uniz-gateway-api:3000/api/v1";

      await axios
        .post(
          `${NOTIFY_URL}/notifications/push/send`,
          {
            target: "dean", // Targeted to Dean
            title: "Action Required: Subject Review 🎓",
            body: `Hello {{name}}, Webmaster has initialized ${academicSemester}. Please review and approve subject allocations for all branches and years.`,
          },
          { headers, timeout: 5000 },
        )
        .catch((e) => console.error("Dean Notification failed:", e.message));
    } catch (notifError) {
      console.warn("Notification Trigger Failed:", notifError);
    }

    res.status(201).json({ success: true, semester });
  } catch (error: any) {
    console.error("Init Semester Error:", error);
    res.status(500).json({
      error: "Failed to initialize semester",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
  }
};

/* ------------------------------------------------------------------ *
 *  SEMESTER REGISTRATION WORKFLOW (volatile per-semester subjects)
 *  Webmaster -> Dean -> HOD -> Registration Open -> Student Register
 * ------------------------------------------------------------------ */

const NOTIFY = async (payload: Record<string, any>) => {
  try {
    const NOTIFY_URL =
      process.env.NOTIFY_URL || "http://uniz-gateway-api:3000/api/v1";
    const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
    await axios.post(`${NOTIFY_URL}/notifications/push/send`, payload, {
      headers: { "x-internal-secret": INTERNAL_SECRET },
      timeout: 5000,
    });
  } catch (e: any) {
    console.warn("[Academics] Notification failed:", e?.message);
  }
};

// Derive SEM-1 / SEM-2 suffix from a free-form semester label.
const deriveSemSuffix = (label: string): string => {
  const m = String(label || "").match(/SEM[-\s]?([12])/i);
  return m ? `SEM-${m[1]}` : "SEM-1";
};

// Canonical catalog semester string for a subject, e.g. "E3-SEM-1".
const canonicalSubjectSemester = (
  academicYear: string | undefined,
  label: string,
): string => {
  const yr = (academicYear || "E1").toUpperCase();
  return `${yr}-${deriveSemSuffix(label)}`;
};

const SEMESTER_ADMIN_ROLES = ["webmaster", "coe", "director"] as const;

function isWebmaster(role?: string): boolean {
  return role === "webmaster";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function getStaffEmail(username: string): Promise<string> {
  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  const endpoints = [
    `faculty/${username.toUpperCase()}`,
    `admin/${username.toUpperCase()}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(`${USER_SERVICE_URL}/admin/${endpoint}`, {
        headers: { "x-internal-secret": SECRET },
        timeout: 3000,
      });
      const data =
        res.data?.faculty || res.data?.data || res.data?.student || res.data;
      if (data?.email) return String(data.email).toLowerCase();
    } catch {
      // try next profile type
    }
  }

  return `${username.toLowerCase()}@rguktong.ac.in`;
}

async function sendPublishVerificationEmail(
  email: string,
  username: string,
  otp: string,
): Promise<void> {
  const rawMailUrl = (
    process.env.MAIL_SERVICE_URL || `${GATEWAY_URL}/mail`
  ).trim();
  const MAIL_SERVICE_URL = rawMailUrl.endsWith("/health")
    ? rawMailUrl.slice(0, -7)
    : rawMailUrl;
  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  await axios.post(
    `${MAIL_SERVICE_URL}/send`,
    {
      type: "otp",
      to: email,
      data: {
        username,
        otp,
      },
    },
    {
      headers: { "x-internal-secret": SECRET },
      timeout: 8000,
    },
  );
}

function directPublishRedisKey(webmasterUsername: string, semesterId: string) {
  return `semester:direct-publish:${webmasterUsername.toLowerCase()}:${semesterId}`;
}

function isSemesterAdmin(role?: string): boolean {
  return SEMESTER_ADMIN_ROLES.includes(
    role as (typeof SEMESTER_ADMIN_ROLES)[number],
  );
}

function resolveHodBranch(user: AuthenticatedRequest["user"]): string {
  if (!user) return "";
  const fromJwt = String(user.department || "")
    .trim()
    .toUpperCase();
  if (fromJwt && fromJwt !== "GENERAL") return fromJwt;
  const uname = String(user.username || "")
    .replace(/"/g, "")
    .toLowerCase();
  return String(uname.split(/[_-]/)[1] || "")
    .trim()
    .toUpperCase();
}

function assertHodOwnBranch(
  user: AuthenticatedRequest["user"],
  requestedBranch: string | undefined,
  res: Response,
): string | null {
  const hodBranch = resolveHodBranch(user);
  if (!hodBranch) {
    res.status(400).json({ error: "Could not determine HOD branch" });
    return null;
  }
  const reqBranch = String(requestedBranch || hodBranch)
    .trim()
    .toUpperCase();
  if (reqBranch !== hodBranch) {
    res.status(403).json({
      error: `HOD can only approve their own branch (${hodBranch})`,
    });
    return null;
  }
  return hodBranch;
}

/** Branches that still need HOD sign-off before registration can open. */
async function getPendingHodBranches(semesterId: string): Promise<string[]> {
  const allocations = await prisma.branchAllocation.findMany({
    where: { semesterId },
    select: { branch: true, status: true, isApproved: true },
  });
  if (allocations.length === 0) return [];

  const byBranch = new Map<string, { total: number; approved: number }>();
  for (const a of allocations) {
    const branch = a.branch.toUpperCase();
    const cur = byBranch.get(branch) || { total: 0, approved: 0 };
    cur.total += 1;
    if (a.status === "APPROVED" && a.isApproved) cur.approved += 1;
    byBranch.set(branch, cur);
  }

  return [...byBranch.entries()]
    .filter(([, v]) => v.approved < v.total)
    .map(([branch]) => branch);
}

async function openSemesterRegistration(
  semesterId: string,
  opts?: { force?: boolean },
) {
  if (!opts?.force) {
    const pendingBranches = await getPendingHodBranches(semesterId);
    if (pendingBranches.length > 0) {
      throw new Error(
        `Cannot open registration: pending HOD approval for ${pendingBranches.join(", ")}`,
      );
    }
  } else {
    await prisma.branchAllocation.updateMany({
      where: { semesterId },
      data: { status: "APPROVED", isApproved: true },
    });
  }

  await prisma.academicSemester.update({
    where: { id: semesterId },
    data: { status: "REGISTRATION_OPEN" },
  });
}

/**
 * @desc Request or resend email verification code before publishing registration directly to students.
 * @access Webmaster only — rate limited (2/min per semester, 10/hour per user)
 */
async function issueDirectPublishCode(
  user: NonNullable<AuthenticatedRequest["user"]>,
  semesterId: string,
  res: Response,
  isResend: boolean,
) {
  const allowed = await enforcePublishOtpRateLimit(
    user.username,
    semesterId,
    res,
  );
  if (!allowed) return;

  const semester = await prisma.academicSemester.findUnique({
    where: { id: semesterId },
  });
  if (!semester) {
    res.status(404).json({ error: "Semester not found" });
    return;
  }

  if (semester.status === "REGISTRATION_OPEN") {
    res.status(400).json({
      error: "Registration is already open for this semester",
    });
    return;
  }
  if (semester.status === "REGISTRATION_CLOSED") {
    res.status(400).json({ error: "This semester registration is closed" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const redisKey = directPublishRedisKey(user.username, semesterId);
  await redis.set(redisKey, otp, "EX", 600);

  const email = await getStaffEmail(user.username);
  await sendPublishVerificationEmail(email, user.username, otp);

  res.json({
    success: true,
    resent: isResend,
    message: isResend
      ? "A new verification code was sent to your registered email"
      : "Verification code sent to your registered email",
    maskedEmail: maskEmail(email),
    expiresInSeconds: 600,
    resendCooldownSeconds: 60,
  });
}

export const requestDirectPublishCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || !isWebmaster(user.role as string)) {
    return res
      .status(403)
      .json({ error: "Only webmaster can publish registrations directly" });
  }

  const { id } = req.params;

  try {
    await issueDirectPublishCode(user, id, res, false);
  } catch (error: any) {
    console.error("Request Direct Publish Code Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send verification code" });
    }
  }
};

export const resendDirectPublishCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || !isWebmaster(user.role as string)) {
    return res
      .status(403)
      .json({ error: "Only webmaster can publish registrations directly" });
  }

  const { id } = req.params;

  try {
    await issueDirectPublishCode(user, id, res, true);
  } catch (error: any) {
    console.error("Resend Direct Publish Code Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  }
};

/**
 * @desc Verify email code and open semester registration to all students immediately.
 * @access Webmaster only
 */
export const confirmDirectPublish = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || !isWebmaster(user.role as string)) {
    return res
      .status(403)
      .json({ error: "Only webmaster can publish registrations directly" });
  }

  const { id } = req.params;
  const code = String(req.body.code || "").trim();

  if (!/^\d{6}$/.test(code)) {
    return res
      .status(400)
      .json({ error: "A valid 6-digit verification code is required" });
  }

  try {
    const redisKey = directPublishRedisKey(user.username, id);
    const stored = await redis.get(redisKey);
    if (!stored || stored !== code) {
      return res
        .status(403)
        .json({ error: "Invalid or expired verification code" });
    }

    const semester = await prisma.academicSemester.findUnique({
      where: { id },
    });
    if (!semester) return res.status(404).json({ error: "Semester not found" });

    if (semester.status === "REGISTRATION_OPEN") {
      await redis.del(redisKey);
      return res
        .status(400)
        .json({ error: "Registration is already open for this semester" });
    }
    if (semester.status === "REGISTRATION_CLOSED") {
      return res
        .status(400)
        .json({ error: "This semester registration is closed" });
    }

    await openSemesterRegistration(id, { force: true });
    await redis.del(redisKey);

    await NOTIFY({
      target: "students",
      title: "Semester Registration is LIVE! 🎓",
      body: `Registration for "${semester.name}" is now open. Choose your subjects before the deadline.`,
    });

    const updated = await prisma.academicSemester.findUnique({ where: { id } });
    return res.json({
      success: true,
      semester: updated,
      message: "Registration published to students",
    });
  } catch (error: any) {
    console.error("Confirm Direct Publish Error:", error);
    return res.status(500).json({ error: "Failed to publish registration" });
  }
};

/**
 * @desc Create a semester with a manual, per-semester subject list and
 *       elective groups. Subjects are upserted into the catalog (Option B)
 *       so volatile/changing subjects are always accepted.
 * @access Webmaster
 */
export const createSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || !isSemesterAdmin(user.role as string)) {
    return res.status(403).json({ error: "Webmaster access required" });
  }

  const {
    name,
    academicYear,
    batch,
    program,
    registrationStart,
    registrationEnd,
    semesterStart,
    semesterEnd,
    subjects = [],
    electiveGroups = [],
    submit = false, // if true, immediately send to Dean review
  } = req.body;

  if (!name || String(name).trim().length === 0) {
    return res.status(400).json({ error: "Semester name is required" });
  }

  try {
    const id = String(name).replace(/\s+/g, "-").toUpperCase();

    const existing = await prisma.academicSemester.findFirst({
      where: { OR: [{ id }, { name }] },
    });
    if (existing) {
      return res.status(400).json({
        error: "A semester with this label already exists.",
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
      });
    }

    const semester = await prisma.academicSemester.create({
      data: {
        id,
        name,
        status: submit ? "DEAN_REVIEW" : "DRAFT",
        academicYear: academicYear || null,
        batch: batch || null,
        program: program || "B.Tech",
        registrationStart: parseCampusDateTime(registrationStart),
        registrationEnd: parseCampusDateTime(registrationEnd),
        semesterStart: parseCampusDateTime(semesterStart),
        semesterEnd: parseCampusDateTime(semesterEnd),
      } as any,
    });

    // Elective groups first (so subjects can reference them)
    if (Array.isArray(electiveGroups) && electiveGroups.length > 0) {
      await prisma.electiveGroup.createMany({
        data: electiveGroups.map((g: any) => ({
          semesterId: semester.id,
          branch: (g.branch || "ALL").toUpperCase(),
          academicYear: (g.academicYear || "").toUpperCase(),
          groupCode: g.groupCode,
          groupName: g.groupName || g.groupCode,
          selectionLimit: Number(g.selectionLimit) || 1,
        })),
        skipDuplicates: true,
      });
    }

    // Subjects: upsert into the catalog, then create the per-semester allocation
    const added = await persistSemesterSubjects(semester.id, name, subjects);

    if (submit) {
      await NOTIFY({
        target: "dean",
        title: "Action Required: Semester Review 🎓",
        body: `Hello {{name}}, Webmaster submitted "${name}" for review. Please verify subjects, electives and registration dates.`,
      });
    }

    res.status(201).json({ success: true, semester, subjectsAdded: added });
  } catch (error: any) {
    console.error("Create Semester Error:", error);
    res.status(500).json({ error: "Failed to create semester" });
  }
};

// Shared helper: upsert subjects into catalog + create per-semester allocations.
async function persistSemesterSubjects(
  semesterId: string,
  label: string,
  subjects: any[],
): Promise<number> {
  if (!Array.isArray(subjects) || subjects.length === 0) return 0;
  let count = 0;

  for (const s of subjects) {
    const code = String(s.code || "")
      .trim()
      .toUpperCase();
    const name = String(s.name || "").trim();
    if (!code || !name) continue;

    const branch = String(s.department || s.branch || "")
      .trim()
      .toUpperCase();
    const academicYear = String(s.academicYear || s.year || "E1")
      .trim()
      .toUpperCase();
    const credits = Number(s.credits) || 0;
    const subjectType = String(s.subjectType || "CORE").toUpperCase();
    const isMandatory =
      s.isMandatory !== undefined ? !!s.isMandatory : subjectType === "CORE";
    const electiveGroupId = s.electiveGroupCode || s.electiveGroupId || "";
    const electiveGroupName = s.electiveGroupName || "";
    const electiveLimit = Number(s.electiveLimit) || 1;
    const academicCode =
      String(s.academicCode || s.customCode || "")
        .trim()
        .toUpperCase() || null;

    // Option B: upsert catalog entry; per-semester name/credits live on BranchAllocation.
    // Existing catalog rows keep their global name/credits (historical stability).
    await prisma.subject.upsert({
      where: { code },
      update: {
        department: branch,
        semester: canonicalSubjectSemester(academicYear, label),
      },
      create: {
        id: code,
        code,
        name,
        credits,
        department: branch,
        semester: canonicalSubjectSemester(academicYear, label),
      },
    });

    await prisma.branchAllocation.upsert({
      where: {
        branch_subjectId_semesterId: {
          branch,
          subjectId: code,
          semesterId,
        },
      },
      update: {
        academicYear,
        customName: name,
        customCode: academicCode,
        customCredits: credits || null,
        subjectType,
        isMandatory,
        electiveGroupId,
        electiveGroupName,
        electiveLimit,
      } as any,
      create: {
        branch,
        subjectId: code,
        semesterId,
        academicYear,
        customName: name,
        customCode: academicCode,
        customCredits: credits || null,
        subjectType,
        isMandatory,
        electiveGroupId,
        electiveGroupName,
        electiveLimit,
        status: "DEAN_PENDING",
      } as any,
    });
    count++;
  }
  return count;
}

/**
 * @desc Add subjects to an existing semester (typed in by webmaster/HOD).
 * @access Webmaster, Dean, HOD
 */
export const addSemesterSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const { subjects } = req.body;
  const user = req.user;

  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id },
    });
    if (!semester) return res.status(404).json({ error: "Semester not found" });

    let list = subjects;
    // HODs can only add subjects for their own branch
    if (user?.role === "hod") {
      const hodBranch = user.username.split("_")[1]?.toUpperCase();
      list = (subjects || []).filter(
        (s: any) =>
          String(s.department || s.branch || "").toUpperCase() === hodBranch,
      );
    }

    const added = await persistSemesterSubjects(id, semester.name, list || []);
    res.json({ success: true, subjectsAdded: added });
  } catch (error: any) {
    console.error("Add Semester Subjects Error:", error);
    res.status(500).json({ error: "Failed to add subjects" });
  }
};

/**
 * @desc Download the webmaster subject upload template
 * @access Webmaster, Dean, Director
 */
export const downloadRegistrationSubjectsTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!isSemesterAdmin(req.user?.role as string)) {
    return res.status(403).json({ error: "Semester admin access required" });
  }

  const { semesterId, branch, year } = req.query;
  const buffer = await buildSubjectTemplateWorkbook({
    semesterId: semesterId ? String(semesterId) : undefined,
    branch: branch ? String(branch) : undefined,
    academicYear: year ? String(year) : undefined,
  });
  const suffix = semesterId ? `-${String(semesterId)}` : "";
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="registration-subjects-template${suffix}.xlsx"`,
  );
  res.send(buffer);
};

/**
 * @desc Upload semester subjects / allocations from webmaster Excel
 * @access Webmaster, Dean, Director
 */
export const uploadRegistrationSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!isSemesterAdmin(req.user?.role as string)) {
    return res.status(403).json({ error: "Semester admin access required" });
  }
  const { semesterId, dryRun, approve } = req.body as {
    semesterId?: string;
    dryRun?: string | boolean;
    approve?: string | boolean;
  };
  if (!semesterId) {
    return res.status(400).json({ error: "semesterId is required" });
  }
  if (!req.file?.buffer) {
    return res.status(400).json({ error: "Excel file is required" });
  }

  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) return res.status(404).json({ error: "Semester not found" });

    const rows = await parseSubjectCatalogWorkbook(req.file.buffer);
    const role = req.user?.role as string;
    const forceApprove =
      approve === true || approve === "true"
        ? isWebmaster(role) || role === "coe"
        : false;
    const isDryRun = dryRun === true || dryRun === "true";
    const result = await upsertSemesterSubjectCatalog({
      semesterId,
      semesterName: semester.name,
      rows,
      dryRun: isDryRun,
      approve: forceApprove,
    });

    if (result.errors.length > 0) {
      return res.status(400).json(
        uploadRejected(
          result.errors.map((e) => ({
            row: e.row,
            message: e.message,
          })),
        ),
      );
    }

    if (!isDryRun && !forceApprove && semester.status === "DRAFT") {
      await prisma.academicSemester.update({
        where: { id: semesterId },
        data: { status: "DEAN_REVIEW" },
      });
      await NOTIFY({
        target: "dean",
        title: "Action Required: Subject Catalog Review 🎓",
        body: `Hello {{name}}, Webmaster uploaded subjects for "${semester.name}". Please review allocations and electives.`,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Registration subject upload failed:", error);
    res.status(500).json({ error: error.message || "Subject upload failed" });
  }
};

/**
 * @desc Import Google Form registration responses for a semester
 * @access Webmaster, Dean, Director
 */
export const uploadRegistrationResponses = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!isSemesterAdmin(req.user?.role as string)) {
    return res.status(403).json({ error: "Semester admin access required" });
  }
  const { semesterId, branch, dryRun, mode, skipValidation } = req.body as {
    semesterId?: string;
    branch?: string;
    dryRun?: string | boolean;
    mode?: RegistrationImportMode;
    skipValidation?: string | boolean;
  };
  if (!semesterId) {
    return res.status(400).json({ error: "semesterId is required" });
  }
  if (!req.file?.buffer) {
    return res.status(400).json({ error: "Excel file is required" });
  }

  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) return res.status(404).json({ error: "Semester not found" });

    const isDryRun = dryRun === true || dryRun === "true";
    const rows = await parseRegistrationFormWorkbook(req.file.buffer, branch);
    const result = await importRegistrationRows({
      semesterId,
      rows,
      mode: mode === "skip" ? "skip" : "replace",
      dryRun: isDryRun,
      skipValidation: skipValidation === true || skipValidation === "true",
      strict: true,
    });

    if (result.errors.length > 0) {
      return res.status(400).json(
        uploadRejected(
          result.errors.map((e) => ({
            row: e.row,
            studentId: e.studentId,
            message: e.message,
          })),
        ),
      );
    }

    res.json(result);
  } catch (error: any) {
    console.error("Registration response import failed:", error);
    res
      .status(500)
      .json({ error: error.message || "Registration import failed" });
  }
};

/**
 * @desc List elective groups for a semester
 */
export const getElectiveGroups = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const { branch } = req.query;
  try {
    const where: any = { semesterId: id };
    if (branch && branch !== "all") {
      where.branch = {
        equals: String(branch).toUpperCase(),
        mode: "insensitive",
      };
    }
    const groups = await prisma.electiveGroup.findMany({
      where,
      orderBy: { groupCode: "asc" },
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch elective groups" });
  }
};

/**
 * @desc Create / update an elective group
 * @access Webmaster, Dean, HOD
 */
export const upsertElectiveGroup = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params; // semesterId
  const { branch, academicYear, groupCode, groupName, selectionLimit } =
    req.body;
  try {
    if (!groupCode || !groupName) {
      return res
        .status(400)
        .json({ error: "groupCode and groupName required" });
    }
    const group = await prisma.electiveGroup.upsert({
      where: {
        semesterId_branch_groupCode: {
          semesterId: id,
          branch: (branch || "ALL").toUpperCase(),
          groupCode,
        },
      },
      update: {
        groupName,
        academicYear: (academicYear || "").toUpperCase(),
        selectionLimit: Number(selectionLimit) || 1,
      },
      create: {
        semesterId: id,
        branch: (branch || "ALL").toUpperCase(),
        academicYear: (academicYear || "").toUpperCase(),
        groupCode,
        groupName,
        selectionLimit: Number(selectionLimit) || 1,
      },
    });
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ error: "Failed to save elective group" });
  }
};

/**
 * @desc Delete an elective group
 */
export const deleteElectiveGroup = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { groupId } = req.params;
  try {
    await prisma.electiveGroup.delete({ where: { id: groupId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete elective group" });
  }
};

/**
 * @desc Advance the semester through the approval state machine.
 *       Webmaster: DRAFT -> DEAN_REVIEW (submit)
 *       Dean:      DEAN_REVIEW -> HOD_REVIEW (approve) | DRAFT (send back)
 *       HOD:       HOD_REVIEW -> REGISTRATION_OPEN (approve)
 *       Any:       -> DRAFT (reject / send back for modifications)
 * @access Webmaster, Dean, HOD
 */
export const advanceSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const { action } = req.body; // "submit" | "approve" | "reject"
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const semester = await prisma.academicSemester.findUnique({
      where: { id },
    });
    if (!semester) return res.status(404).json({ error: "Semester not found" });

    const role = user.role as string;
    let nextStatus = semester.status as string;
    let notify: Record<string, any> | null = null;

    if (action === "reject") {
      nextStatus = "DRAFT";
      notify = {
        target: "webmaster",
        title: "Semester Sent Back ↩️",
        body: `"${semester.name}" was sent back for modifications by ${role.toUpperCase()}.`,
      };
    } else if (action === "submit") {
      if (!isSemesterAdmin(role)) {
        return res.status(403).json({ error: "Only Webmaster can submit" });
      }
      nextStatus = "DEAN_REVIEW";
      notify = {
        target: "dean",
        title: "Action Required: Semester Review 🎓",
        body: `Hello {{name}}, "${semester.name}" is awaiting your approval.`,
      };
    } else if (action === "approve") {
      if (role === "dean" || role === "webmaster" || role === "coe") {
        if (semester.status === "DEAN_REVIEW") {
          nextStatus = "HOD_REVIEW";
          await prisma.branchAllocation.updateMany({
            where: { semesterId: id },
            data: { status: "HOD_REVIEW", isApproved: false },
          });
          notify = {
            target: "hod",
            title: "Action Required: Subject Approval 🏛️",
            body: `Hello {{name}}, Dean approved "${semester.name}". Please review your branch subjects and electives.`,
          };
        } else if (role !== "dean") {
          const pendingBranches = await getPendingHodBranches(id);
          if (pendingBranches.length > 0) {
            return res.status(400).json({
              error: `All HOD branches must approve before opening registration. Pending: ${pendingBranches.join(", ")}`,
              pendingBranches,
            });
          }
          await openSemesterRegistration(id);
          nextStatus = "REGISTRATION_OPEN";
          notify = {
            target: "students",
            title: "Semester Registration is LIVE! 🎓",
            body: `Registration for "${semester.name}" is now open. Choose your subjects before the deadline.`,
          };
        }
      } else if (role === "hod") {
        if (semester.status !== "HOD_REVIEW") {
          return res
            .status(400)
            .json({ error: "Semester is not pending HOD approval" });
        }

        const hodBranch = assertHodOwnBranch(user, req.body.branch, res);
        if (!hodBranch) return;

        await prisma.branchAllocation.updateMany({
          where: {
            semesterId: id,
            branch: { equals: hodBranch, mode: "insensitive" },
          },
          data: { status: "APPROVED", isApproved: true },
        });

        const pendingBranches = await getPendingHodBranches(id);
        if (pendingBranches.length > 0) {
          nextStatus = "HOD_REVIEW";
          notify = {
            target: "hod",
            branch: pendingBranches[0],
            title: "HOD Approval Still Pending 🏛️",
            body: `Branches awaiting approval: ${pendingBranches.join(", ")}. "${semester.name}" will open once all HODs sign off.`,
          };
          const updated = await prisma.academicSemester.update({
            where: { id },
            data: { status: nextStatus as any },
          });
          if (notify) await NOTIFY(notify);
          return res.json({
            success: true,
            semester: updated,
            branchApproved: hodBranch,
            pendingBranches,
            registrationOpen: false,
          });
        }

        await openSemesterRegistration(id);
        nextStatus = "REGISTRATION_OPEN";
        notify = {
          target: "students",
          title: "Semester Registration is LIVE! 🎓",
          body: `Registration for "${semester.name}" is now open. Choose your subjects before the deadline.`,
        };
      } else {
        return res.status(403).json({ error: "Not authorized to approve" });
      }
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updated = await prisma.academicSemester.update({
      where: { id },
      data: { status: nextStatus as any },
    });

    if (notify) await NOTIFY(notify);

    res.json({ success: true, semester: updated });
  } catch (error: any) {
    console.error("Advance Semester Error:", error);
    res.status(500).json({ error: "Failed to advance semester" });
  }
};

/**
 * @desc Update semester configuration (dates, batch, academic year)
 * @access Webmaster
 */
export const updateSemesterConfig = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const {
    name,
    academicYear,
    batch,
    program,
    registrationStart,
    registrationEnd,
    semesterStart,
    semesterEnd,
  } = req.body;
  try {
    const semester = await prisma.academicSemester.update({
      where: { id },
      data: {
        name: name || undefined,
        academicYear: academicYear ?? undefined,
        batch: batch ?? undefined,
        program: program ?? undefined,
        registrationStart:
          registrationStart !== undefined
            ? parseCampusDateTime(registrationStart)
            : undefined,
        registrationEnd:
          registrationEnd !== undefined
            ? parseCampusDateTime(registrationEnd)
            : undefined,
        semesterStart:
          semesterStart !== undefined
            ? parseCampusDateTime(semesterStart)
            : undefined,
        semesterEnd:
          semesterEnd !== undefined
            ? parseCampusDateTime(semesterEnd)
            : undefined,
      } as any,
    });
    res.json({ success: true, semester });
  } catch (error) {
    res.status(500).json({ error: "Failed to update semester config" });
  }
};

/**
 * @desc Update semester status
 * @access Webmaster
 */
export const updateSemesterStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || !isSemesterAdmin(user.role as string)) {
    return res.status(403).json({ error: "Webmaster access required" });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (status === "REGISTRATION_OPEN") {
    return res.status(403).json({
      error:
        "Opening registration requires email verification. Use Publish to Students on the semester card.",
    });
  }

  try {
    const semester = await prisma.academicSemester.update({
      where: { id },
      data: { status },
    });
    res.json(semester);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

/**
 * @desc Delete a semester
 * @access Webmaster
 */
export const deleteSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;

  try {
    // 1. Delete associated registrations and allocations first (Cascade)
    await prisma.registration.deleteMany({ where: { semesterId: id } });
    await prisma.branchAllocation.deleteMany({ where: { semesterId: id } });

    // 2. Delete the semester record
    await prisma.academicSemester.delete({ where: { id } });

    res.json({ success: true, message: "Semester deleted successfully" });
  } catch (error) {
    console.error("Delete Semester Error:", error);
    res.status(500).json({ error: "Failed to delete semester" });
  }
};

/**
 * @desc Create a manual allocation
 * @access Webmaster, Dean, HOD
 */
export const createAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { semesterId, branch, subjectId, academicYear, batch } = req.body;
  const user = req.user;

  try {
    // Role Check
    if (user?.role === "hod") {
      const hodBranch = resolveHodBranch(user);
      if (!hodBranch || branch.toUpperCase() !== hodBranch) {
        return res.status(403).json({ error: "Unauthorized for this branch" });
      }
    }

    const allocation = await prisma.branchAllocation.create({
      data: {
        semesterId,
        branch: branch.toUpperCase(),
        subjectId,
        academicYear: academicYear || "E4", // Default or derived
        batch: batch || "",
        status: "DEAN_PENDING",
      } as any,
      include: {
        subject: true,
      },
    });
    res.json(allocation);
  } catch (error) {
    console.error("Create Allocation Error:", error);
    res.status(500).json({ error: "Failed to create allocation" });
  }
};

/**
 * @desc Delete a specific allocation
 * @access Webmaster, Dean
 */
export const deleteAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const target = await prisma.branchAllocation.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: "Not found" });

    // Role Check
    if (user?.role === "hod") {
      const hodBranch = user.username.split("_")[1]?.toUpperCase();
      if (target.branch.toUpperCase() !== hodBranch) {
        return res.status(403).json({ error: "Unauthorized for this branch" });
      }
    }

    await prisma.branchAllocation.delete({
      where: { id },
    });
    res.json({ success: true, message: "Allocation deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete allocation" });
  }
};

/**
 * @desc Get all semesters
 */
export const getSemesters = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const CACHE_KEY = "academics:getSemesters:v1";
  const setNoStore = () => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  };

  try {
    setNoStore();

    const cached = await redis.get(CACHE_KEY).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));

    const semesters = await prisma.academicSemester.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Count distinct registered students per semester in the DB instead of
    // streaming ~20k rows into Node and de-duping in a JS Set. studentId is
    // canonically uppercase/clean, so UPPER(TRIM()) matches normalizeStudentId.
    const counts = await prisma.$queryRaw<
      { semesterId: string; cnt: bigint }[]
    >`
      SELECT "semesterId", COUNT(DISTINCT UPPER(TRIM("studentId"))) AS cnt
      FROM "Registration"
      WHERE "status" = 'REGISTERED'
      GROUP BY "semesterId"
    `;
    const countMap = new Map(counts.map((c) => [c.semesterId, Number(c.cnt)]));

    const payload = semesters.map((sem) => ({
      ...sem,
      _count: {
        registrations: countMap.get(sem.id) ?? 0,
      },
    }));

    // Short server-side cache absorbs dashboard polling bursts; counts are
    // eventually-consistent within 30s (fine for an admin overview list).
    await redis.setex(CACHE_KEY, 30, JSON.stringify(payload)).catch(() => {});
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch semesters" });
  }
};

/**
 * @desc Get branch allocations for Dean review
 */
export const getDeanAllocations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch } = req.params;

  try {
    const { semesterId, year, batch } = req.query;

    let targetSemId;
    if (semesterId) {
      targetSemId = semesterId as string;
    } else {
      const activeSem = await prisma.academicSemester.findFirst({
        where: {
          status: { in: ["DEAN_REVIEW", "REGISTRATION_OPEN", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!activeSem) {
        return res.status(404).json({ error: "No active semester found" });
      }
      targetSemId = activeSem.id;
    }

    const whereClause: any = {
      semesterId: targetSemId,
    };
    if (branch !== "all") {
      whereClause.branch = { equals: branch, mode: "insensitive" };
    }

    if (year) {
      whereClause.academicYear = {
        equals: year as string,
        mode: "insensitive",
      };
    }

    if (batch && batch !== "all") {
      whereClause.batch = {
        equals: batch as string,
        mode: "insensitive",
      };
    }

    const allocations = await prisma.branchAllocation.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
      orderBy: { subject: { code: "asc" } },
    });

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch allocations" });
  }
};

/**
 * @desc Update single allocation (Dean Review)
 * HOD can edit elective names and credits here
 */
export const updateAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const role = resolveEffectiveRole(user);
  const allowed = new Set(["webmaster", "coe", "dean", "director", "hod"]);
  if (!allowed.has(role)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const { id } = req.params;
  const {
    customName,
    customCode,
    customCredits,
    isApproved,
    isMandatory,
    electiveGroupId,
    electiveLimit,
  } = req.body;
  try {
    const allocation = await prisma.branchAllocation.update({
      where: { id },
      data: {
        customName,
        customCode:
          customCode !== undefined
            ? String(customCode || "")
                .trim()
                .toUpperCase() || null
            : undefined,
        customCredits: customCredits ? Number(customCredits) : undefined,
        isApproved: isApproved !== undefined ? isApproved : undefined,
        isMandatory: isMandatory !== undefined ? isMandatory : undefined,
        electiveGroupId:
          electiveGroupId !== undefined ? electiveGroupId : undefined,
        electiveLimit:
          electiveLimit !== undefined ? Number(electiveLimit) : undefined,
      } as any,
    });
    res.json({ success: true, allocation });
  } catch (e: any) {
    res.status(500).json({ error: "Update failed" });
  }
};

/**
 * @desc Approve branch allocations in bulk
 * @access Dean
 */
export const approveBranchAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, semesterId, allocationId, year } = req.body;
  const user = req.user;

  try {
    const whereClause: any = { semesterId };

    if (allocationId) {
      whereClause.id = allocationId;
    } else {
      if (!branch || !semesterId) {
        return res.status(400).json({ error: "Missing branch or semesterId" });
      }
      if (branch !== "all") {
        whereClause.branch = { equals: branch, mode: "insensitive" };
      }
      if (year) {
        whereClause.academicYear = { equals: year, mode: "insensitive" };
      }
    }

    // Role-based status progression
    let nextStatus: "HOD_REVIEW" | "APPROVED" = "HOD_REVIEW";
    let title = "";
    let message = "";
    let target = "all";
    let targetBranch = "";
    let targetYear = "";

    if (user?.role === "dean" || user?.role === "webmaster") {
      nextStatus = "HOD_REVIEW";
      title = "Course List Approved by Dean 🏛️";
      message = `Hello {{name}}, the subject structure for ${branch || "all branches"} has been approved by Dean. Please review and finalize.`;
      target = "hod"; // Targeted to HODs
      targetBranch = branch;
    } else if (user?.role === "hod") {
      const hodBranch = assertHodOwnBranch(user, branch, res);
      if (!hodBranch) return;

      nextStatus = "APPROVED";
      targetBranch = hodBranch;
      targetYear = year;
      whereClause.branch = { equals: hodBranch, mode: "insensitive" };

      const pendingBranches = await getPendingHodBranches(semesterId);
      if (pendingBranches.length > 0) {
        title = `Branch ${targetBranch} Approved ✅`;
        message = `Hello {{name}}, ${targetBranch} subjects are approved. Still waiting on: ${pendingBranches.join(", ")}.`;
        target = "hod";
        targetBranch = pendingBranches[0];
      } else {
        await openSemesterRegistration(semesterId);
        title = "Semester Registration is LIVE! 🎓";
        message = `Hello {{name}}, your course registration for ${year || "upcoming semester"} is now open. Register before the deadline.`;
        target = "students";
      }
    }

    await prisma.branchAllocation.updateMany({
      where: whereClause,
      data: {
        status: nextStatus,
        isApproved: nextStatus === "APPROVED",
      },
    });

    // Send targeted notification
    try {
      const NOTIFY_URL =
        process.env.NOTIFY_URL || "http://uniz-gateway-api:3000/api/v1";
      const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

      await axios.post(
        `${NOTIFY_URL}/notifications/push/send`,
        {
          target: target,
          branch: targetBranch,
          year: targetYear,
          title,
          body: message,
        },
        {
          headers: { "x-internal-secret": INTERNAL_SECRET },
          timeout: 5000,
        },
      );
    } catch (e) {
      console.warn("Approval notification failed");
    }

    res.json({
      success: true,
      message: `Progressed to ${nextStatus}`,
    });
  } catch (error) {
    console.error("Approval failed:", error);
    res.status(500).json({ error: "Approval failed" });
  }
};

/**
 * @desc Get available subjects for a student
 * @access Student
 */
export const getAvailableSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  let { branch, year } = req.query as { branch?: string; year?: string };

  try {
    // Resolve branch/year from the student's own profile when not supplied,
    // so the student UI doesn't need to know them up front.
    if ((!branch || !year) && req.user?.role === "student") {
      try {
        const studentRes = await axios.get(
          `${GATEWAY_URL}/profile/student/me`,
          { headers: { Authorization: req.headers.authorization } },
        );
        const profileData = studentRes.data?.student || studentRes.data;
        if (profileData) {
          branch = branch || profileData.department || profileData.branch;
          year = year || profileData.year;
        }
      } catch (e) {
        console.warn("[Academics] available: profile resolve failed");
      }
    }

    const openSem =
      (await prisma.academicSemester.findFirst({
        where: { status: "REGISTRATION_OPEN" },
        orderBy: { createdAt: "desc" },
      })) ||
      (await prisma.academicSemester.findFirst({
        where: {
          status: { in: ["HOD_REVIEW", "DEAN_REVIEW", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
      }));

    if (!openSem) {
      return res.status(404).json({ error: "No active semester found" });
    }

    if (openSem.status !== "REGISTRATION_OPEN") {
      return res.status(200).json({
        semester: openSem,
        subjects: [],
        alreadyRegistered: false,
        isOpen: false,
      });
    }

    const window = getRegistrationWindowState(openSem);

    const branchUpper = (branch as string)?.toUpperCase();

    const where: any = {
      semesterId: openSem.id,
      branch: { equals: branchUpper, mode: "insensitive" },
      status: "APPROVED",
      isApproved: true,
    };

    // If year is provided (e.g. E3), filter by academicYear field strictly
    if (year) {
      where.academicYear = { equals: year as string, mode: "insensitive" };
    }

    const subjects = await prisma.branchAllocation.findMany({
      where,
      include: {
        subject: true,
      },
    });

    // 3. Check if current student has registrations for this semester
    const registrationCount = await prisma.registration.count({
      where: {
        studentId: {
          equals: normalizeStudentId(req.user?.username),
          mode: "insensitive",
        },
        semesterId: openSem.id,
        status: "REGISTERED",
      },
    });

    // 4. Elective groups for this branch/year (for grouped UI rendering)
    const electiveGroups = await prisma.electiveGroup.findMany({
      where: {
        semesterId: openSem.id,
        AND: [
          {
            OR: [
              { branch: { equals: branchUpper, mode: "insensitive" } },
              { branch: "ALL" },
            ],
          },
          ...(year
            ? [
                {
                  OR: [
                    {
                      academicYear: {
                        equals: year as string,
                        mode: "insensitive" as const,
                      },
                    },
                    { academicYear: "" },
                    { academicYear: null as any },
                  ],
                },
              ]
            : []),
        ],
      },
    });

    res.json({
      semester: openSem,
      subjects: window.isOpen ? subjects : [],
      electiveGroups: window.isOpen ? electiveGroups : [],
      registrationWindow: {
        start: window.opensAt,
        end: window.closesAt,
      },
      alreadyRegistered: registrationCount > 0,
      isOpen: window.isOpen,
      windowMessage: window.message,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

/**
 * @desc Bulk register subjects
 * @access Student
 */

export const registerSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { subjectIds } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const studentId = normalizeStudentId(user.username);

  try {
    // 1. Get current registration-open semester
    const sem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!sem) {
      return res.status(403).json({ error: "Registration is not open" });
    }

    // 1b. Enforce the registration window (if configured)
    const window = getRegistrationWindowState(sem);
    if (!window.isOpen) {
      return res.status(403).json({
        error: window.message || "Registration is not open",
      });
    }

    const existingRegistrationCount = await prisma.registration.count({
      where: {
        studentId: { equals: studentId, mode: "insensitive" },
        semesterId: sem.id,
        status: "REGISTERED",
      },
    });
    if (existingRegistrationCount > 0) {
      return res.status(409).json({
        error: "You have already registered for this semester",
        alreadyRegistered: true,
      });
    }

    // 2. Fetch student details to get branch (department) and year
    let studentBranch = (user as any).department;
    let studentYear = (user as any).year;
    let studentBatch = "";

    try {
      const studentRes = await axios.get(`${GATEWAY_URL}/profile/student/me`, {
        headers: { Authorization: req.headers.authorization },
      });
      console.log(`[ACADEMICS] Registration profile fetch:`, studentRes.data);

      const profileData = studentRes.data?.student || studentRes.data;
      if (profileData) {
        studentBranch =
          profileData.department || profileData.branch || studentBranch;
        studentYear = profileData.year || studentYear;
        studentBatch = profileData.batch || "";
      }
    } catch (err) {
      console.warn(
        "Failed to fetch student profile details, falling back to basic checks",
      );
    }

    console.log(
      `[ACADEMICS] Validating registration for Branch: ${studentBranch}, Year: ${studentYear}`,
    );

    const allocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: sem.id,
        ...(studentBranch
          ? { branch: { equals: studentBranch, mode: "insensitive" } }
          : {}),
        ...(studentYear
          ? { academicYear: { equals: studentYear, mode: "insensitive" } }
          : {}),
        isApproved: true,
      },
      include: { subject: true },
    });

    // If we didn't have studentBranch, infer it from the first allocation for validation
    if (!studentBranch && allocations.length > 0) {
      studentBranch = allocations[0].branch;
    }

    // Check mandatory subjects and elective group limits (shared with bulk import)
    const validation = validateRegistrationSubjectIds(subjectIds, allocations);
    if (!validation.ok) {
      return res.status(400).json({
        error: validation.error,
        attribution: "SreeCharan",
      });
    }

    // 3. Perform subject registration (atomic — block duplicate semester enrollments)
    await prisma.$transaction(async (tx) => {
      const lockedCount = await tx.registration.count({
        where: {
          studentId: { equals: studentId, mode: "insensitive" },
          semesterId: sem.id,
          status: "REGISTERED",
        },
      });
      if (lockedCount > 0) {
        throw new Error("ALREADY_REGISTERED");
      }

      await Promise.all(
        subjectIds.map((id: string) =>
          tx.registration.create({
            data: {
              studentId,
              subjectId: id,
              semesterId: sem.id,
              status: "REGISTERED",
              batch: studentBatch,
              submittedAt: new Date(),
            } as any,
          }),
        ),
      );
    });

    // 3. Update Student Academic Profile in uniz-user service
    const firstSubject = await prisma.subject.findFirst({
      where: { id: subjectIds[0] },
    });

    if (firstSubject) {
      const match = firstSubject.semester.match(/(E[1-4])-(SEM-[1-2])/i);
      if (match) {
        const academicYear = match[1];
        const academicSem = match[2];
        console.log(
          `[MEGA-DEBUG] Match found: ${academicYear}, ${academicSem}`,
        );

        try {
          const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
          const updateData: any = {
            year: academicYear,
            semester: academicSem,
          };

          if (firstSubject.department) {
            updateData.branch = firstSubject.department;
          }

          const updateRes = await axios.put(
            `${GATEWAY_URL}/profile/admin/student/${user.username}`,
            updateData,
            {
              headers: {
                Authorization: req.headers.authorization,
                "x-internal-secret": INTERNAL_SECRET,
              },
            },
          );
          console.log(
            `✅ Student ${user.username} profile updated to ${academicYear} ${academicSem} (${updateData.branch || "no branch update"})`,
          );
        } catch (profileError: any) {
          console.warn("User Profile Update Failed:", profileError.message);
        }
      }
    }

    // Build a confirmation payload (registration ID + registered subjects)
    const registered = await prisma.registration.findMany({
      where: {
        studentId: { equals: studentId, mode: "insensitive" },
        semesterId: sem.id,
        status: "REGISTERED",
      },
      include: { subject: true },
      orderBy: { subject: { code: "asc" } },
    });

    const regAllocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: sem.id,
        subjectId: { in: registered.map((r) => r.subjectId) },
        ...(studentBranch
          ? { branch: { equals: studentBranch, mode: "insensitive" } }
          : {}),
      },
    });
    const allocBySubject = new Map(regAllocations.map((a) => [a.subjectId, a]));

    const confirmation = {
      registrationId: registered[0]?.id || sem.id,
      semester: sem.name,
      submittedAt: (registered[0] as any)?.submittedAt || new Date(),
      subjects: registered.map((r: any) => {
        const alloc = allocBySubject.get(r.subjectId);
        return {
          code: alloc?.customCode?.trim() || r.subject.code,
          internalCode: r.subject.code,
          name: alloc?.customName?.trim() || r.subject.name,
          credits: alloc?.customCredits ?? r.subject.credits,
        };
      }),
      totalCredits: registered.reduce((acc: number, r: any) => {
        const alloc = allocBySubject.get(r.subjectId);
        return acc + (alloc?.customCredits ?? r.subject.credits ?? 0);
      }, 0),
    };

    // Confirmation push (no email, per spec)
    await NOTIFY({
      target: "user",
      username: user.username,
      title: "Registration Confirmed ✅",
      body: `You registered ${registered.length} subjects for ${sem.name}.`,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      confirmation,
    });
  } catch (error: any) {
    if (error?.message === "ALREADY_REGISTERED") {
      return res.status(409).json({
        error: "You have already registered for this semester",
        alreadyRegistered: true,
      });
    }
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * @desc Get current registered subjects (Specifically requested by user)
 * @access Student
 */
export const getCurrentSubjects = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const requestedId = normalizeStudentId(
    req.params.studentId || user?.username,
  );

  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (
    user.role === "student" &&
    normalizeStudentId(user.username) !== requestedId
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    // 1. Get the latest active/open semester
    const activeSem = await prisma.academicSemester.findFirst({
      where: {
        status: {
          in: [
            "DEAN_REVIEW",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "APPROVED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSem) {
      return res.json({ semester: null, subjects: [] });
    }

    // 2. Fetch registrations for this student in this semester
    const registrations = await prisma.registration.findMany({
      where: {
        studentId: { equals: requestedId, mode: "insensitive" },
        semesterId: activeSem.id,
        status: "REGISTERED",
      },
      include: {
        subject: true,
      },
      orderBy: { subject: { code: "asc" } },
    });

    const regAllocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: activeSem.id,
        subjectId: { in: registrations.map((r) => r.subjectId) },
      },
    });
    const allocBySubject = new Map(regAllocations.map((a) => [a.subjectId, a]));

    res.json({
      semester: activeSem,
      subjects: registrations.map((r) => {
        const alloc = allocBySubject.get(r.subjectId);
        return {
          ...r,
          subject: {
            ...r.subject,
            code: alloc?.customCode?.trim() || r.subject.code,
            name: alloc?.customName?.trim() || r.subject.name,
            internalCode: r.subject.code,
          },
        };
      }),
      alreadyRegistered: registrations.length > 0,
    });
  } catch (error) {
    console.error("Get Current Subjects Error:", error);
    res.status(500).json({ error: "Failed to fetch current subjects" });
  }
};

/**
 * @desc Export academic data to Excel
 */
export const exportAcademicData = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { type, branch, semesterId, batch } = req.query;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    if (type === "registrations") {
      worksheet.columns = [
        { header: "Student ID", key: "studentId" },
        { header: "Batch", key: "batch" },
        { header: "Internal Code", key: "internalCode" },
        { header: "Academic Code", key: "code" },
        { header: "Subject Name", key: "name" },
        { header: "Status", key: "status" },
        { header: "Registered At", key: "createdAt" },
      ];

      const whereClause: any = {
        semesterId: semesterId as string,
        subject: { department: branch ? (branch as string) : undefined },
      };

      if (batch && batch !== "all") {
        whereClause.batch = { equals: batch as string, mode: "insensitive" };
      }

      const data = await prisma.registration.findMany({
        where: whereClause,
        include: { subject: true },
      });

      const allocations = await prisma.branchAllocation.findMany({
        where: { semesterId: semesterId as string },
        select: {
          subjectId: true,
          branch: true,
          customCode: true,
          customName: true,
        },
      });
      const allocBySubjectBranch = new Map(
        allocations.map((a) => [`${a.subjectId}:${a.branch.toUpperCase()}`, a]),
      );

      data.forEach((r: any) => {
        const alloc =
          allocBySubjectBranch.get(
            `${r.subjectId}:${String(r.subject.department || branch || "").toUpperCase()}`,
          ) || allocations.find((a) => a.subjectId === r.subjectId);
        worksheet.addRow({
          studentId: r.studentId,
          batch: (r as any).batch || "",
          internalCode: r.subject.code,
          code: alloc?.customCode?.trim() || r.subject.code,
          name: alloc?.customName?.trim() || r.subject.name,
          status: r.status,
          createdAt: r.createdAt,
        });
      });
    } else {
      // Export Allocations
      worksheet.columns = [
        { header: "Branch", key: "branch" },
        { header: "Subject", key: "subject" },
        { header: "Status", key: "approved" },
      ];

      const data = await prisma.branchAllocation.findMany({
        where: { semesterId: semesterId as string, branch: branch as string },
        include: { subject: true },
      });

      data.forEach((d: any) => {
        worksheet.addRow({
          branch: d.branch,
          subject: d.customName || d.subject.name,
          approved: d.isApproved ? "Approved" : "Pending",
        });
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=AcademicExport_${type}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
};
/**
 * @desc Per-student registration completion for a semester (registered vs pending).
 * @access Dean, Webmaster, HOD, Director, COE
 */
export const getRegistrationTracking = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const role = resolveEffectiveRole(user);
  const allowed = new Set(["webmaster", "coe", "dean", "director", "hod"]);
  if (!allowed.has(role)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const {
    semesterId,
    branch,
    year,
    batch,
    status: regStatus = "all",
    query: searchQuery,
    page = "1",
    limit = "25",
  } = req.query;

  try {
    let sem = null;
    if (semesterId) {
      sem = await prisma.academicSemester.findUnique({
        where: { id: semesterId as string },
      });
    } else {
      sem = await prisma.academicSemester.findFirst({
        where: {
          status: { in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED"] },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!sem) {
      return res.json({
        success: true,
        semester: null,
        summary: { eligible: 0, registered: 0, pending: 0, percent: 0 },
        students: [],
        pagination: { page: 1, totalPages: 1, total: 0 },
      });
    }

    let branchFilter =
      branch && String(branch).toLowerCase() !== "all"
        ? String(branch).toUpperCase()
        : undefined;

    if (role === "hod") {
      branchFilter = resolveHodBranch(user);
      if (!branchFilter) {
        return res
          .status(400)
          .json({ error: "Could not determine HOD branch" });
      }
    }

    const yearFilter =
      year && String(year).toLowerCase() !== "all"
        ? String(year).toUpperCase()
        : undefined;
    const batchFilter =
      batch && String(batch).toLowerCase() !== "all"
        ? String(batch).toUpperCase()
        : sem.batch
          ? String(sem.batch).toUpperCase()
          : undefined;

    const searchBody: Record<string, unknown> = {
      limit: 10000,
      isSuspended: false,
    };
    if (branchFilter) searchBody.branch = branchFilter;
    if (yearFilter) searchBody.year = yearFilter;
    if (batchFilter) searchBody.batch = batchFilter;
    if (searchQuery && String(searchQuery).trim()) {
      searchBody.username = String(searchQuery).trim().toUpperCase();
    }

    const profilesRes = await axios.post(
      `${USER_SERVICE_URL}/student/search`,
      searchBody,
      {
        headers: { Authorization: req.headers.authorization || "" },
        timeout: 60000,
      },
    );

    const allStudents: any[] = profilesRes.data?.students || [];

    const regs = await prisma.registration.findMany({
      where: {
        semesterId: sem.id,
        status: "REGISTERED",
      },
      select: { studentId: true, submittedAt: true, createdAt: true },
    });

    const regByStudent = new Map<
      string,
      { count: number; submittedAt: Date | null }
    >();
    for (const r of regs) {
      const id = r.studentId.toUpperCase();
      const cur = regByStudent.get(id) || { count: 0, submittedAt: null };
      cur.count += 1;
      const submitted = r.submittedAt || r.createdAt;
      if (!cur.submittedAt || submitted > cur.submittedAt) {
        cur.submittedAt = submitted;
      }
      regByStudent.set(id, cur);
    }

    const enriched = allStudents.map((s) => {
      const id = String(s.username).toUpperCase();
      const info = regByStudent.get(id);
      const registered = !!info && info.count > 0;
      return {
        username: s.username,
        name: s.name,
        email: s.email,
        branch: s.branch,
        year: s.year,
        batch: s.batch,
        section: s.section,
        registered,
        subjectCount: info?.count ?? 0,
        submittedAt: info?.submittedAt ?? null,
      };
    });

    const filterOptions = {
      branches: [
        ...new Set(
          enriched
            .map((student) => String(student.branch || "").toUpperCase())
            .filter(Boolean),
        ),
      ].sort(),
      batches: [
        ...new Set(
          enriched
            .map((student) => String(student.batch || "").toUpperCase())
            .filter(Boolean),
        ),
      ].sort(),
    };

    const summary = {
      eligible: enriched.length,
      registered: enriched.filter((s) => s.registered).length,
      pending: enriched.filter((s) => !s.registered).length,
      percent: 0,
    };
    summary.percent = summary.eligible
      ? Math.round((summary.registered / summary.eligible) * 1000) / 10
      : 0;

    let filtered = enriched;
    if (regStatus === "registered") {
      filtered = enriched.filter((s) => s.registered);
    } else if (regStatus === "pending") {
      filtered = enriched.filter((s) => !s.registered);
    }

    filtered.sort((a, b) => {
      if (a.registered !== b.registered) return a.registered ? -1 : 1;
      return String(a.username).localeCompare(String(b.username));
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const students = filtered.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    res.json({
      success: true,
      semester: {
        id: sem.id,
        name: sem.name,
        status: sem.status,
        batch: sem.batch,
        academicYear: sem.academicYear,
      },
      summary,
      filterOptions,
      students,
      pagination: { page: pageNum, totalPages, total },
    });
  } catch (error) {
    console.error("Registration tracking error:", error);
    res.status(500).json({ error: "Failed to fetch registration tracking" });
  }
};

/**
 * @desc Get all registered students and their subjects
 * @access Dean, Webmaster
 */
export const getRegistrations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, semesterId, batch } = req.query;

  try {
    const where: any = {};
    let resolvedSemesterId = (semesterId as string) || undefined;
    if (resolvedSemesterId) {
      where.semesterId = resolvedSemesterId;
    } else {
      // Default to latest active semester
      const activeSem = await prisma.academicSemester.findFirst({
        where: {
          status: {
            in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "APPROVED"],
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (activeSem) {
        where.semesterId = activeSem.id;
        resolvedSemesterId = activeSem.id;
      }
    }

    // department/batch are stored canonically uppercase (AIML/CE/CSE…, O21…),
    // so exact match hits the index instead of the seq scan that
    // mode:"insensitive" forced.
    const branchKey =
      branch && branch !== "all" ? (branch as string).toUpperCase() : undefined;
    if (branchKey) {
      where.subject = { department: branchKey };
    }

    const batchKey =
      batch && batch !== "all" ? (batch as string).toUpperCase() : undefined;
    if (batchKey) {
      where.batch = batchKey;
    }

    // This admin list scans up to ~20k rows and is re-fetched on every filter
    // change / poll. A short Redis cache collapses the repeats; registrations
    // are eventually-consistent within 20s (fine for an admin overview).
    const cacheKey = `academics:getRegistrations:v2:${resolvedSemesterId || "none"}:${branchKey || "all"}:${batchKey || "all"}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));

    // Narrow select: the admin tables only render studentId, batch, status,
    // createdAt and subject {code,name}. Dropping the full subject payload and
    // the entirely-unused semester join is the bulk of the win on 20k rows.
    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        batch: true,
        status: true,
        createdAt: true,
        subject: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    await redis
      .setex(cacheKey, 20, JSON.stringify(registrations))
      .catch(() => {});
    res.json(registrations);
  } catch (error) {
    console.error("Get Registrations Error:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
};
/**
 * @desc Get summary of the current semester for the logged-in user
 */
export const getSemesterOverview = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Get the latest active semester
    const activeSem = await prisma.academicSemester.findFirst({
      where: {
        status: {
          in: [
            "DEAN_REVIEW",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "APPROVED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSem) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({ semester: null, data: null });
    }

    if (user.role === "student") {
      const studentId = normalizeStudentId(user.username);
      // For Students: Show registered subjects
      const registrations = await prisma.registration.findMany({
        where: {
          studentId: { equals: studentId, mode: "insensitive" },
          semesterId: activeSem.id,
          status: "REGISTERED",
        },
        include: { subject: true },
      });

      const totalCredits = registrations.reduce(
        (acc: number, r: any) => acc + r.subject.credits,
        0,
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({
        semester: activeSem,
        role: "student",
        data: {
          registrations: registrations.map((r: any) => ({
            id: r.id,
            subjectCode: r.subject.code,
            subjectName: r.subject.name,
            credits: r.subject.credits,
            registeredAt: r.createdAt,
          })),
          summary: {
            subjectCount: registrations.length,
            totalCredits,
          },
        },
      });
    } else {
      // For Admins/Faculty: Show branch-wise summary
      const branchAllocations = await prisma.branchAllocation.findMany({
        where: {
          semesterId: activeSem.id,
        },
        include: { subject: true },
      });

      // Group by branch
      const branchSummary: Record<string, any> = {};
      branchAllocations.forEach((alloc: any) => {
        if (!branchSummary[alloc.branch]) {
          branchSummary[alloc.branch] = {
            subjectCount: 0,
            totalCredits: 0,
            academicYears: new Set(),
            subjects: [],
          };
        }
        branchSummary[alloc.branch].subjects.push({
          code: alloc.customCode?.trim() || alloc.subject.code,
          internalCode: alloc.subject.code,
          name: alloc.customName || alloc.subject.name,
          credits: alloc.customCredits || alloc.subject.credits,
          year: alloc.academicYear,
          isApproved: alloc.isApproved,
          status: alloc.status,
          isMandatory: (alloc as any).isMandatory,
          electiveGroupId: (alloc as any).electiveGroupId,
          electiveLimit: (alloc as any).electiveLimit,
        });
        branchSummary[alloc.branch].subjectCount++;
        branchSummary[alloc.branch].totalCredits +=
          alloc.customCredits || alloc.subject.credits;
        if (alloc.academicYear)
          branchSummary[alloc.branch].academicYears.add(alloc.academicYear);
      });

      // Convert Sets to Arrays for JSON
      const finalBranchSummary = Object.entries(branchSummary).map(
        ([branch, details]) => ({
          branch,
          ...details,
          academicYears: Array.from(details.academicYears).sort(),
        }),
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.json({
        semester: activeSem,
        role: user.role,
        data: {
          branches: finalBranchSummary,
          summary: {
            totalBranches: finalBranchSummary.length,
            totalSubjects: branchAllocations.length,
          },
        },
      });
    }
  } catch (error) {
    console.error("Semester Overview Error:", error);
    res.status(500).json({ error: "Failed to fetch semester overview" });
  }
};

/**
 * @desc Download semester registration confirmation PDF (queued)
 * @access Student (own) | Admin roles
 */
export const downloadRegistrationPdf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const targetStudentId = normalizeStudentId(
    (req.query.studentId as string) || user.username,
  );
  const role = resolveEffectiveRole(user);
  const adminRoles = new Set([
    "webmaster",
    "dean",
    "director",
    "coe",
    "hod",
    "ao",
  ]);

  if (role === "student") {
    if (targetStudentId !== normalizeStudentId(user.username)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  } else if (!adminRoles.has(role)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  try {
    let sem = null;
    const semesterId = req.query.semesterId as string | undefined;
    if (semesterId) {
      sem = await prisma.academicSemester.findUnique({
        where: { id: semesterId },
      });
    } else {
      sem = await prisma.academicSemester.findFirst({
        where: {
          status: {
            in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "APPROVED"],
          },
          registrations: {
            some: {
              studentId: { equals: targetStudentId, mode: "insensitive" },
              status: "REGISTERED",
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!sem) {
        sem = await prisma.academicSemester.findFirst({
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (!sem) {
      return res.status(404).json({
        success: false,
        message: "No semester found for registration slip.",
      });
    }

    const registeredCount = await prisma.registration.count({
      where: {
        studentId: { equals: targetStudentId, mode: "insensitive" },
        semesterId: sem.id,
        status: "REGISTERED",
      },
    });

    if (!registeredCount) {
      return res.status(404).json({
        success: false,
        message: "No registered subjects found for this semester.",
      });
    }

    // Sync escape hatch for tiny/local debugging
    if (String(req.query.sync || "") === "1") {
      const registered = await prisma.registration.findMany({
        where: {
          studentId: { equals: targetStudentId, mode: "insensitive" },
          semesterId: sem.id,
          status: "REGISTERED",
        },
        include: { subject: true },
        orderBy: { subject: { code: "asc" } },
      });
      const pdfData = await buildRegistrationPdfData(
        targetStudentId,
        sem,
        registered,
        user,
      );
      const pdfBuffer = await generateRegistrationPdf(pdfData);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="REGISTRATION_${targetStudentId}_${sem.id}.pdf"`,
      );
      res.setHeader("Content-Type", "application/pdf");
      return res.send(pdfBuffer);
    }

    const jobId = randomUUID();
    const filename = `REGISTRATION_${targetStudentId}_${sem.id}.pdf`;
    await enqueueRegistrationPdfJob({
      jobId,
      kind: "single",
      semesterId: sem.id,
      studentId: targetStudentId,
      requestedBy: user.username,
      role,
      authHeader: String(req.headers.authorization || ""),
      filename,
    });

    return res.status(202).json({
      success: true,
      queued: true,
      jobId,
      filename,
      monitorUrl: `/academics/registrations/pdf/jobs/${jobId}`,
      downloadUrl: `/academics/registrations/pdf/jobs/${jobId}/download`,
      message: "Registration PDF queued. Poll monitorUrl then download.",
    });
  } catch (error: any) {
    console.error("Registration PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to queue registration PDF.",
    });
  }
};

type RegistrationRow = {
  id: string;
  subjectId: string;
  batch?: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  subject: { code: string; name: string; credits: number };
};

async function buildRegistrationPdfData(
  targetStudentId: string,
  sem: { id: string; name: string },
  registered: RegistrationRow[],
  user: AuthenticatedRequest["user"],
  profileOverride?: {
    name?: string;
    branch?: string;
    batch?: string;
    year?: string;
    campus?: string;
  } | null,
  semesterAllocations?: Array<{
    subjectId: string;
    branch: string;
    academicYear?: string | null;
    batch?: string | null;
    customName?: string | null;
    customCode?: string | null;
    customCredits?: number | null;
    subjectType?: string | null;
  }>,
): Promise<RegistrationPdfData> {
  let profileName = targetStudentId;
  let branch = "N/A";
  let batch = "";
  let year = "";
  let campus = "Ongole";

  if (profileOverride) {
    profileName = profileOverride.name || profileName;
    branch = profileOverride.branch || branch;
    batch = profileOverride.batch || "";
    year = profileOverride.year || "";
    campus = profileOverride.campus || campus;
  } else {
    try {
      const searchRes = await axios.post(
        `${USER_SERVICE_URL}/internal/bulk-profiles`,
        { usernames: [targetStudentId] },
        {
          headers: {
            "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
          },
          timeout: 10000,
        },
      );
      // User service returns { students: [...] } (not profiles).
      const profile =
        searchRes.data?.students?.[0] ||
        searchRes.data?.profiles?.[0] ||
        (Array.isArray(searchRes.data) ? searchRes.data[0] : null);
      if (profile) {
        profileName = profile.name || profileName;
        branch = profile.branch || profile.department || branch;
        batch = profile.batch || "";
        year = profile.year || "";
        campus = profile.campus || campus;
      }
    } catch {
      // Fall through — branch/year can still be recovered from allocations.
    }
  }

  const branchKey = branch !== "N/A" ? branch.toUpperCase() : null;
  type AllocRow = {
    subjectId: string;
    branch: string;
    academicYear?: string | null;
    batch?: string | null;
    customName?: string | null;
    customCode?: string | null;
    customCredits?: number | null;
    subjectType?: string | null;
  };
  let matchedAllocs: AllocRow[] = [];
  let allocBySubject: Map<
    string,
    {
      customName?: string | null;
      customCode?: string | null;
      customCredits?: number | null;
      subjectType?: string | null;
    }
  >;

  if (semesterAllocations) {
    matchedAllocs = semesterAllocations.filter(
      (a) =>
        registered.some((r) => r.subjectId === a.subjectId) &&
        (!branchKey || String(a.branch).toUpperCase() === branchKey),
    );
    allocBySubject = new Map(matchedAllocs.map((a) => [a.subjectId, a]));
  } else {
    const regAllocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: sem.id,
        subjectId: { in: registered.map((r) => r.subjectId) },
        ...(branchKey
          ? { branch: { equals: branch, mode: "insensitive" } }
          : {}),
      },
    });
    matchedAllocs = regAllocations;
    allocBySubject = new Map(regAllocations.map((a) => [a.subjectId, a]));
  }

  // Prefer registration allocation metadata when profile fields are missing,
  // and prefer allocation academic year for the slip (profile year can lag).
  if ((!branch || branch === "N/A") && matchedAllocs[0]?.branch) {
    branch = matchedAllocs[0].branch;
  }
  const allocYear =
    matchedAllocs.find((a) => a.academicYear)?.academicYear || "";
  if (allocYear) {
    year = allocYear;
  } else if (!year) {
    year = (user as any)?.year || "";
  }
  if (!batch) {
    batch =
      matchedAllocs.find((a) => a.batch)?.batch ||
      registered.find((r) => r.batch)?.batch ||
      "";
  }

  const subjects = registered.map((r) => {
    const alloc = allocBySubject.get(r.subjectId);
    return {
      code: alloc?.customCode?.trim() || r.subject.code,
      name: alloc?.customName?.trim() || r.subject.name,
      credits: alloc?.customCredits ?? r.subject.credits,
      type: alloc?.subjectType || "CORE",
    };
  });

  const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 0), 0);
  const submittedAt =
    registered[0]?.submittedAt || registered[0]?.createdAt || new Date();

  return {
    username: targetStudentId,
    name: profileName,
    branch,
    batch,
    year,
    campus,
    semesterName: sem.name,
    semesterId: sem.id,
    registrationId: registered[0].id,
    submittedAt,
    subjects,
    totalCredits,
  };
}

export const downloadBulkRegistrationPdfs = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const role = resolveEffectiveRole(user);
  const allowed = new Set(["webmaster", "coe", "dean", "director", "hod"]);
  if (!allowed.has(role)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const { semesterId, branch, year, batch, query: searchQuery } = req.query;

  try {
    let sem = null;
    if (semesterId) {
      sem = await prisma.academicSemester.findUnique({
        where: { id: semesterId as string },
      });
    } else {
      sem = await prisma.academicSemester.findFirst({
        where: {
          status: {
            in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "APPROVED"],
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!sem) {
      return res.status(404).json({
        success: false,
        message: "No semester found for bulk registration download.",
      });
    }

    let branchFilter =
      branch && String(branch).toLowerCase() !== "all"
        ? String(branch).toUpperCase()
        : undefined;

    if (role === "hod") {
      branchFilter = resolveHodBranch(user);
      if (!branchFilter) {
        return res.status(400).json({
          success: false,
          message: "Could not determine HOD branch",
        });
      }
    }

    const yearFilter =
      year && String(year).toLowerCase() !== "all"
        ? String(year).toUpperCase()
        : undefined;
    const batchFilter =
      batch && String(batch).toLowerCase() !== "all"
        ? String(batch).toUpperCase()
        : sem.batch
          ? String(sem.batch).toUpperCase()
          : undefined;

    const safeSem = sem.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const branchSuffix = branchFilter ? `_${branchFilter}` : "";
    const yearSuffix = yearFilter ? `_${yearFilter}` : "";
    const batchSuffix = batchFilter ? `_${batchFilter}` : "";
    const filename = `REGISTRATION_BULK_${safeSem}${batchSuffix}${branchSuffix}${yearSuffix}.pdf`;

    const jobId = randomUUID();
    await enqueueRegistrationPdfJob({
      jobId,
      kind: "bulk",
      semesterId: sem.id,
      branch: branchFilter,
      year: yearFilter,
      batch: batchFilter,
      query: searchQuery ? String(searchQuery) : undefined,
      requestedBy: user.username,
      role,
      authHeader: String(req.headers.authorization || ""),
      filename,
    });

    return res.status(202).json({
      success: true,
      queued: true,
      jobId,
      filename,
      monitorUrl: `/academics/registrations/pdf/jobs/${jobId}`,
      downloadUrl: `/academics/registrations/pdf/jobs/${jobId}/download`,
      message: "Bulk registration PDF queued. Poll monitorUrl then download.",
    });
  } catch (error: any) {
    console.error("Bulk Registration PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to queue bulk registration PDF.",
    });
  }
};

export const getRegistrationPdfJobStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const jobId = String(req.params.jobId || "");
  if (!jobId) {
    return res.status(400).json({ success: false, message: "jobId required" });
  }
  const progress = await getPdfProgress(jobId);
  if (!progress) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }
  return res.json({
    success: true,
    jobId,
    ...progress,
    downloadUrl:
      progress.status === "done"
        ? `/academics/registrations/pdf/jobs/${jobId}/download`
        : undefined,
  });
};

export const downloadRegistrationPdfJob = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const jobId = String(req.params.jobId || "");
  const progress = await getPdfProgress(jobId);
  if (!progress) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }
  if (progress.status !== "done") {
    return res.status(409).json({
      success: false,
      message: `PDF not ready (status=${progress.status})`,
      ...progress,
    });
  }
  const buffer = await getPdfResult(jobId);
  if (!buffer) {
    return res.status(410).json({
      success: false,
      message: "PDF expired. Please request a new download.",
    });
  }
  const filename = String(progress.filename || `registration-${jobId}.pdf`);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Cache-Control", "no-store");
  return res.send(buffer);
};

async function buildSinglePdfFromJob(data: RegistrationPdfJobData) {
  const sem = await prisma.academicSemester.findUnique({
    where: { id: data.semesterId },
  });
  if (!sem) throw new Error("Semester not found");
  const studentId = normalizeStudentId(data.studentId);
  const registered = await prisma.registration.findMany({
    where: {
      studentId: { equals: studentId, mode: "insensitive" },
      semesterId: sem.id,
      status: "REGISTERED",
    },
    include: { subject: true },
    orderBy: { subject: { code: "asc" } },
  });
  if (!registered.length) throw new Error("No registered subjects");

  const pdfData = await buildRegistrationPdfData(studentId, sem, registered, {
    username: data.requestedBy,
    role: data.role,
  } as any);
  const buffer = await generateRegistrationPdf(pdfData);
  return { buffer, filename: data.filename };
}

async function buildBulkPdfFromJob(data: RegistrationPdfJobData) {
  const sem = await prisma.academicSemester.findUnique({
    where: { id: data.semesterId },
  });
  if (!sem) throw new Error("Semester not found");

  const searchBody: Record<string, unknown> = {
    limit: 10000,
    isSuspended: false,
  };
  if (data.branch) searchBody.branch = data.branch;
  if (data.year) searchBody.year = data.year;
  if (data.batch) searchBody.batch = data.batch;
  if (data.query) searchBody.username = String(data.query).trim().toUpperCase();

  const profilesRes = await axios.post(
    `${USER_SERVICE_URL}/student/search`,
    searchBody,
    {
      headers: { Authorization: data.authHeader || "" },
      timeout: 60000,
    },
  );
  const allStudents: any[] = profilesRes.data?.students || [];

  const regs = await prisma.registration.findMany({
    where: { semesterId: sem.id, status: "REGISTERED" },
    include: { subject: true },
    orderBy: [{ studentId: "asc" }, { subject: { code: "asc" } }],
  });

  const regsByStudent = new Map<string, RegistrationRow[]>();
  for (const r of regs) {
    const id = normalizeStudentId(r.studentId);
    const list = regsByStudent.get(id) || [];
    list.push(r);
    regsByStudent.set(id, list);
  }

  const registeredStudents = allStudents
    .filter((s) => regsByStudent.has(normalizeStudentId(s.username)))
    .sort((a, b) =>
      String(a.username).localeCompare(String(b.username), undefined, {
        numeric: true,
      }),
    );

  if (!registeredStudents.length) {
    throw new Error("No registered students match these filters");
  }

  const semesterAllocations = await prisma.branchAllocation.findMany({
    where: { semesterId: sem.id },
  });

  const pdfDataList: RegistrationPdfData[] = [];
  for (const student of registeredStudents) {
    const studentId = normalizeStudentId(student.username);
    const registered = regsByStudent.get(studentId) || [];
    if (!registered.length) continue;
    const pdfData = await buildRegistrationPdfData(
      studentId,
      sem,
      registered,
      { username: data.requestedBy, role: data.role } as any,
      {
        name: student.name,
        branch: student.branch || student.department,
        batch: student.batch,
        year: student.year,
        campus: student.campus,
      },
      semesterAllocations,
    );
    pdfDataList.push(pdfData);
  }

  if (!pdfDataList.length) {
    throw new Error("No registration slips could be generated");
  }

  const buffer = await generateBulkRegistrationPdf(pdfDataList);
  return { buffer, filename: data.filename };
}

registerRegistrationPdfBuilder({
  buildSingle: buildSinglePdfFromJob,
  buildBulk: buildBulkPdfFromJob,
});
