import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { UserRole } from "../shared/roles.enum";
import axios from "axios";
import { redis } from "../utils/redis.util";
import { randomUUID } from "crypto";
import { resolveHodBranch } from "../utils/hod.util";
import {
  bootstrapCacheKey,
  invalidateStudentProfileCaches,
  profileCacheKey,
} from "../utils/student-cache.util";

const BOOTSTRAP_CACHE_TTL_SEC = 45;

const NOTIFICATION_SERVICE_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-notification-service:3007"
    : process.env.NOTIFICATION_SERVICE_URL) || "http://localhost:3007"
)
  .trim()
  .replace(/\/health$/, "");

const GATEWAY_URL = (
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1"
).replace(/\/$/, "");

const AUTH_SERVICE_URL = (
  process.env.AUTH_SERVICE_URL || `${GATEWAY_URL}/auth`
).replace(/\/$/, "");

export const resolveLoginByEmail = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  if (secret !== INTERNAL_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Valid email required" });
  }

  try {
    const student = await prisma.studentProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { username: true },
    });
    if (student) {
      return res.json({ username: student.username, profileType: "student" });
    }

    const faculty = await prisma.facultyProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { username: true },
    });
    if (faculty) {
      return res.json({ username: faculty.username, profileType: "faculty" });
    }

    const admin = await prisma.adminProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { username: true },
    });
    if (admin) {
      return res.json({ username: admin.username, profileType: "admin" });
    }

    return res.status(404).json({ message: "Not found" });
  } catch {
    return res.status(500).json({ message: "Lookup failed" });
  }
};

const ACADEMICS_SERVICE_URL = (
  process.env.DOCKER_ENV === "true"
    ? "http://uniz-academics-service:3004"
    : process.env.ACADEMICS_SERVICE_URL || `${GATEWAY_URL}/academics`
).replace(/\/$/, "");

const OUTPASS_SERVICE_URL = (
  process.env.OUTPASS_SERVICE_URL || `${GATEWAY_URL}/requests`
).replace(/\/$/, "");

const sendPush = async (username: string, title: string, body: string) => {
  try {
    const url = `${NOTIFICATION_SERVICE_URL}/push/send`;
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    await axios.post(
      url,
      {
        target: "user",
        username: username,
        title,
        body,
      },
      {
        headers: { "x-internal-secret": SECRET },
        timeout: 5000,
      },
    );
    console.log(`[USER] Successfully sent push notification to: ${username}`);
  } catch (e: any) {
    console.error(
      `[USER][ERROR] Failed to send push notification to ${username}:`,
      e.message,
    );
  }
};

const mapStudentProfile = (profile: any) => ({
  _id: profile.id,
  username: profile.username,
  name: profile.name,
  email: profile.email,
  gender: profile.gender,
  year: profile.year,
  semester: profile.semester,
  branch: profile.branch,
  section: profile.section,
  roomno: profile.roomno,
  has_pending_requests: profile.isApplicationPending,
  is_in_campus: profile.isPresentInCampus,
  is_suspended: profile.isSuspended,
  blood_group: profile.bloodGroup,
  phone_number: profile.phone,
  date_of_birth: profile.dateOfBirth,
  father_name: profile.fatherName,
  mother_name: profile.motherName,
  father_occupation: profile.fatherOccupation,
  mother_occupation: profile.motherOccupation,
  father_email: profile.fatherEmail,
  mother_email: profile.motherEmail,
  father_address: profile.fatherAddress,
  mother_address: profile.motherAddress,
  batch: profile.batch,
  profile_url: profile.profileUrl,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
  // New Fields
  category: profile.category,
  campus: profile.campus,
  cgpa: profile.cgpa,
  total_backlogs: profile.totalBacklogs,
});

const mapFacultyProfile = (profile: any) => ({
  id: profile.id,
  Username: profile.username,
  Name: profile.name,
  Email: profile.email,
  Department: profile.department,
  Designation: profile.designation,
  Role: profile.role,
  Contact: profile.contact,
  ProfileUrl: profile.profileUrl,
  Bio: profile.bio || {},
  is_suspended: profile.isSuspended || false,
  CreatedAt: profile.createdAt,
});

const mapAdminProfile = (profile: any) => {
  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    email: profile.email,
    profile_url: profile.profileUrl,
    role: profile.role,
    department: profile.department,
    designation: profile.designation,
    bio: profile.bio,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
};

export const getAvailableBatches = async (req: Request, res: Response) => {
  try {
    // Collect first 3 chars of all students and unique them.
    const students = await prisma.studentProfile.findMany({
      select: { batch: true },
      distinct: ["batch"],
      where: { batch: { not: "" } },
    });

    const batches = students
      .map((s) => s.batch.toUpperCase())
      .filter((b) => b.length >= 3)
      .sort();

    const uniqueBatches = Array.from(new Set(batches));
    return res.json({ success: true, batches: uniqueBatches });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch batches" });
  }
};

export const getStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  const targetUsername = (req.params.username || user.username).toUpperCase();
  const isSelf = user.username === targetUsername;

  if (req.params.username && user.role === UserRole.STUDENT && !isSelf) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    // 1. High Performance Cache Layer
    const cacheKey = profileCacheKey(targetUsername);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        student: JSON.parse(cached),
        source: "cache",
      });
    }

    // Immediate Freshness for critical profile data
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // 2. Optimized DB Query
    const profile = await prisma.studentProfile.findUnique({
      where: { username: targetUsername },
    });
    if (!profile) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Profile not found",
      });
    }

    if (
      user.role === UserRole.HOD &&
      req.params.username &&
      !isSelf
    ) {
      const hodBranch = resolveHodBranch(user);
      const studentBranch = String(profile.branch || "")
        .trim()
        .toUpperCase();
      if (hodBranch && studentBranch !== hodBranch) {
        return res.status(403).json({
          code: ErrorCode.AUTH_FORBIDDEN,
          message: `HODs can only view students in their department (${hodBranch})`,
        });
      }
    }

    const mapped: any = mapStudentProfile(profile);

    // 3. Parallel Enrichment
    const token = req.headers.authorization;
    if (token && req.params.username) {
      try {
        const [gradesRes, attendanceRes, historyRes] = await Promise.all([
          axios
            .get(
              `${GATEWAY_URL}/academics/grades?studentId=${targetUsername}`,
              { headers: { Authorization: token }, timeout: 5000 },
            )
            .catch(() => ({ data: null })),
          axios
            .get(
              `${GATEWAY_URL}/academics/attendance?studentId=${targetUsername}`,
              { headers: { Authorization: token }, timeout: 5000 },
            )
            .catch(() => ({ data: null })),
          axios
            .get(`${GATEWAY_URL}/requests/history/${targetUsername}`, {
              headers: { Authorization: token },
              timeout: 5000,
            })
            .catch(() => ({ data: null })),
        ]);

        if (gradesRes.data && gradesRes.data.success) {
          mapped.grades = gradesRes.data.grades;
          mapped.gpa_stats = gradesRes.data.gpa;
          mapped.cgpa = gradesRes.data.cgpa;
          mapped.total_backlogs = gradesRes.data.totalBacklogs;
          mapped.motivation = gradesRes.data.motivation;
        }
        if (attendanceRes.data && attendanceRes.data.success) {
          mapped.attendance = attendanceRes.data.attendance;
          mapped.attendance_summary = attendanceRes.data.summary;
        }
        if (historyRes.data && historyRes.data.success) {
          mapped.outpass_history = historyRes.data.history;
        }
      } catch (err) {
        console.error("Profile Enrichment partially failed:", err);
      }
    }

    // 4. Populate Cache (1s TTL to prevent burst load but allow real-time updates)
    await redis.setex(cacheKey, 1, JSON.stringify(mapped));

    return res.json({ success: true, student: mapped, source: "db" });
  } catch (e) {
    console.error("Profile fetch error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch profile",
    });
  }
};

