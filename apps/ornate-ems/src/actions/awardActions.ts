"use server";

import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/api-utils";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface BestOutgoingStudentInput {
  id?: string;
  name: string;
  rollNumber: string;
  photo?: string | null;
  branch: string;
  year?: string;
  rating?: number | string;
  cgpa?: number | string;
  achievements: string | string[];
  placementStatus?: string;
  company?: string;
  package?: string;
  gender: "male" | "female" | string;
  awardYear: number | string;
  isPublished?: boolean;
  isOverall?: boolean;
}

export async function getBestOutgoingStudents() {
  return executeAction(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error("Unauthorized");
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, branch: true },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    const queryScope: { orderBy: any; where?: any } = {
      orderBy: {
        awardYear: "desc",
      },
    };

    if (
      admin.role !== "SUPER_ADMIN" &&
      admin.role !== "HHO" &&
      admin.role !== "SPORTS_ADMIN" &&
      admin.role !== "BRANCH_SPORTS_ADMIN" &&
      admin.branch
    ) {
      queryScope.where = {
        OR: [
          {
            branch: {
              equals: admin.branch,
              mode: "insensitive",
            },
          },
          {
            isOverall: true,
          },
        ],
      };
    }

    const students = await prisma.bestOutgoingStudent.findMany(queryScope);
    return { success: true, data: students };
  }, "getBestOutgoingStudents");
}

export async function getPublicBestOutgoingStudents() {
  return executeAction(async () => {
    const students = await prisma.bestOutgoingStudent.findMany({
      where: { isPublished: true },
      orderBy: {
        awardYear: "desc",
      },
    });
    return { success: true, data: students };
  }, "getPublicBestOutgoingStudents");
}

export async function createBestOutgoingStudent(
  formData: BestOutgoingStudentInput,
) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    const { id, achievements, cgpa, rating, awardYear, ...data } = formData;

    // 1. Validate required fields
    if (!data.name) throw new Error("Student name is required");
    if (!data.rollNumber) throw new Error("Roll number is required");
    if (!data.branch) throw new Error("Branch is required");
    if (!data.gender) throw new Error("Gender is required");

    // 2. Normalize numeric fields
    const normalizedCGPA = parseFloat(String(rating ?? cgpa ?? "0"));
    if (isNaN(normalizedCGPA)) throw new Error("Invalid CGPA/Rating value");

    const normalizedAwardYear = parseInt(String(awardYear));
    if (isNaN(normalizedAwardYear)) throw new Error("Invalid Award Year");

    // 3. Normalize achievements
    const achievementsArray =
      typeof achievements === "string"
        ? achievements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : achievements;

    const student = await prisma.bestOutgoingStudent.create({
      data: {
        ...data,
        name: data.name.trim(),
        rollNumber: data.rollNumber.trim(),
        gender: data.gender.toLowerCase(),
        cgpa: normalizedCGPA,
        awardYear: normalizedAwardYear,
        branch: (admin.role === "BRANCH_ADMIN"
          ? admin.branch || data.branch
          : data.branch || admin.branch || ""
        ).trim(),
        achievements: achievementsArray,
      },
    });

    revalidatePath("/(dashboard)/super-admin/awards/best-outgoing");
    revalidatePath("/(dashboard)/branch-admin/content/outgoing-students");
    // Revalidate for students/others too if needed
    revalidatePath("/awards");

    return { success: true, data: student };
  }, "createBestOutgoingStudent");
}

