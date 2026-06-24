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
        id: academicSemester.replace(/\s+/g, "-").toUpperCase(),
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

async function openSemesterRegistration(semesterId: string) {
  await prisma.academicSemester.update({
    where: { id: semesterId },
    data: { status: "REGISTRATION_OPEN" },
  });
  await prisma.branchAllocation.updateMany({
    where: { semesterId },
    data: { status: "APPROVED", isApproved: true },
  });
}

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
  if (!user || !["webmaster", "coe", "director"].includes(user.role as string)) {
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
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        semesterStart: semesterStart ? new Date(semesterStart) : null,
        semesterEnd: semesterEnd ? new Date(semesterEnd) : null,
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
    const code = String(s.code || "").trim().toUpperCase();
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
    const semester = await prisma.academicSemester.findUnique({ where: { id } });
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
      where.branch = { equals: String(branch).toUpperCase(), mode: "insensitive" };
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
      return res.status(400).json({ error: "groupCode and groupName required" });
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
    const semester = await prisma.academicSemester.findUnique({ where: { id } });
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
      if (!["webmaster", "coe", "director"].includes(role)) {
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
          // webmaster override can push straight to open
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

        const hodBranch = String(
          req.body.branch || user.username.split("_")[1] || "",
        )
          .trim()
          .toUpperCase();
        if (!hodBranch) {
          return res
            .status(400)
            .json({ error: "Could not determine HOD branch" });
        }

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

    if (nextStatus === "REGISTRATION_OPEN" && action === "approve") {
      await prisma.branchAllocation.updateMany({
        where: { semesterId: id },
        data: { status: "APPROVED", isApproved: true },
      });
    }

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
            ? registrationStart
              ? new Date(registrationStart)
              : null
            : undefined,
        registrationEnd:
          registrationEnd !== undefined
            ? registrationEnd
              ? new Date(registrationEnd)
              : null
            : undefined,
        semesterStart:
          semesterStart !== undefined
            ? semesterStart
              ? new Date(semesterStart)
              : null
            : undefined,
        semesterEnd:
          semesterEnd !== undefined
            ? semesterEnd
              ? new Date(semesterEnd)
              : null
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
  const { semesterId, branch, subjectId, academicYear, batch } = req.body;
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
  try {
    const semesters = await prisma.academicSemester.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true } } },
    });
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
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
      nextStatus = "APPROVED";
      targetBranch = branch || user.username.split("_")[1]?.toUpperCase();
      targetYear = year;

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

    const openSem = await prisma.academicSemester.findFirst({
      where: {
        status: {
          in: ["REGISTRATION_OPEN", "HOD_REVIEW", "DEAN_REVIEW", "APPROVED"],
        },
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
      subjects,
      electiveGroups,
      registrationWindow: {
        start: (openSem as any).registrationStart,
        end: (openSem as any).registrationEnd,
      },
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

    // 1b. Enforce the registration window (if configured)
    const now = new Date();
    if ((sem as any).registrationStart && now < (sem as any).registrationStart) {
      return res.status(403).json({
        error: `Registration opens on ${new Date(
          (sem as any).registrationStart,
        ).toLocaleString("en-IN")}`,
      });
    }
    if ((sem as any).registrationEnd && now > (sem as any).registrationEnd) {
      return res.status(403).json({
        error: "The registration window has closed.",
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

    // Check mandatory subjects
    const mandatoryMissing = allocations
      .filter((a: any) => a.isMandatory)
      .filter((a: any) => !subjectIds.includes(a.subjectId));

    if (mandatoryMissing.length > 0) {
      return res.status(400).json({
        error: `Missing mandatory subjects: ${mandatoryMissing.map((m: any) => m.subject.name).join(", ")}`,
        attribution: "SABER", // matching error structure
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
          update: {
            status: "REGISTERED",
            batch: studentBatch,
            submittedAt: new Date(),
          } as any,
          create: {
            studentId: user.username,
            subjectId: id,
            semesterId: sem.id,
            batch: studentBatch,
            submittedAt: new Date(),
          } as any,
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
        studentId: user.username,
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
    const allocBySubject = new Map(
      regAllocations.map((a) => [a.subjectId, a]),
    );

    const confirmation = {
      registrationId: registered[0]?.id || sem.id,
      semester: sem.name,
      submittedAt: (registered[0] as any)?.submittedAt || new Date(),
      subjects: registered.map((r: any) => {
        const alloc = allocBySubject.get(r.subjectId);
        return {
          code: r.subject.code,
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
  const { type, branch, semesterId, batch } = req.query;

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Export");

    if (type === "registrations") {
      worksheet.columns = [
        { header: "Student ID", key: "studentId" },
        { header: "Batch", key: "batch" },
        { header: "Subject Code", key: "code" },
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

      data.forEach((r: any) => {
        worksheet.addRow({
          studentId: r.studentId,
          batch: (r as any).batch || "",
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
  const { branch, semesterId, batch } = req.query;

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

    if (batch && batch !== "all") {
      where.batch = { equals: batch as string, mode: "insensitive" };
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
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
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