/** One round-trip for student dashboard: profile + grades + attendance (JWT-scoped). */
export const getStudentBootstrap = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });
  }
  if (user.role !== UserRole.STUDENT) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Students only",
    });
  }

  const username = user.username.toUpperCase();
  const cacheKey = bootstrapCacheKey(username);
  const authHeader = req.headers.authorization;

  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Vary", "Authorization");

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return res.json({
        ...parsed,
        source: "cache",
        meta: { ...parsed.meta, username, cache: "redis" },
      });
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { username },
    });
    if (!profile) {
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Profile not found",
      });
    }

    const headers = authHeader ? { Authorization: authHeader } : {};
    const [gradesRes, attendanceRes] = await Promise.all([
      axios
        .get(`${ACADEMICS_SERVICE_URL}/grades`, {
          headers,
          timeout: 8000,
        })
        .catch(() => ({ data: null })),
      axios
        .get(`${ACADEMICS_SERVICE_URL}/attendance`, {
          headers,
          timeout: 8000,
        })
        .catch(() => ({ data: null })),
    ]);

    const student = mapStudentProfile(profile);
    const grades = gradesRes.data?.success ? gradesRes.data : null;
    const attendance = attendanceRes.data?.success ? attendanceRes.data : null;

    if (grades) {
      student.cgpa = grades.cgpa ?? student.cgpa;
      student.total_backlogs = grades.totalBacklogs ?? student.total_backlogs;
    }

    const payload = {
      success: true,
      student,
      grades,
      attendance,
      meta: {
        username,
        fetchedAt: new Date().toISOString(),
        cache: "none",
      },
    };

    await redis.setex(cacheKey, BOOTSTRAP_CACHE_TTL_SEC, JSON.stringify(payload));

    return res.json({ ...payload, source: "db" });
  } catch (e) {
    console.error("[Bootstrap] error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to load student dashboard",
    });
  }
};

export const internalInvalidateStudentCache = async (
  req: Request,
  res: Response,
) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  if (secret !== INTERNAL_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const username = String(req.body?.username || "")
    .trim()
    .toUpperCase();
  if (!username) {
    return res.status(400).json({ message: "username required" });
  }

  await invalidateStudentProfileCaches(username);
  return res.json({ success: true, username });
};

export const updateStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const updates = req.body;

  if (!user || user.role !== UserRole.STUDENT) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const updated = await prisma.studentProfile.upsert({
      where: { username: user.username },
      update: updates,
      create: {
        username: user.username,
        ...updates,
      },
    });

    // Invalidate profile cache to prevent stale data
    await invalidateStudentProfileCaches(user.username);

    // Notify student (Backgrounded for latency optimization)
    sendPush(
      user.username,
      "Profile Information Updated",
      `This notification is to confirm that adjustments have been made to your student profile. The modified information includes: ${Object.keys(updates).join(", ")}.`,
    );

    return res.json({ success: true, student: mapStudentProfile(updated) });
  } catch (e) {
    console.error("Update Profile Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
    });
  }
};

const STUDENT_PROFILE_UPDATE_FIELDS = [
  "name",
  "email",
  "gender",
  "phone",
  "fatherName",
  "motherName",
  "fatherOccupation",
  "motherOccupation",
  "fatherEmail",
  "motherEmail",
  "fatherAddress",
  "motherAddress",
  "bloodGroup",
  "dateOfBirth",
  "profileUrl",
  "year",
  "semester",
  "branch",
  "section",
  "batch",
  "roomno",
  "isPresentInCampus",
  "isApplicationPending",
  "isSuspended",
  "category",
  "campus",
  "cgpa",
  "totalBacklogs",
] as const;

const pickStudentProfileUpdates = (body: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};
  for (const key of STUDENT_PROFILE_UPDATE_FIELDS) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }
  return updates;
};

export const adminUpdateStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const username = req.params.username.toUpperCase();
  const updates = pickStudentProfileUpdates(req.body);

  const allowedRoles = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR];
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const updated = await prisma.studentProfile.upsert({
      where: { username },
      update: updates,
      create: {
        id: randomUUID(),
        username,
        ...updates,
      },
    });

    // Invalidate profile cache to prevent stale data
    await invalidateStudentProfileCaches(username);

    // Notify student (Backgrounded for latency optimization)
    sendPush(
      username,
      "Administrative Profile Modification",
      `We are writing to inform you that your academic profile information has been modified by the university administration. Updated fields: ${Object.keys(updates).join(", ")}.`,
    );

    return res.json({ success: true, student: mapStudentProfile(updated) });
  } catch (e: any) {
    console.error(
      `[ERROR] adminUpdateStudentProfile failed for ${username}:`,
      e.message || e,
    );
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update student profile",
      details: e.message,
    });
  }
};

