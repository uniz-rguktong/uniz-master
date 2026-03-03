import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma.util";
import { ErrorCode } from "../shared/error-codes";

/**
 * @desc Initialize a new semester with branch allocations
 * @access Webmaster
 */
export const initSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { name, allocations } = req.body; // allocations: [{ branch, subjectId, facultyId }]

  try {
    const semester = await prisma.academicSemester.create({
      data: {
        name,
        status: "DRAFT",
        branchAllocations: {
          create: allocations.map((a: any) => ({
            branch: a.branch,
            subjectId: a.subjectId,
            facultyId: a.facultyId,
          })),
        },
      },
      include: { branchAllocations: true },
    });

    res.status(201).json(semester);
  } catch (error: any) {
    console.error("Init Semester Error:", error);
    res.status(500).json({
      error: "Failed to initialize semester",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    });
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
  const { id } = req.params;
  const { status } = req.body;

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
 * @desc Get all semesters
 */
export const getSemesters = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const semesters = await prisma.academicSemester.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true } } },
    });
    res.json(semesters);
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
    const activeSem = await prisma.academicSemester.findFirst({
      where: { status: "DEAN_REVIEW" },
    });

    if (!activeSem) {
      return res
        .status(404)
        .json({ error: "No semester currently in Dean Review stage" });
    }

    const allocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: activeSem.id,
        branch: branch,
      },
      include: {
        subject: true,
      },
    });

    res.json({ semester: activeSem, allocations });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch allocations" });
  }
};

/**
 * @desc Approve branch allocations
 * @access Dean
 */
export const approveBranchAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, semesterId } = req.body;

  try {
    await prisma.branchAllocation.updateMany({
      where: { branch, semesterId },
      data: { isApproved: true },
    });

    res.json({ message: `Branch ${branch} subjects approved successfully` });
  } catch (error) {
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
  const { branch } = req.query;

  try {
    const openSem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
    });

    if (!openSem) {
      return res.status(404).json({ error: "Registration is not open" });
    }

    const subjects = await prisma.branchAllocation.findMany({
      where: {
        semesterId: openSem.id,
        branch: branch as string,
        isApproved: true,
      },
      include: {
        subject: true,
      },
    });

    res.json({ semester: openSem, subjects });
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
  const { studentId, subjectIds, semesterId } = req.body;

  try {
    // Check if registration is open
    const sem = await prisma.academicSemester.findUnique({
      where: { id: semesterId },
    });
    if (sem?.status !== "REGISTRATION_OPEN") {
      return res
        .status(403)
        .json({ error: "Registration is not open for this semester" });
    }

    const registrations = await Promise.all(
      subjectIds.map((id: string) =>
        prisma.registration.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId,
              subjectId: id,
              semesterId,
            },
          },
          update: { status: "REGISTERED" },
          create: {
            studentId,
            subjectId: id,
            semesterId,
          },
        }),
      ),
    );

    res.status(201).json(registrations);
  } catch (error) {
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
  const { studentId } = req.params;

  try {
    // 1. Get the latest active/open semester
    const activeSem = await prisma.academicSemester.findFirst({
      where: {
        status: {
          in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "APPROVED"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSem) {
      return res.json([]);
    }

    // 2. Fetch registrations for this student in this semester
    const registrations = await prisma.registration.findMany({
      where: {
        studentId,
        semesterId: activeSem.id,
        status: "REGISTERED",
      },
      include: {
        subject: true,
      },
    });

    res.json({
      semester: activeSem,
      subjects: registrations.map((r) => r.subject),
    });
  } catch (error) {
    console.error("Get Current Subjects Error:", error);
    res.status(500).json({ error: "Failed to fetch current subjects" });
  }
};
