import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { UserRole } from "../shared/roles.enum";
import axios from "axios";
import { redis } from "../utils/redis.util";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

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
  profile_url: profile.profileUrl,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
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
  is_suspended: profile.isSuspended || false,
});

const mapAdminProfile = (profile: any) => ({
  id: profile.id,
  username: profile.username,
  name: profile.name,
  email: profile.email,
  contact: profile.contact,
  profile_url: profile.profileUrl,
  role: profile.role,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
});

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
    const cacheKey = `profile:v2:${targetUsername}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        student: JSON.parse(cached),
        source: "cache",
      });
    }

    // Edge Caching
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");

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

    // 4. Populate Cache (1 hour TTL)
    await redis.setex(cacheKey, 3600, JSON.stringify(mapped));

    return res.json({ success: true, student: mapped, source: "db" });
  } catch (e) {
    console.error("Profile fetch error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch profile",
    });
  }
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
    await redis.del(`profile:v2:${user.username}`);

    // Notify student (Backgrounded for latency optimization)
    sendPush(
      user.username,
      "Profile Updated",
      `Your profile has been updated. Changed fields: ${Object.keys(updates).join(", ")}.`,
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

export const adminUpdateStudentProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const username = req.params.username.toUpperCase();
  const updates = req.body;

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
    await redis.del(`profile:v2:${username}`);

    // Notify student (Backgrounded for latency optimization)
    sendPush(
      username,
      "Profile Updated",
      `Your profile has been updated by an administrator. Changed fields: ${Object.keys(updates).join(", ")}.`,
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
    gender,
    page = 1,
    limit = 10,
    isSuspended,
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
    if (branch) where.branch = branch;
    if (year) where.year = year;
    if (gender) where.gender = gender;
    if (isSuspended !== undefined)
      where.isSuspended = isSuspended === true || isSuspended === "true";
    if (req.body.isPresentInCampus !== undefined) {
      where.isPresentInCampus = req.body.isPresentInCampus;
    }
    if (req.body.isApplicationPending !== undefined) {
      where.isApplicationPending = req.body.isApplicationPending;
    }

    // Cache search results for 1 minute
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { username: "asc" },
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
  if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.HOD)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const profile = await prisma.facultyProfile.findUnique({
      where: { username: user.username },
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
    // Legacy support
    UserRole.DSW,
    UserRole.WARDEN,
    UserRole.CARETAKER,
  ];
  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const profile = await prisma.adminProfile.findUnique({
      where: { username: user.username },
    });
    return res.json({
      success: true,
      data: profile ? mapAdminProfile(profile) : null,
    });
  } catch (e) {
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
    await redis.del(`profile:v2:${username}`);

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
    await redis.del(`profile:v2:${targetUsername}`);

    // 4. Notify User
    sendPush(
      targetUsername,
      suspended ? "Account Suspended" : "Account Reinstated",
      suspended
        ? "Your account has been suspended by an administrator. Please contact the office for details."
        : "Your account has been reinstated. You can now use all university services.",
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

    const [faculty, total] = await Promise.all([
      prisma.facultyProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: "asc" },
      }),
      prisma.facultyProfile.count({ where }),
    ]);

    return res.json({
      success: true,
      faculty: faculty.map(mapFacultyProfile),
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
  const updates = req.body;

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
    // Find the record to update (case-insensitive search for safety during migration)
    const existingFaculty = await prisma.facultyProfile.findFirst({
      where: { username: { equals: req.params.username, mode: "insensitive" } },
    });

    if (!existingFaculty) {
      return res.status(404).json({ message: "Faculty profile not found" });
    }

    const targetUsername = (
      updates.username || existingFaculty.username
    ).toLowerCase();

    const updated = await prisma.facultyProfile.update({
      where: { id: existingFaculty.id },
      data: {
        ...updates,
        username: targetUsername,
      },
    });

    // Sync with Auth Service (Upsert behavior)
    if (updates.role || updates.email || updates.username || true) {
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
            email: updates.email || updated.email,
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
  } catch (e) {
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
    const target = await prisma.facultyProfile.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    });

    if (!target) {
      return res.status(404).json({ message: "Faculty profile not found" });
    }

    await prisma.facultyProfile.delete({
      where: { id: target.id },
    });
    return res.json({ success: true, message: "Faculty profile deleted" });
  } catch (e) {
    console.error("Delete Faculty Error:", e);
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to delete profile",
    });
  }
};
export const updateFacultyProfileSelf = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  const updates = req.body;

  if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.HOD)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const updated = await prisma.facultyProfile.update({
      where: { username: user.username },
      data: updates,
    });

    return res.json({ success: true, faculty: mapFacultyProfile(updated) });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
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
  ];

  if (!user || !adminRoles.includes(user.role as UserRole)) {
    return res
      .status(403)
      .json({ code: ErrorCode.AUTH_FORBIDDEN, message: "Access denied" });
  }

  try {
    const updated = await prisma.adminProfile.update({
      where: { username: user.username },
      data: updates,
    });

    return res.json({ success: true, data: mapAdminProfile(updated) });
  } catch (e) {
    return res.status(500).json({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Failed to update profile",
    });
  }
};