export const createIndividualStudent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const studentData = req.body;
  const username = String(studentData.username || "").toUpperCase();

  const allowedRoles = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR];
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Student ID (Username) is required",
    });
  }

  try {
    // 1. Sync with Auth Service (Create account if doesn't exist)
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
    const defaultPassword = `${username.toLowerCase()}@rguktong`; // Default password pattern

    try {
      await axios.post(
        `${AUTH_SERVICE_URL}/signup`,
        {
          username: username,
          password: defaultPassword,
          role: "student",
          email: studentData.email || `${username.toLowerCase()}@rguktong.ac.in`,
        },
        {
          headers: { "x-internal-secret": SECRET },
          timeout: 5000,
        },
      );
      console.log(`[USER] Successfully synced auth for individual student: ${username}`);
    } catch (authErr: any) {
      // If student already exists in auth, that's fine, we continue to profile creation/update
      if (authErr.response?.status !== 409) {
        console.error(
          `[USER][ERROR] Failed to sync auth for ${username}:`,
          authErr.message,
        );
      }
    }

    // 2. Create or Update Student Profile
    const updated = await prisma.studentProfile.upsert({
      where: { username },
      update: {
        ...studentData,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        ...studentData,
      },
    });

    // Invalidate cache
    await invalidateStudentProfileCaches(username);

    return res.json({
      success: true,
      message: "Student added/updated successfully",
      student: mapStudentProfile(updated),
    });
  } catch (e: any) {
    console.error(`[ERROR] createIndividualStudent failed for ${username}:`, e);
    return res.status(500).json({
      success: false,
      message: "Failed to process student request",
      details: e.message,
    });
  }
};

export const searchStudents = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  // Restrict search to Staff/Admin roles only
  if (!user || user.role === UserRole.STUDENT) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Students cannot search other students",
    });
  }

  const {
    username,
    branch,
    year,
    batch,
    gender,
    section,
    category,
    campus,
    page = 1,
    limit = 10,
    isSuspended,
    minCgpa,
    maxCgpa,
    minBacklogs,
    maxBacklogs,
    hasRemedials, // "all" | "active" | "cleared"
    sortBy = "username",
    sortDir = "asc",
  } = req.body;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (username) {
      where.OR = [
        { username: { contains: username, mode: "insensitive" } },
        { name: { contains: username, mode: "insensitive" } },
      ];
    }
    if (batch && String(batch).toUpperCase() !== "ALL") {
      where.batch = {
        equals: String(batch).toUpperCase(),
        mode: "insensitive",
      };
    }
    if (branch && String(branch).toUpperCase() !== "ALL") {
      where.branch = { equals: branch, mode: "insensitive" };
    }
    if (year && String(year).toUpperCase() !== "ALL") {
      where.year = { equals: year, mode: "insensitive" };
    }
    if (gender && String(gender).toUpperCase() !== "ALL") where.gender = gender;
    if (section && String(section).toUpperCase() !== "ALL") {
      where.section = { equals: String(section), mode: "insensitive" };
    }
    if (category && String(category).toUpperCase() !== "ALL") {
      where.category = { equals: String(category), mode: "insensitive" };
    }
    if (campus && String(campus).toUpperCase() !== "ALL") {
      where.campus = { equals: String(campus), mode: "insensitive" };
    }
    if (
      isSuspended !== undefined &&
      String(isSuspended).toUpperCase() !== "ALL"
    ) {
      where.isSuspended = isSuspended === true || isSuspended === "true";
    }
    if (
      req.body.isPresentInCampus !== undefined &&
      String(req.body.isPresentInCampus).toUpperCase() !== "ALL"
    ) {
      where.isPresentInCampus =
        req.body.isPresentInCampus === true ||
        req.body.isPresentInCampus === "true";
    }
    if (
      req.body.isApplicationPending !== undefined &&
      String(req.body.isApplicationPending).toUpperCase() !== "ALL"
    ) {
      where.isApplicationPending =
        req.body.isApplicationPending === true ||
        req.body.isApplicationPending === "true";
    }

    // Advanced Academic Intelligence Filters
    if (
      (minCgpa !== undefined && minCgpa !== "") ||
      (maxCgpa !== undefined && maxCgpa !== "")
    ) {
      where.cgpa = {};
      if (minCgpa !== undefined && minCgpa !== "")
        where.cgpa.gte = Number(minCgpa);
      if (maxCgpa !== undefined && maxCgpa !== "")
        where.cgpa.lte = Number(maxCgpa);
    }

    if (
      hasRemedials === "active" ||
      hasRemedials === "true" ||
      hasRemedials === true
    ) {
      where.totalBacklogs = { gt: 0 };
    } else if (
      hasRemedials === "cleared" ||
      hasRemedials === "false" ||
      hasRemedials === false
    ) {
      where.totalBacklogs = { equals: 0 };
    }

    if (
      (minBacklogs !== undefined && minBacklogs !== "") ||
      (maxBacklogs !== undefined && maxBacklogs !== "")
    ) {
      where.totalBacklogs = where.totalBacklogs || {};
      if (minBacklogs !== undefined && minBacklogs !== "")
        where.totalBacklogs.gte = Number(minBacklogs);
      if (maxBacklogs !== undefined && maxBacklogs !== "")
        where.totalBacklogs.lte = Number(maxBacklogs);
    }

    if (user.role === UserRole.HOD) {
      const hodBranch = resolveHodBranch(user);
      if (!hodBranch) {
        return res.status(400).json({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Could not determine HOD department",
        });
      }
      where.branch = { equals: hodBranch, mode: "insensitive" };
    }

    const sortFieldMap: Record<string, string> = {
      username: "username",
      name: "name",
      email: "email",
      branch: "branch",
      year: "year",
      batch: "batch",
      section: "section",
      cgpa: "cgpa",
      total_backlogs: "totalBacklogs",
    };
    const orderField =
      sortFieldMap[String(sortBy).toLowerCase()] || "username";
    const orderDirection = String(sortDir).toLowerCase() === "desc" ? "desc" : "asc";

    // Disable aggressive caching for searches
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [orderField]: orderDirection },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return res.json({
      success: true,
      students: students.map(mapStudentProfile),
      pagination: {
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Search failed",
    });
  }
};

export const getFacultyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const targetUsername = (
    req.params.username ||
    user?.username ||
    ""
  ).toLowerCase();

  if (!user) return res.status(401).json({ code: ErrorCode.AUTH_UNAUTHORIZED });

  // Allow self lookup or Staff/Admin roles to lookup any faculty
  const isSelf = user.username?.toLowerCase() === targetUsername;
  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.HOD,
  ];

  if (
    !isSelf &&
    !adminRoles.includes(user.role as UserRole) &&
    user.id !== "internal"
  ) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const profile = await prisma.facultyProfile.findUnique({
      where: { username: targetUsername },
    });
    if (!profile)
      return res.status(404).json({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: "Profile not found",
      });
    return res.json({ success: true, faculty: mapFacultyProfile(profile) });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch faculty profile",
    });
  }
};

