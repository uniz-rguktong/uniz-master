import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma.util";
import { ErrorCode } from "../shared/error-codes";
import axios from "axios";
import * as ExcelJS from "exceljs";

/**
 * @desc Initialize a new semester with branch allocations
 * @access Webmaster
 */
const GATEWAY_URL =
  process.env.GATEWAY_URL || "http://uniz-gateway:3000/api/v1";

export const initSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { academicSemester, branches } = req.body; // academicSemester is the label like "AY 2024-25 E1-SEM-1"
  const user = req.user;

  try {
    // 1. Create Academic Semester record
    const semester = await prisma.academicSemester.create({
      data: {
        name: academicSemester,
        status: "DEAN_REVIEW",
      },
    });

    // 2. Extract the semester key (e.g. E1-SEM-1) from the label
    // If the label contains E1-SEM-1, use that.
    const semesterKey = academicSemester.match(/E[1-4]-SEM-[1-2]/)?.[0];

    if (semesterKey) {
      // 3. Auto-populate allocations for each selected branch
      for (const b of branches) {
        const branchName = b.branchName;
        // Find subjects for this branch and semester
        const subjects = await prisma.subject.findMany({
          where: {
            semester: semesterKey,
            department: branchName,
          },
        });

        if (subjects.length > 0) {
          await prisma.branchAllocation.createMany({
            data: subjects.map((s) => ({
              branch: branchName,
              subjectId: s.id,
              facultyId: "", // To be assigned by HOD (Dean review)
              semesterId: semester.id,
              isApproved: false,
            })),
          });
        }
      }
    }

    // 4. Trigger Notifications (Ads/Campaign)
    // - Push Notification to all students
    // - Banner Ad in student portal
    try {
      const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
      const headers = { "x-internal-secret": INTERNAL_SECRET };

      // Push Notification
      axios.post(
        `${GATEWAY_URL}/notifications/push/send`,
        {
          title: "Registration Open!",
          body: `Enrollment for ${academicSemester} has started. Visit the Academics portal.`,
          topic: "STUDENTS",
        },
        { headers },
      );

      // Banner/Ad Campaign
      axios.post(
        `${GATEWAY_URL}/cms/admin/banners`,
        {
          title: `Active Enrolment: ${academicSemester}`,
          text: "Double check your subject allocations and NPTEL electives before finalizing. Registrations are monitored by respective HODs.",
          imageUrl:
            "https://rguktong.ac.in/assets/images/academic_calendar.jpg",
          isVisible: true,
        },
        { headers },
      );

      // Public Notification
      axios.post(
        `${GATEWAY_URL}/cms/notifications`,
        {
          title: `Semester Registration: ${academicSemester}`,
          content: `All branches (${branches.map((b: any) => b.branchName).join(", ")}) are requested to review and submit their course registrations.`,
          isVisible: true,
        },
        { headers },
      );
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
      where: {
        status: { in: ["DEAN_REVIEW", "REGISTRATION_OPEN", "APPROVED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSem) {
      return res.status(404).json({ error: "No active semester found" });
    }

    const allocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: activeSem.id,
        branch: branch,
      },
      include: {
        subject: true,
        faculty: true,
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
  const { id } = req.params;
  const { facultyId, customName, customCredits, isApproved } = req.body;

  try {
    const allocation = await prisma.branchAllocation.update({
      where: { id },
      data: {
        facultyId,
        customName,
        customCredits: customCredits ? Number(customCredits) : undefined,
        isApproved,
      },
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
  const { branch, semesterId, allocationId } = req.body;

  try {
    if (allocationId) {
      await prisma.branchAllocation.update({
        where: { id: allocationId },
        data: { isApproved: true },
      });
    } else {
      await prisma.branchAllocation.updateMany({
        where: { branch, semesterId },
        data: { isApproved: true },
      });
    }

    res.json({ success: true, message: "Approved successfully" });
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
  const { subjectIds } = req.body;
  const user = req.user;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Get current registration-open semester
    const sem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
    });

    if (!sem) {
      return res.status(403).json({ error: "Registration is not open" });
    }

    // 2. Perform subject registration
    await Promise.all(
      subjectIds.map((id: string) =>
        prisma.registration.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId: user.username,
              subjectId: id,
              semesterId: sem.id,
            },
          },
          update: { status: "REGISTERED" },
          create: {
            studentId: user.username,
            subjectId: id,
            semesterId: sem.id,
          },
        }),
      ),
    );

    // 3. Update Student Academic Profile in uniz-user service
    // Extract year and sem from active semester name (e.g. "AY 2024-25 E1-S1")
    const match =
      sem.name.match(/E([1-4])-S([1-2])/i) ||
      sem.name.match(/E([1-4])-SEM-([1-2])/i);

    if (match) {
      try {
        const yearInt = parseInt(match[1]);
        const semInt = parseInt(match[2]);

        const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
        await axios.put(
          `${GATEWAY_URL}/profile/student/update`,
          {
            year: `E${yearInt}`,
            semester: `SEM-${semInt}`,
            // Optionally update other details if passed
          },
          {
            headers: {
              Authorization: req.headers.authorization,
              "x-internal-secret": INTERNAL_SECRET,
            },
          },
        );
      } catch (profileError) {
        console.warn("User Profile Update Failed:", profileError);
      }
    }

    res.status(201).json({ success: true, message: "Registration successful" });
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
      subjects: registrations.map((r) => ({
        ...r.subject,
        // Override with custom values from branch allocation if approved
        // In a real app, you'd join branchAllocations too, but here we can
        // rely on the Subject repo as default or fetch allocation specifically.
      })),
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
  const { type, branch, semesterId } = req.query;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    if (type === "registrations") {
      worksheet.columns = [
        { header: "Student ID", key: "studentId" },
        { header: "Subject Code", key: "code" },
        { header: "Subject Name", key: "name" },
        { header: "Status", key: "status" },
        { header: "Registered At", key: "createdAt" },
      ];

      const data = await prisma.registration.findMany({
        where: {
          semesterId: semesterId as string,
          subject: { department: branch ? (branch as string) : undefined },
        },
        include: { subject: true },
      });

      data.forEach((r) => {
        worksheet.addRow({
          studentId: r.studentId,
          code: r.subject.code,
          name: r.subject.name,
          status: r.status,
          createdAt: r.createdAt,
        });
      });
    } else {
      // Export Allocations
      worksheet.columns = [
        { header: "Branch", key: "branch" },
        { header: "Subject", key: "subject" },
        { header: "Faculty", key: "faculty" },
        { header: "Status", key: "approved" },
      ];

      const data = await prisma.branchAllocation.findMany({
        where: { semesterId: semesterId as string, branch: branch as string },
        include: { subject: true, faculty: true },
      });

      data.forEach((d) => {
        worksheet.addRow({
          branch: d.branch,
          subject: d.customName || d.subject.name,
          faculty: d.faculty?.name || "N/A",
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
