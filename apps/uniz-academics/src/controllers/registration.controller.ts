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
  process.env.GATEWAY_URL || "http://uniz-gateway-api:3000/api/v1";

export const initSemester = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { academicSemester, branches } = req.body; // academicSemester is the label like "AY 2024-25 E1-SEM-1"
  const user = req.user;

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
        name: academicSemester,
        status: "DEAN_REVIEW",
      },
    });

    // 2. Extract the semester suffix (SEM-1 or SEM-2) from the label
    const suffixMatch = academicSemester.match(/SEM-[1-2]/i);
    const semSuffix = suffixMatch ? suffixMatch[0].toUpperCase() : null;

    console.log(`[MEGA-DEBUG] academicSemester: ${academicSemester}`);
    console.log(`[MEGA-DEBUG] semSuffix: ${semSuffix}`);
    console.log(`[MEGA-DEBUG] branches: ${JSON.stringify(branches)}`);

    if (semSuffix) {
      const years = ["E1", "E2", "E3", "E4"];

      for (const yearSuffix of years) {
        const semesterKey = `${yearSuffix}-${semSuffix}`;
        console.log(`[MEGA-DEBUG] 🔍 Looking for ${semesterKey}...`);

        for (const b of branches) {
          const branchName = b.branchName.toUpperCase();
          const subjects = await prisma.subject.findMany({
            where: {
              semester: { contains: semesterKey, mode: "insensitive" },
              department: { equals: branchName, mode: "insensitive" },
            },
          });
          console.log(
            `[MEGA-DEBUG]   Found ${subjects.length} subjects for ${branchName} ${semesterKey}`,
          );

          if (subjects.length > 0) {
            console.log(
              `      ✅ Found ${subjects.length} subjects for ${branchName} ${semesterKey}`,
            );
            await prisma.branchAllocation.createMany({
              data: subjects.map((s) => ({
                branch: branchName,
                subjectId: s.id,
                facultyId: null,
                semesterId: semester.id,
                isApproved: false,
              })),
              skipDuplicates: true, // Safety check
            });
          }
        }
      }
    }

    // 4. Trigger Notifications (Ads/Campaign)
    try {
      const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
      const headers = { "x-internal-secret": INTERNAL_SECRET };
      const NOTIFY_URL = "http://uniz-gateway-api:3000/api/v1";

      // Push Notification
      await axios
        .post(
          `${NOTIFY_URL}/notifications/push/send`,
          {
            target: "all",
            title: "Registration Open! 🎓",
            body: `Enrollment for ${academicSemester} has started. Visit the Academics portal to select your courses.`,
          },
          { headers, timeout: 5000 },
        )
        .catch((e) => console.error("Notification failed:", e.message));

      // Public Notification/Banner
      await axios
        .post(
          `${NOTIFY_URL}/profile/internal/upload-history`,
          {
            type: "SEMESTER_INIT",
            filename: academicSemester,
            uploadedBy: "system",
            totalRows: 0,
            successCount: 1,
            failCount: 0,
            status: "COMPLETED",
          },
          { headers, timeout: 5000 },
        )
        .catch((e) => console.error("Banner failed:", e.message));
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
    const allocation = await (prisma.branchAllocation as any).update({
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
    const branchUpper = branch.toUpperCase();
    console.log(
      `[MEGA-DEBUG] Approving for branch: ${branchUpper}, sem: ${semesterId}`,
    );

    if (allocationId) {
      await prisma.branchAllocation.update({
        where: { id: allocationId },
        data: { isApproved: true },
      });
    } else {
      const result = await prisma.branchAllocation.updateMany({
        where: {
          branch: { equals: branchUpper, mode: "insensitive" },
          semesterId,
        },
        data: { isApproved: true },
      });
      console.log(`[MEGA-DEBUG]   Approved ${result.count} allocations.`);
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
  const { branch, year } = req.query;

  try {
    const openSem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!openSem) {
      return res.status(404).json({ error: "Registration is not open" });
    }

    const branchUpper = (branch as string)?.toUpperCase();
    console.log(
      `[MEGA-DEBUG] Fetching available for ${branchUpper}, year ${year}, sem ${openSem.id}`,
    );

    const where: any = {
      semesterId: openSem.id,
      branch: { equals: branchUpper, mode: "insensitive" },
      isApproved: true,
    };

    // If year is provided (e.g. E3), filter subjects that belong to E3-SEM-X
    if (year) {
      where.subject = {
        semester: {
          startsWith: year as string,
        },
      };
    }

    const subjects = await prisma.branchAllocation.findMany({
      where,
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

  console.log(
    `[MEGA-DEBUG] registerSubjects user: ${user.username}, subjectIds: ${subjectIds.length}`,
  );

  try {
    // 1. Get current registration-open semester
    const sem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!sem) {
      console.log(`[MEGA-DEBUG] No open semester found!`);
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
    const firstSubject = await prisma.subject.findFirst({
      where: { id: subjectIds[0] },
    });

    if (firstSubject) {
      console.log(
        `[MEGA-DEBUG] firstSubject semester field: ${firstSubject.semester}`,
      );
      const match = firstSubject.semester.match(/(E[1-4])-(SEM-[1-2])/i);
      if (match) {
        const academicYear = match[1];
        const academicSem = match[2];
        console.log(
          `[MEGA-DEBUG] Match found: ${academicYear}, ${academicSem}`,
        );

        try {
          const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";
          const updateRes = await axios.put(
            `${GATEWAY_URL}/profile/admin/student/${user.username}`,
            {
              year: academicYear,
              semester: academicSem,
            },
            {
              headers: {
                Authorization: req.headers.authorization,
                "x-internal-secret": INTERNAL_SECRET,
              },
            },
          );
          console.log(
            `[MEGA-DEBUG] Profile update result: ${JSON.stringify(updateRes.data)}`,
          );
          console.log(
            `✅ Student ${user.username} profile updated to ${academicYear} ${academicSem}`,
          );
        } catch (profileError: any) {
          console.warn(
            `[MEGA-DEBUG] Profile Update Failed: ${profileError.response?.data ? JSON.stringify(profileError.response.data) : profileError.message}`,
          );
        }
      } else {
        console.log(
          `[MEGA-DEBUG] Regex FAILED to match ${firstSubject.semester}`,
        );
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

      data.forEach((d: any) => {
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