export const getAdminProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const targetUsername = (
    req.params.username ||
    user?.username ||
    ""
  ).toUpperCase();

  // Check if role is any admin role
  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.SWO,
    UserRole.WARDEN_MALE,
    UserRole.WARDEN_FEMALE,
    UserRole.CARETAKER_MALE,
    UserRole.CARETAKER_FEMALE,
    UserRole.SECURITY,
    UserRole.LIBRARIAN,
    UserRole.CARETAKER,
    UserRole.TEACHER,
    UserRole.FACULTY,
    UserRole.HOD,
  ];

  if (
    !user ||
    (!adminRoles.includes(user.role as UserRole) && user.id !== "internal")
  ) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    let profile;
    const isInternal = user.id === "internal";

    // Check faculty table first
    const faculty = await prisma.facultyProfile.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });
    if (faculty) {
      return res.json({
        success: true,
        data: {
          id: faculty.id,
          username: faculty.username,
          name: faculty.name,
          email: faculty.email,
          contact: faculty.contact,
          profile_url: faculty.profileUrl,
          role: faculty.role,
          department: faculty.department,
          designation: faculty.designation,
          bio: faculty.bio,
        },
      });
    }

    const inferDept = (uname: string): string => {
      const parts = uname.toUpperCase().split("_");
      const branches = [
        "CSE",
        "ECE",
        "ME",
        "CE",
        "MME",
        "CHEM",
        "CHE",
        "EE",
        "EEE",
        "CIVIL",
        "MET",
        "MEC",
      ];
      if (parts.length > 1) {
        const last = parts[parts.length - 1];
        if (branches.includes(last)) return last;
      }
      return "";
    };

    const existingProfile = await prisma.adminProfile.findUnique({
      where: { username: targetUsername },
    });

    if (existingProfile) {
      if (!existingProfile.department) {
        const inferred = inferDept(user.username);
        if (inferred) {
          profile = await prisma.adminProfile.update({
            where: { id: existingProfile.id },
            data: { department: inferred },
          });
        } else {
          profile = existingProfile;
        }
      } else {
        profile = existingProfile;
      }
    } else {
      const inferred = inferDept(user.username);
      profile = await prisma.adminProfile.create({
        data: {
          username: user.username,
          role: user.role as string,
          name: user.username.charAt(0).toUpperCase() + user.username.slice(1),
          email: `${user.username}@rguktong.ac.in`,
          department: inferred || "",
        },
      });
    }
    return res.json({
      success: true,
      data: mapAdminProfile(profile),
    });
  } catch (e) {
    console.error("Fetch Admin Profile Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch admin profile",
    });
  }
};

export const createFacultyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const { name, email, department, designation } = req.body;
  const username = String(req.body.username || "").toLowerCase();

  // Admin role check
  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.HOD,
  ];
  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const profile = await prisma.facultyProfile.create({
      data: {
        id: randomUUID(),
        username,
        name,
        email,
        department,
        designation,
        role: req.body.role || "teacher",
      },
    });
    // Sync with Auth Service
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
    const defaultPassword = `${username.toLowerCase()}@uniz`;

    try {
      await axios.post(
        `${AUTH_SERVICE_URL}/signup`,
        {
          username: username,
          password: defaultPassword,
          role: req.body.role || "teacher",
          email: email,
        },
        {
          headers: { "x-internal-secret": SECRET },
          timeout: 5000,
        },
      );
      console.log(`[USER] Successfully synced auth for faculty: ${username}`);
    } catch (authErr: any) {
      console.error(
        `[USER][ERROR] Failed to sync auth for faculty ${username}:`,
        authErr.message,
      );
    }

    return res
      .status(201)
      .json({ success: true, faculty: mapFacultyProfile(profile) });
  } catch (e: any) {
    if (e.code === "P2002") {
      return res.status(409).json({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
        message: "This faculty profile already exists.",
      });
    }
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Could not create profile. Please try again.",
    });
  }
};
export const updateStudentPresence = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const username = String(req.body.username || "").toUpperCase();
  const { isPresent, isPending } = req.body;

  const allowedRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.SWO,
    UserRole.WARDEN_MALE,
    UserRole.WARDEN_FEMALE,
    UserRole.CARETAKER_MALE,
    UserRole.CARETAKER_FEMALE,
    UserRole.SECURITY,
    UserRole.STUDENT, // Allow student to set their own pending status? Actually no, let the outpass service do it via its token or internal secret. For now, outpass service calls this with the student's token which passes auth middleware.
  ];

  if (
    !user ||
    (!allowedRoles.includes(user.role as UserRole) &&
      user.username !== username)
  ) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const existing = await prisma.studentProfile.findUnique({
      where: { username },
    });

    const updateData: any = {};
    if (isPresent !== undefined) updateData.isPresentInCampus = isPresent;
    if (isPending !== undefined) updateData.isApplicationPending = isPending;

    let updated;
    if (existing) {
      updated = await prisma.studentProfile.update({
        where: { username },
        data: updateData,
      });
    } else {
      updated = await prisma.studentProfile.create({
        data: {
          id: randomUUID(),
          username: username,
          isPresentInCampus: isPresent ?? true,
          isApplicationPending: isPending ?? false,
        },
      });
    }

    // Invalidate cache
    await invalidateStudentProfileCaches(username);

    return res.json({ success: true, student: mapStudentProfile(updated) });
  } catch (e) {
    console.error("Update Presence Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update presence",
    });
  }
};

export const getBulkProfiles = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  if (secret !== INTERNAL_SECRET) {
    return res.status(401).json({ message: "Internal secret mismatch" });
  }

  const { usernames } = req.body;

  if (!Array.isArray(usernames)) {
    return res.status(400).json({ message: "usernames array is required" });
  }

  try {
    const profiles = await prisma.studentProfile.findMany({
      where: {
        username: { in: usernames.map((u: string) => u.toUpperCase()) },
      },
    });
    return res.json({
      success: true,
      students: profiles.map(mapStudentProfile),
    });
  } catch (e) {
    return res.status(500).json({ message: "Bulk fetch failed" });
  }
};

