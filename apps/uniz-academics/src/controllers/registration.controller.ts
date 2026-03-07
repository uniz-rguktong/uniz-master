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

    const suffixMatch = academicSemester.match(/SEM-[1-2]/i);
    const semSuffix = suffixMatch ? suffixMatch[0].toUpperCase() : null;

    if (semSuffix) {
      const years = ["E1", "E2", "E3", "E4"];

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

          // Match subjects by base semester (SEM-1/2) and filter by year from code
          const subjects = await prisma.subject.findMany({
            where: {
              semester: { equals: semSuffix, mode: "insensitive" },
              department: { equals: branchName, mode: "insensitive" },
              code: { contains: `-${yearSuffix}-`, mode: "insensitive" },
            },
          });

          if (subjects.length > 0) {
            await prisma.branchAllocation.createMany({
              data: subjects.map(
                (s) =>
                  ({
                    branch: branchName,
                    subjectId: s.id,
                    semesterId: semester.id,
                    academicYear: yearSuffix,
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
 * @desc Create a manual allocation
 * @access Webmaster, Dean, HOD
 */
export const createAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { semesterId, branch, subjectId, academicYear } = req.body;
  const user = req.user;

  try {
    // Role Check
    if (user?.role === "hod") {
      // derive branch from username e.g. hod_cse -> CSE
      const hodBranch = user.username.split("_")[1]?.toUpperCase();
      if (branch.toUpperCase() !== hodBranch) {
        return res.status(403).json({ error: "Unauthorized for this branch" });
      }
    }

    const allocation = await prisma.branchAllocation.create({
      data: {
        semesterId,
        branch: branch.toUpperCase(),
        subjectId,
        academicYear: academicYear || "E4", // Default or derived
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
    const { semesterId, year } = req.query;

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
  const { id } = req.params;
  const {
    customName,
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
        whereClause.subject = {
          semester: { startsWith: year, mode: "insensitive" },
        };
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
      nextStatus = "APPROVED";
      title = "Semester Registration is LIVE! 🎓";
      message = `Hello {{name}}, your course registration for ${year || "upcoming semester"} is now open. Register before the deadline.`;
      target = "students"; // Targeted to students
      targetBranch = branch || user.username.split("_")[1]?.toUpperCase();
      targetYear = year;
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
  const { branch, year } = req.query;

  try {
    const openSem = await prisma.academicSemester.findFirst({
      where: {
        status: { in: ["REGISTRATION_OPEN", "DEAN_REVIEW", "APPROVED"] },
      },
      orderBy: { createdAt: "desc" },
    });

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
        studentId: req.user?.username,
        semesterId: openSem.id,
        status: "REGISTERED",
      },
    });

    res.json({
      semester: openSem,
      subjects,
      alreadyRegistered: registrationCount > 0,
      isOpen: true,
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

  try {
    // 1. Get current registration-open semester
    const sem = await prisma.academicSemester.findFirst({
      where: { status: "REGISTRATION_OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!sem) {
      return res.status(403).json({ error: "Registration is not open" });
    }

    // 2. Fetch student details to get branch (department)
    let studentBranch = (user as any).department;
    if (!studentBranch) {
      try {
        const studentRes = await axios.get(
          `${GATEWAY_URL}/profile/student/me`,
          {
            headers: { Authorization: req.headers.authorization },
          },
        );
        studentBranch = studentRes.data?.department || studentRes.data?.branch;
      } catch (err) {
        console.warn(
          "Failed to fetch student branch, falling back to subject branch check",
        );
      }
    }

    const allocations = await prisma.branchAllocation.findMany({
      where: {
        semesterId: sem.id,
        ...(studentBranch
          ? { branch: { equals: studentBranch, mode: "insensitive" } }
          : {}),
        isApproved: true,
      },
      include: { subject: true },
    });

    // If we didn't have studentBranch, infer it from the first allocation for validation
    if (!studentBranch && allocations.length > 0) {
      studentBranch = allocations[0].branch;
    }

    // Check mandatory subjects
    const mandatoryMissing = allocations
      .filter((a: any) => a.isMandatory)
      .filter((a) => !subjectIds.includes(a.subjectId));

    if (mandatoryMissing.length > 0) {
      return res.status(400).json({
        error: `Missing mandatory subjects: ${mandatoryMissing.map((m) => m.subject.name).join(", ")}`,
      });
    }

    // Check elective group limits
    const electiveGroups: Record<
      string,
      { limit: number; names: string[]; selectedCount: number }
    > = {};
    allocations.forEach((a: any) => {
      if (a.electiveGroupId && a.electiveGroupId.trim() !== "") {
        if (!electiveGroups[a.electiveGroupId]) {
          electiveGroups[a.electiveGroupId] = {
            limit: a.electiveLimit || 1,
            names: [],
            selectedCount: 0,
          };
        }
        electiveGroups[a.electiveGroupId].names.push(a.subject.name);
        if (subjectIds.includes(a.subjectId)) {
          electiveGroups[a.electiveGroupId].selectedCount++;
        }
      }
    });

    for (const [groupId, group] of Object.entries(electiveGroups)) {
      if (group.selectedCount > group.limit) {
        return res.status(400).json({
          error: `Group ${groupId}: You can only select ${group.limit} subjects from: ${group.names.join(", ")}`,
        });
      }
      if (group.selectedCount < group.limit) {
        return res.status(400).json({
          error: `Group ${groupId}: Please select exactly ${group.limit} subjects from: ${group.names.join(", ")}`,
        });
      }
    }

    // 3. Perform subject registration
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
            `✅ Student ${user.username} profile updated to ${academicYear} ${academicSem}`,
          );
        } catch (profileError: any) {
          console.warn("User Profile Update Failed:", profileError.message);
        }
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
      subjects: registrations,
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
 * @desc Get all registered students and their subjects
 * @access Dean, Webmaster
 */
export const getRegistrations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { branch, semesterId } = req.query;

  try {
    const where: any = {};
    if (semesterId) {
      where.semesterId = semesterId as string;
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
      if (activeSem) where.semesterId = activeSem.id;
    }

    if (branch && branch !== "all") {
      where.subject = {
        department: { equals: branch as string, mode: "insensitive" },
      };
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        subject: true,
        semester: true,
      },
      orderBy: { createdAt: "desc" },
    });

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
      return res.json({ semester: null, data: null });
    }

    if (user.role === "student") {
      // For Students: Show registered subjects
      const registrations = await prisma.registration.findMany({
        where: {
          studentId: user.username,
          semesterId: activeSem.id,
          status: "REGISTERED",
        },
        include: { subject: true },
      });

      const totalCredits = registrations.reduce(
        (acc, r) => acc + r.subject.credits,
        0,
      );

      return res.json({
        semester: activeSem,
        role: "student",
        data: {
          registrations: registrations.map((r) => ({
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
      branchAllocations.forEach((alloc) => {
        if (!branchSummary[alloc.branch]) {
          branchSummary[alloc.branch] = {
            subjectCount: 0,
            totalCredits: 0,
            academicYears: new Set(),
            subjects: [],
          };
        }
        branchSummary[alloc.branch].subjects.push({
          code: alloc.subject.code,
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