export async function updateBestOutgoingStudent(
  formData: BestOutgoingStudentInput,
) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }

  const userEmail = session.user.email;
  if (!userEmail) throw new Error("User email not found in session");

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    const { id, achievements, cgpa, rating, awardYear, ...data } = formData;
    if (!id) throw new Error("Student ID is required for update");

    // 1. Validate required fields
    if (!data.name || data.name.trim() === "")
      throw new Error("Student name is required");
    if (!data.rollNumber || data.rollNumber.trim() === "")
      throw new Error("Roll number is required");
    if (!data.branch || data.branch.trim() === "")
      throw new Error("Branch is required");
    if (!data.gender || data.gender.trim() === "")
      throw new Error("Gender is required");
    if (!awardYear) throw new Error("Award Year is required");
    if (
      !achievements ||
      (Array.isArray(achievements) && achievements.length === 0) ||
      (typeof achievements === "string" && achievements.trim() === "")
    )
      throw new Error("Achievements are required");

    // 2. Normalize numeric fields
    const normalizedCGPA = parseFloat(String(rating ?? cgpa ?? "0"));
    if (isNaN(normalizedCGPA))
      throw new Error("Invalid CGPA/Rating value provided");

    const normalizedAwardYear = parseInt(String(awardYear));
    if (isNaN(normalizedAwardYear))
      throw new Error("Invalid Award Year value provided");

    if (admin.role === "BRANCH_ADMIN") {
      const existing = await prisma.bestOutgoingStudent.findUnique({
        where: { id },
        select: { branch: true, isOverall: true },
      });

      if (!existing) throw new Error("Student not found");

      // 1. Branch Admins cannot modify overall best students
      if (existing.isOverall) {
        throw new Error(
          "Only Super Admin can modify overall best outgoing students",
        );
      }

      // 2. Branch Admins can only modify students from their own branch
      const adminBranch = (admin.branch || "").trim().toLowerCase();
      const studentBranch = (existing.branch || "").trim().toLowerCase();

      if (!adminBranch || adminBranch !== studentBranch) {
        throw new Error("You can only modify students from your own branch");
      }
    }

    const achievementsArray =
      typeof achievements === "string"
        ? achievements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : achievements;

    const student = await prisma.bestOutgoingStudent.update({
      where: { id },
      data: {
        ...data,
        name: data.name.trim(),
        rollNumber: data.rollNumber.trim(),
        gender: data.gender.toLowerCase(),
        cgpa: normalizedCGPA,
        awardYear: normalizedAwardYear,
        branch: (admin.role === "BRANCH_ADMIN"
          ? admin.branch || data.branch
          : data.branch || admin.branch || ""
        ).trim(),
        achievements: achievementsArray,
      },
    });

    revalidatePath("/(dashboard)/super-admin/awards/best-outgoing");
    revalidatePath("/(dashboard)/branch-admin/content/outgoing-students");
    return { success: true, data: student };
  }, "updateBestOutgoingStudent");
}

export async function deleteBestOutgoingStudent(id: string) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }

  const userEmail = session.user.email;
  if (!userEmail) throw new Error("User email not found in session");

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    if (admin.role === "BRANCH_ADMIN") {
      const existing = await prisma.bestOutgoingStudent.findUnique({
        where: { id },
        select: { branch: true, isOverall: true },
      });

      if (!existing) throw new Error("Student not found");

      // 1. Branch Admins cannot delete overall best students
      if (existing.isOverall) {
        throw new Error(
          "Only Super Admin can delete overall best outgoing students",
        );
      }

      // 2. Branch Admins can only delete students from their own branch
      const adminBranch = (admin.branch || "").trim().toLowerCase();
      const studentBranch = (existing.branch || "").trim().toLowerCase();

      if (!adminBranch || adminBranch !== studentBranch) {
        throw new Error("You can only delete students from your own branch");
      }
    }

    await prisma.bestOutgoingStudent.delete({
      where: { id },
    });

    revalidatePath("/(dashboard)/super-admin/awards/best-outgoing");
    revalidatePath("/(dashboard)/branch-admin/content/outgoing-students");
    return { success: true };
  }, "deleteBestOutgoingStudent");
}

export async function toggleStudentPublish(id: string, isPublished: boolean) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(session.user.role)
  ) {
    throw new Error("Unauthorized");
  }

  const userEmail = session.user.email;
  if (!userEmail) throw new Error("User email not found in session");

  return executeAction(async () => {
    const admin = await prisma.admin.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, branch: true },
    });
    if (!admin) throw new Error("Admin not found");

    if (admin.role === "BRANCH_ADMIN") {
      const existing = await prisma.bestOutgoingStudent.findUnique({
        where: { id },
        select: { branch: true, isOverall: true },
      });

      if (!existing) throw new Error("Student not found");

      // 1. Branch Admins cannot toggle publish status of overall best students
      if (existing.isOverall) {
        throw new Error(
          "Only Super Admin can publish overall best outgoing students",
        );
      }

      // 2. Branch Admins can only toggle publish status for students from their own branch
      const adminBranch = (admin.branch || "").trim().toLowerCase();
      const studentBranch = (existing.branch || "").trim().toLowerCase();

      if (!adminBranch || adminBranch !== studentBranch) {
        throw new Error("You can only modify students from your own branch");
      }
    }

    const student = await prisma.bestOutgoingStudent.update({
      where: { id },
      data: { isPublished },
    });

    revalidatePath("/(dashboard)/super-admin/awards/best-outgoing");
    revalidatePath("/(dashboard)/branch-admin/content/outgoing-students");
    return { success: true, data: student };
  }, "toggleStudentPublish");
}