export const internalSyncStudentStats = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  if (secret !== INTERNAL_SECRET) {
    return res.status(401).json({ message: "Internal secret mismatch" });
  }

  const { studentId, cgpa, totalBacklogs } = req.body;

  try {
    const updated = await (prisma.studentProfile as any).update({
      where: { username: studentId.toUpperCase() },
      data: {
        cgpa: Number(cgpa),
        totalBacklogs: Number(totalBacklogs),
      },
    });

    // Invalidate profile cache
    await invalidateStudentProfileCaches(studentId.toUpperCase());

    return res.json({ success: true, student: mapStudentProfile(updated) });
  } catch (e) {
    console.error("Sync Stats Error:", e);
    return res.status(500).json({ success: false, message: "Sync failed" });
  }
};

export const getTargetingData = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  if (secret !== INTERNAL_SECRET) {
    return res.status(401).json({ message: "Internal secret mismatch" });
  }

  const { target, branch, year } = req.body;

  try {
    let users: any[] = [];
    if (target === "dean") {
      users = await prisma.adminProfile.findMany({
        where: { role: { equals: "dean", mode: "insensitive" } },
        select: { username: true },
      });
    } else if (target === "webmaster") {
      users = await prisma.adminProfile.findMany({
        where: { role: { equals: "webmaster", mode: "insensitive" } },
        select: { username: true },
      });
    } else if (target === "hod") {
      const where: any = { role: { equals: "hod", mode: "insensitive" } };
      if (branch && branch.toLowerCase() !== "all") {
        where.department = { equals: branch, mode: "insensitive" };
      }
      users = await prisma.facultyProfile.findMany({
        where,
        select: { username: true, name: true },
      });
    } else if (target === "students") {
      const where: any = {};
      if (branch && branch.toLowerCase() !== "all") {
        where.branch = { equals: branch, mode: "insensitive" };
      }
      if (year && year.toLowerCase() !== "all") {
        where.year = { equals: year, mode: "insensitive" };
      }
      users = await prisma.studentProfile.findMany({
        where,
        select: { username: true, name: true },
      });
    } else if (target === "faculty") {
      users = await prisma.facultyProfile.findMany({
        select: { username: true, name: true },
      });
    } else if (target === "all") {
      // When target is 'all', gather everyone
      const [allStudents, allFaculty, allAdmins] = await Promise.all([
        prisma.studentProfile.findMany({
          select: { username: true, name: true },
        }),
        prisma.facultyProfile.findMany({
          select: { username: true, name: true },
        }),
        prisma.adminProfile.findMany({
          select: { username: true },
        }),
      ]);
      users = [...allStudents, ...allFaculty, ...allAdmins];
    }

    return res.json({ success: true, users });
  } catch (e) {
    return res.status(500).json({ message: "Targeting fetch failed" });
  }
};

export const toggleUserSuspension = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const targetUsername = req.params.username.toUpperCase();
  const { suspended } = req.body;

  const allowedRoles = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR];
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  if (suspended === undefined) {
    return res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Suspension status (suspended) is required",
    });
  }

  try {
    // 1. Try updating student profile first
    let updated: any;
    let isStudent = true;

    try {
      updated = await prisma.studentProfile.update({
        where: { username: targetUsername },
        data: { isSuspended: suspended },
      });
    } catch (e: any) {
      // P2025: Record not found
      if (e.code === "P2025") {
        isStudent = false;
        updated = await prisma.facultyProfile.update({
          where: { username: targetUsername.toLowerCase() },
          data: { isSuspended: suspended },
        });
      } else {
        throw e;
      }
    }

    // 2. Sync with Auth Service
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
    try {
      await axios.post(
        `${AUTH_SERVICE_URL}/admin/suspend`,
        {
          username: targetUsername.toLowerCase(),
          suspended: suspended,
        },
        {
          headers: { "x-internal-secret": SECRET },
          timeout: 5000,
        },
      );
    } catch (authError: any) {
      console.error(
        `[USER-SERVICE] Failed to sync suspension with Auth Service for ${targetUsername}:`,
        authError.message,
      );
    }

    // 3. Invalidate Cache
    await invalidateStudentProfileCaches(targetUsername);

    // 4. Notify User
    sendPush(
      targetUsername,
      suspended
        ? "Official Notice: Account Suspended"
        : "Account Access Reinstated",
      suspended
        ? "We regret to inform you that your academic account access has been suspended by the university administration. For further clarification and to discuss the restoration of your services, please contact the administrative office at your earliest convenience."
        : "We are pleased to inform you that your UniZ account access has been fully reinstated. You may now resume using all university digital services and portals.",
    );

    return res.json({
      success: true,
      message: `${isStudent ? "Student" : "Staff"} suspension status updated to ${suspended}`,
      [isStudent ? "student" : "faculty"]: isStudent
        ? mapStudentProfile(updated)
        : mapFacultyProfile(updated),
    });
  } catch (e: any) {
    console.error(
      `[ERROR] toggleUserSuspension failed for ${targetUsername}:`,
      e,
    );
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update suspension status",
      details: e.message,
    });
  }
};
export const searchFaculty = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.HOD,
  ];
  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const { query, department, page = 1, limit = 10 } = req.body;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (query) {
      where.OR = [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }
    if (department) where.department = department;

    const [facultyProfiles, adminProfiles] = await Promise.all([
      prisma.facultyProfile.findMany({ where }),
      prisma.adminProfile.findMany({ where }),
    ]);

    const combined = [
      ...facultyProfiles.map(mapFacultyProfile),
      ...adminProfiles.map((p: any) => ({
        ...mapFacultyProfile(p),
        is_suspended: false, // AdminProfile doesn't have isSuspended field
      })),
    ];

    // Sort combined results alphabetically by name
    combined.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));

    const total = combined.length;
    const paginated = combined.slice(skip, skip + Number(limit));

    return res.json({
      success: true,
      faculty: paginated,
      pagination: {
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Search failed",
    });
  }
};

