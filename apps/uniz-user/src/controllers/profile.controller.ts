import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ErrorCode } from "../shared/error-codes";
import { UserRole } from "../shared/roles.enum";
import axios from "axios";
import { redis } from "../utils/redis.util";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const sendMail = async (type: string, to: string, data: any) => {
  try {
    const rawGateway = (
      process.env.GATEWAY_URL || "http://localhost:3000/api/v1"
    ).trim();
    const rawMailUrl = process.env.MAIL_SERVICE_URL;
    const MAIL_SERVICE = rawMailUrl
      ? rawMailUrl.trim().replace(/\/health$/, "")
      : `${rawGateway}/mail`;

    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    console.log(
      `[USER][DEBUG] Attempting to send mail: type=${type}, to=${to}, url=${MAIL_SERVICE}/send`,
    );

    await axios.post(
      `${MAIL_SERVICE}/send`,
      {
        type,
        to,
        data,
      },
      {
        headers: { "x-internal-secret": SECRET },
      },
    );
    console.log(
      `[USER] Successfully sent ${type} mail request to mail service for: ${to}`,
    );
  } catch (e: any) {
    console.error(
      `[USER][ERROR] Failed to send mail (${type}) to ${to}:`,
      e.message,
    );
    if (e.response) {
      console.error(
        `[USER][ERROR] Mail Service Response:`,
        e.response.status,
        e.response.data,
      );
    }
  }
};

const mapStudentProfile = (profile: any) => ({
  _id: profile.id,
  username: profile.username,
  name: profile.name,
  email: profile.email,
  gender: profile.gender,
  year: profile.year,
  branch: profile.branch,
  section: profile.section,
  roomno: profile.roomno,
  has_pending_requests: profile.isApplicationPending,
  is_in_campus: profile.isPresentInCampus,
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
      const GATEWAY_URL = (
        process.env.GATEWAY_URL || "http://localhost:3000/api/v1"
      ).trim();
      try {
        const [gradesRes, attendanceRes] = await Promise.all([
          axios
            .get(
              `${GATEWAY_URL}/academics/grades?studentId=${targetUsername}`,
              { headers: { Authorization: token }, timeout: 2000 },
            )
            .catch(() => ({ data: null })),
          axios
            .get(
              `${GATEWAY_URL}/academics/attendance?studentId=${targetUsername}`,
              { headers: { Authorization: token }, timeout: 2000 },
            )
            .catch(() => ({ data: null })),
        ]);

        if (gradesRes.data && gradesRes.data.success) {
          mapped.grades = gradesRes.data.grades;
          mapped.gpa_summary = gradesRes.data.gpa;
        }
        if (attendanceRes.data && attendanceRes.data.success) {
          mapped.attendance = attendanceRes.data.attendance;
          mapped.attendance_summary = attendanceRes.data.summary;
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
    sendMail(
      "profile_update",
      updated.email || `${user.username}@rguktong.ac.in`,
      {
        username: updated.name || user.username,
        updatedFields: Object.keys(updates),
      },
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
    const updated = await prisma.studentProfile.update({
      where: { username },
      data: updates,
    });

    // Invalidate profile cache to prevent stale data
    await redis.del(`profile:v2:${username}`);

    // Notify student (Backgrounded for latency optimization)
    sendMail("profile_update", updated.email || `${username}@rguktong.ac.in`, {
      username: updated.name || username,
      updatedFields: Object.keys(updates),
    });

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

  const { username, branch, year, gender, page = 1, limit = 10 } = req.body;

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
    if (req.body.isPresentInCampus !== undefined) {
      where.isPresentInCampus = req.body.isPresentInCampus;
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
    return res.json({ success: true, data: profile });
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
  const { username, name, email, department, designation } = req.body;

  // Admin role check
  const adminRoles = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR];
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
        role: "teacher",
      },
    });
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