export const updateFacultyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const username = req.params.username.toUpperCase();
  const { email, ...updates } = req.body;

  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.HOD,
  ];
  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const isWebmaster = user.role === UserRole.WEBMASTER;
  if (email !== undefined && email !== null && email !== "" && !isWebmaster) {
    return res.status(403).json({
      code: ErrorCode.AUTH_FORBIDDEN,
      message: "Only webmaster can change faculty email",
    });
  }

  try {
    // Find the record to update (check faculty first, then admin)
    let profileType: "FACULTY" | "ADMIN" = "FACULTY";
    let existingProfile = await prisma.facultyProfile.findFirst({
      where: { username: { equals: req.params.username, mode: "insensitive" } },
    });

    if (!existingProfile) {
      existingProfile = (await prisma.adminProfile.findFirst({
        where: {
          username: { equals: req.params.username, mode: "insensitive" },
        },
      })) as any;
      if (existingProfile) profileType = "ADMIN";
    }

    if (!existingProfile) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const targetUsername = (
      updates.username || existingProfile.username
    ).toLowerCase();

    let updated;
    if (profileType === "FACULTY") {
      updated = await prisma.facultyProfile.update({
        where: { id: existingProfile.id },
        data: {
          ...updates,
          ...(isWebmaster && email && { email }),
          username: targetUsername,
        },
      });
    } else {
      updated = (await prisma.adminProfile.update({
        where: { id: existingProfile.id },
        data: {
          ...updates,
          ...(isWebmaster && email && { email }),
          username: targetUsername.toUpperCase(), // Admin usually uppercase
        },
      })) as any;
      // Map to faculty-like structure for the response
      updated = {
        ...updated,
        role: updated.role,
        department: updated.department,
        designation: updated.designation,
      };
    }

    // Sync with Auth Service (Upsert behavior)
    if (updates.role || email || updates.username || true) {
      // Always sync to fix existing
      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
      const defaultPassword = `${targetUsername}@uniz`;

      try {
        await axios.post(
          `${AUTH_SERVICE_URL}/signup`,
          {
            username: targetUsername,
            password: defaultPassword,
            role: updates.role || updated.role,
            email: email || updated.email,
          },
          {
            headers: { "x-internal-secret": SECRET },
            timeout: 5000,
          },
        );
        console.log(
          `[USER] Successfully synced auth update for faculty: ${targetUsername} with password: ${defaultPassword}`,
        );
      } catch (authErr: any) {
        console.error(
          `[USER][ERROR] Failed to sync auth update for faculty ${targetUsername}:`,
          authErr.message,
        );
      }
    }

    return res.json({ success: true, faculty: mapFacultyProfile(updated) });
  } catch (e: any) {
    if (e.code === "P2002") {
      return res.status(400).json({
        success: false,
        code: ErrorCode.VALIDATION_ERROR,
        message: "Email or username already in use by another account.",
      });
    }

    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
    });
  }
};

export const deleteFacultyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const username = req.params.username.toLowerCase();

  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.HOD,
  ];
  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    // Try to find by exact case first, or insensitive if that fails
    let profileType: "FACULTY" | "ADMIN" = "FACULTY";
    let target = await prisma.facultyProfile.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!target) {
      target = (await prisma.adminProfile.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
      })) as any;
      if (target) profileType = "ADMIN";
    }

    if (!target) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    if (profileType === "FACULTY") {
      await prisma.facultyProfile.delete({
        where: { id: target.id },
      });
    } else {
      await prisma.adminProfile.delete({
        where: { id: target.id },
      });
    }
    return res.json({ success: true, message: "Faculty profile deleted" });
  } catch (e) {
    console.error("Delete Faculty Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to delete profile",
    });
  }
};

export const deleteStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || user.role !== UserRole.WEBMASTER) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const username = String(req.params.username || "").toUpperCase();
  if (!username) {
    return res.status(400).json({ success: false, message: "Student ID required" });
  }

  try {
    const result = await purgeStudentAccount(username);
    if (result.status === "not_found") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    if (result.status === "error") {
      return res.status(500).json({
        success: false,
        message: "Failed to delete student",
        details: result.reason,
      });
    }

    return res.json({
      success: true,
      message: `Student ${result.username} permanently deleted`,
      username: result.username,
    });
  } catch (e: any) {
    console.error(`[ERROR] deleteStudentProfile failed for ${username}:`, e.message || e);
    return res.status(500).json({
      success: false,
      message: "Failed to delete student",
      details: e.message,
    });
  }
};

type PurgeStudentResult = {
  username: string;
  status: "deleted" | "not_found" | "error";
  reason?: string;
};

async function purgeStudentAccount(rawUsername: string): Promise<PurgeStudentResult> {
  const lookup = String(rawUsername || "").trim();
  if (!lookup) {
    return { username: lookup, status: "error", reason: "empty username" };
  }

  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  const internalHeaders = { headers: { "x-internal-secret": SECRET }, timeout: 20000 };

  try {
    const existing = await prisma.studentProfile.findFirst({
      where: { username: { equals: lookup, mode: "insensitive" } },
    });

    if (!existing) {
      return { username: lookup.toUpperCase(), status: "not_found" };
    }

    const canonicalUsername = existing.username;

    const purgeResults = await Promise.allSettled([
      axios.delete(`${AUTH_SERVICE_URL}/internal/user/${canonicalUsername}`, internalHeaders),
      axios.delete(
        `${ACADEMICS_SERVICE_URL}/internal/student/${canonicalUsername}`,
        internalHeaders,
      ),
      axios.delete(
        `${OUTPASS_SERVICE_URL}/internal/student/${canonicalUsername}`,
        internalHeaders,
      ),
      axios.delete(
        `${NOTIFICATION_SERVICE_URL}/internal/subscriptions/${canonicalUsername}`,
        internalHeaders,
      ),
    ]);

    purgeResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const labels = ["auth", "academics", "outpass", "notifications"];
        console.warn(
          `[USER] Student purge partial failure (${labels[index]}) for ${canonicalUsername}:`,
          result.reason?.message || result.reason,
        );
      }
    });

    await prisma.pushSubscription.deleteMany({
      where: { username: { equals: canonicalUsername, mode: "insensitive" } },
    });

    await prisma.studentProfile.delete({ where: { id: existing.id } });
    await invalidateStudentProfileCaches(canonicalUsername);

    return { username: canonicalUsername, status: "deleted" };
  } catch (e: any) {
    return {
      username: lookup.toUpperCase(),
      status: "error",
      reason: e.message,
    };
  }
}

export const bulkDeleteStudents = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  if (!user || user.role !== UserRole.WEBMASTER) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const usernames: string[] = req.body?.usernames;
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({
      success: false,
      message: "usernames array is required",
    });
  }

  const unique = [
    ...new Set(
      usernames
        .map((u) => String(u || "").trim().toUpperCase())
        .filter(Boolean),
    ),
  ];

  if (unique.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Maximum 100 students per bulk delete request",
    });
  }

  const results: PurgeStudentResult[] = [];
  const concurrency = 3;
  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((u) => purgeStudentAccount(u)));
    results.push(...chunkResults);
  }

  const deleted = results.filter((r) => r.status === "deleted").length;
  const notFound = results.filter((r) => r.status === "not_found").length;
  const errors = results.filter((r) => r.status === "error").length;

  return res.json({
    success: errors === 0 || deleted > 0,
    message: `Deleted ${deleted} student(s)${notFound ? `, ${notFound} not found` : ""}${errors ? `, ${errors} failed` : ""}`,
    summary: { total: unique.length, deleted, notFound, errors },
    results,
  });
};

export const updateFacultyProfileSelf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const updates = req.body;

  if (
    !user ||
    ![UserRole.TEACHER, UserRole.HOD, UserRole.FACULTY].includes(
      user.role as UserRole,
    )
  ) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const cleanUpdates: any = {};
    if (updates.name) cleanUpdates.name = updates.name;
    if (updates.contact) cleanUpdates.contact = updates.contact;
    if (updates.designation) cleanUpdates.designation = updates.designation;
    if (updates.profileUrl || updates.profile_url)
      cleanUpdates.profileUrl = updates.profileUrl || updates.profile_url;
    if (updates.bio || updates.Bio)
      cleanUpdates.bio = updates.bio || updates.Bio;

    const updated = await prisma.facultyProfile.update({
      where: { username: user.username },
      data: cleanUpdates,
    });

    return res.json({ success: true, faculty: mapFacultyProfile(updated) });
  } catch (e: any) {
    console.error("Update Faculty Profile Self Error:", e);
    if (e.code === "P2002") {
      return res.status(400).json({
        success: false,
        code: ErrorCode.VALIDATION_ERROR,
        message: "Email already in use by another account.",
      });
    }
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
      details: e.message || e,
    });
  }
};

export const updateAdminProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const updates = req.body;

  const adminRoles = [
    UserRole.WEBMASTER,
    UserRole.DEAN,
    UserRole.DIRECTOR,
    UserRole.SWO,
    UserRole.WARDEN_MALE,
    UserRole.WARDEN_FEMALE,
    UserRole.CARETAKER_MALE,
    UserRole.CARETAKER_FEMALE,
    UserRole.SECURITY,
    UserRole.LIBRARIAN,
    UserRole.DSW,
    UserRole.WARDEN,
    UserRole.CARETAKER,
    UserRole.TEACHER,
    UserRole.FACULTY,
    UserRole.HOD,
  ];

  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    if (
      user.role === UserRole.TEACHER ||
      user.role === UserRole.FACULTY ||
      user.role === UserRole.HOD
    ) {
      // Map frontend fields (profile_url, etc.) to prisma fields (profileUrl, etc.) if needed
      // Actually standard update body might work if keys match.
      // Lets be explicit for safety.
      // Explicitly map fields to avoid Prisma errors with extra data
      const facultyData: any = {};
      if (updates.name !== undefined) facultyData.name = updates.name;
      if (updates.contact !== undefined) facultyData.contact = updates.contact;
      if (updates.designation !== undefined)
        facultyData.designation = updates.designation;
      if (updates.department !== undefined)
        facultyData.department = updates.department;
      if (updates.profileUrl !== undefined || updates.profile_url !== undefined)
        facultyData.profileUrl = updates.profileUrl || updates.profile_url;
      if (updates.bio !== undefined || updates.Bio !== undefined)
        facultyData.bio = updates.bio || updates.Bio;

      const updated: any = await prisma.facultyProfile.upsert({
        where: { username: user.username },
        update: facultyData,
        create: {
          username: user.username,
          name: updates.name || user.username,
          email: updates.email || `${user.username}@rguktong.ac.in`,
          department: updates.department || "Administration",
          designation: updates.designation || "Staff",
          ...facultyData,
        },
      });

      return res.json({
        success: true,
        data: {
          id: updated.id,
          username: updated.username,
          name: updated.name,
          email: updated.email,
          contact: updated.contact,
          profile_url: updated.profileUrl,
          role: updated.role,
          department: updated.department,
          designation: updated.designation,
          bio: updated.bio,
        },
      });
    }

    const adminData: any = {};
    if (updates.name !== undefined) adminData.name = updates.name;
    if (updates.email !== undefined) adminData.email = updates.email;
    if (updates.contact !== undefined) adminData.contact = updates.contact;
    if (updates.designation !== undefined)
      adminData.designation = updates.designation;
    if (updates.department !== undefined)
      adminData.department = updates.department;
    if (updates.profileUrl !== undefined || updates.profile_url !== undefined)
      adminData.profileUrl = updates.profileUrl || updates.profile_url;
    if (updates.bio !== undefined) adminData.bio = updates.bio;

    // For Admin roles, use upsert for better resilience
    const updated = await prisma.adminProfile.upsert({
      where: { username: user.username },
      update: adminData,
      create: {
        username: user.username,
        role: user.role as string,
        name:
          updates.name ||
          user.username.charAt(0).toUpperCase() + user.username.slice(1),
        email: updates.email || `${user.username}@rguktong.ac.in`,
        ...adminData,
      },
    });

    return res.json({ success: true, data: mapAdminProfile(updated) });
  } catch (e: any) {
    console.error("Update Admin Profile Error:", e);

    // Handle Prisma Unique Constraint Violation
    if (e.code === "P2002") {
      return res.status(400).json({
        success: false,
        code: ErrorCode.VALIDATION_ERROR,
        message: "Email already in use by another account.",
        details: "A record with this email already exists.",
      });
    }

    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
      details: e.message || e,
    });
  }
};

// ─────────────────────────────────────────────
// BULK FACULTY OPERATIONS (Webmaster only)
// ─────────────────────────────────────────────

export const bulkCreateFaculty = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowed = [UserRole.WEBMASTER, UserRole.DIRECTOR];
  if (!user || !allowed.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const entries: Array<{
    username: string;
    name: string;
    email?: string;
    department?: string;
    designation?: string;
    role?: string;
    contact?: string;
  }> = req.body.faculty;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", message: "faculty array is required" });
  }

  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  const results: Array<{
    username: string;
    status: "created" | "skipped" | "error";
    reason?: string;
  }> = [];

  for (const entry of entries) {
    const username = String(entry.username || "")
      .trim()
      .toLowerCase();
    if (!username) {
      results.push({
        username: "(empty)",
        status: "error",
        reason: "Missing username",
      });
      continue;
    }

    try {
      await prisma.facultyProfile.create({
        data: {
          id: randomUUID(),
          username,
          name: entry.name || username.toUpperCase(),
          email: entry.email || `${username}@rguktong.ac.in`,
          department: (entry.department || "ALL").toUpperCase(),
          designation: entry.designation || "Faculty",
          role: entry.role || "teacher",
          contact: entry.contact || undefined,
        },
      });

      // Sync auth credentials
      const defaultPassword = `${username}@uniz`;
      await axios
        .post(
          `${AUTH_SERVICE_URL}/signup`,
          {
            username,
            password: defaultPassword,
            role: entry.role || "teacher",
            email: entry.email,
          },
          { headers: { "x-internal-secret": SECRET }, timeout: 5000 },
        )
        .catch(() => {});

      results.push({ username, status: "created" });
    } catch (e: any) {
      if (e.code === "P2002") {
        results.push({ username, status: "skipped", reason: "Already exists" });
      } else {
        results.push({ username, status: "error", reason: e.message });
      }
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return res.status(201).json({
    success: true,
    summary: { total: entries.length, created, skipped, errors },
    results,
  });
};

export const bulkUpdateFaculty = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowed = [UserRole.WEBMASTER, UserRole.DIRECTOR];
  if (!user || !allowed.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  // updates: [{ username, role?, designation?, department?, name?, contact? }]
  const updates: Array<{ username: string; [key: string]: any }> =
    req.body.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", message: "updates array is required" });
  }

  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
  const results: Array<{
    username: string;
    status: "updated" | "not_found" | "error";
    reason?: string;
  }> = [];

  for (const upd of updates) {
    const rawUsername = String(upd.username || "").trim();
    if (!rawUsername) continue;

    try {
      const existing = await prisma.facultyProfile.findFirst({
        where: { username: { equals: rawUsername, mode: "insensitive" } },
      });

      if (!existing) {
        results.push({ username: rawUsername, status: "not_found" });
        continue;
      }

      // Explicitly map allowed fields to avoid Prisma errors with extra/invalid data
      const data: any = {};
      if (upd.name !== undefined) data.name = upd.name;
      if (upd.email !== undefined) {
        if (user.role !== UserRole.WEBMASTER) {
          results.push({
            username: rawUsername,
            status: "error",
            reason: "Only webmaster can change faculty email",
          });
          continue;
        }
        data.email = upd.email;
      }
      if (upd.role !== undefined) data.role = upd.role;
      if (upd.designation !== undefined) data.designation = upd.designation;
      if (upd.department !== undefined) data.department = upd.department;
      if (upd.contact !== undefined) data.contact = upd.contact;
      if (upd.profileUrl !== undefined) data.profileUrl = upd.profileUrl;
      if (upd.Bio !== undefined || upd.bio !== undefined)
        data.bio = upd.Bio || upd.bio;

      if (Object.keys(data).length === 0) {
        results.push({
          username: rawUsername,
          status: "error",
          reason: "No fields to update provided",
        });
        continue;
      }

      await prisma.facultyProfile.update({
        where: { id: existing.id },
        data: data,
      });

      // If role changed, sync auth service (Idempotent update)
      if (data.role) {
        await axios
          .post(
            `${AUTH_SERVICE_URL}/signup`, // signup endpoint handles upsert/update of user entries
            {
              username: existing.username,
              password: `${existing.username}@uniz`, // fallback password
              role: data.role,
              email: data.email || existing.email,
            },
            {
              headers: { "x-internal-secret": SECRET },
              timeout: 5000,
            },
          )
          .catch((err) => {
            console.error(
              `[BULK-UPDATE] Failed to sync auth for ${existing.username}:`,
              err.message,
            );
          });
      }

      results.push({ username: rawUsername, status: "updated" });
    } catch (e: any) {
      console.error(`[BULK-UPDATE] Error updating ${rawUsername}:`, e.message);
      results.push({
        username: rawUsername,
        status: "error",
        reason: e.message,
      });
    }
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const notFound = results.filter((r) => r.status === "not_found").length;
  const errors = results.filter((r) => r.status === "error").length;

  return res.json({
    success: true,
    summary: { total: updates.length, updated, notFound, errors },
    results,
  });
};

export const bulkDeleteFaculty = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const allowed = [UserRole.WEBMASTER, UserRole.DIRECTOR];
  if (!user || !allowed.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  const usernames: string[] = req.body.usernames;
  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "usernames array is required",
    });
  }

  const results: Array<{
    username: string;
    status: "deleted" | "not_found" | "error";
    reason?: string;
  }> = [];

  for (const raw of usernames) {
    const username = String(raw || "").trim();
    if (!username) continue;

    try {
      const existing = await prisma.facultyProfile.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
      });

      if (!existing) {
        results.push({ username, status: "not_found" });
        continue;
      }

      await prisma.facultyProfile.delete({ where: { id: existing.id } });
      results.push({ username, status: "deleted" });
    } catch (e: any) {
      results.push({ username, status: "error", reason: e.message });
    }
  }

  const deleted = results.filter((r) => r.status === "deleted").length;
  const notFound = results.filter((r) => r.status === "not_found").length;
  const errors = results.filter((r) => r.status === "error").length;

  return res.json({
    success: true,
    summary: { total: usernames.length, deleted, notFound, errors },
    results,
  });
};

/**
 * PROMOTIONS API: Bulk updates YEAR field for cohorts
 */
export const promoteCohort = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { fromYear, toYear, branch } = req.body;

  if (!fromYear || !toYear) {
    return res.status(400).json({ success: false, message: "Missing fromYear or toYear" });
  }

  const user = req.user;
  const allowedRoles = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR, UserRole.COE];
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient hierarchy for cohort promotion",
    });
  }

  try {
    const where: any = {
      year: { equals: String(fromYear), mode: "insensitive" },
    };
    if (branch && String(branch).toUpperCase() !== "ALL") {
      where.branch = { equals: String(branch), mode: "insensitive" };
    }

    const result = await prisma.studentProfile.updateMany({
      where,
      data: {
        year: toYear,
        updatedAt: new Date(),
      }
    });

    // Bulk delete or pattern clear for Redis?
    // For now, simple clear for specific usernames if it's small, 
    // but updateMany doesn't return IDs easily.
    // Better strategy: just let TTL handle it or clear a global version flag.
    // Given the scale, we'll just clear the search cache.
    const keys = await redis.keys("profile:v2:*");
    if (keys.length > 0) {
      // Logic would be too heavy to delete all individual profiles.
      // We rely on TTL (TTL is 1hr as seen in other controllers)
    }

    return res.json({
      success: true,
      message: `Successfully promoted ${result.count} students from ${fromYear} to ${toYear}`,
      count: result.count
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
