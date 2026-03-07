"use server";

import { getServerSession } from "next-auth";
import logger from "@/lib/logger";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTasks } from "@/lib/revalidation";
import { executeAction } from "@/lib/api-utils";

export interface TaskActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  assignedTo: string;
  priority: string;
  status: string;
}

// Create a new task
export async function createTask(
  formData: FormData,
): Promise<TaskActionResponse<TaskData>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return executeAction(async () => {
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const dateInput = formData.get("date") as string;
    const time = (formData.get("time") as string) || "";
    const assignedTo = formData.get("assignedTo") as string;
    const priority = (formData.get("priority") as string) || "medium";
    const status = (formData.get("status") as string) || "pending";

    if (!title || !dateInput || !assignedTo) {
      return { success: false, error: "Missing required fields" };
    }

    const date = new Date(dateInput);

    const task = await prisma.task.create({
      data: {
        title,
        description,
        date,
        time,
        assignedTo,
        priority,
        status,
        creatorId: session.user!.id,
      },
    });

    await revalidateTasks();

    return {
      success: true,
      data: {
        ...task,
        date: task.date.toISOString().split("T")[0] as string,
        time: task.time || "",
      },
    };
  }, "createTask");
}

// Update a task
export async function updateTask(
  taskId: string,
  updates: Partial<
    Pick<
      TaskData,
      "title" | "description" | "assignedTo" | "priority" | "status"
    >
  > & { date?: string | Date; time?: string },
): Promise<TaskActionResponse<TaskData>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return executeAction(async () => {
    // Verify permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: { id: true, role: true, branch: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const isAdmin = session.user!.role === "SUPER_ADMIN";
    const isSameBranch =
      session.user!.role === "BRANCH_ADMIN" &&
      (task.creator?.branch || "") === (session.user!.branch || "");
    const isCreator = task.creatorId === session.user!.id;

    if (!isAdmin && !isSameBranch && !isCreator) {
      return { success: false, error: "Unauthorized to update this task" };
    }

    // Security: Explicitly pick allowed fields to prevent mass assignment
    const safeUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) safeUpdates.title = updates.title;
    if (updates.description !== undefined)
      safeUpdates.description = updates.description;
    if (updates.assignedTo !== undefined)
      safeUpdates.assignedTo = updates.assignedTo;
    if (updates.priority !== undefined) safeUpdates.priority = updates.priority;
    if (updates.status !== undefined) safeUpdates.status = updates.status;
    if (updates.time !== undefined) safeUpdates.time = updates.time;

    // If date is being updated and it's a string, convert to Date
    if (updates.date !== undefined) {
      safeUpdates.date =
        typeof updates.date === "string"
          ? new Date(updates.date)
          : updates.date;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: safeUpdates,
    });

    await revalidateTasks();

    return {
      success: true,
      data: {
        ...updatedTask,
        date: updatedTask.date.toISOString().split("T")[0] as string,
        time: updatedTask.time || "",
      },
    };
  }, "updateTask");
}

// Delete a task
export async function deleteTask(taskId: string): Promise<TaskActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  return executeAction(async () => {
    // Verify permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: {
          select: { id: true, role: true, branch: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const isAdmin = session.user!.role === "SUPER_ADMIN";
    const isSameBranch =
      session.user!.role === "BRANCH_ADMIN" &&
      (task.creator?.branch || "") === (session.user!.branch || "");
    const isCreator = task.creatorId === session.user!.id;

    if (!isAdmin && !isSameBranch && !isCreator) {
      return { success: false, error: "Unauthorized to delete this task" };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await revalidateTasks();

    return { success: true };
  }, "deleteTask");
}

// Get tasks for timeline
export async function getTasks(): Promise<TaskActionResponse<TaskData[]>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", data: [] as TaskData[] };
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, branch: true },
    });

    if (!admin) {
      return {
        success: false,
        error: "Admin not found",
        data: [] as TaskData[],
      };
    }

    const isAdmin = admin.role === "SUPER_ADMIN";
    const branch = admin.branch;

    const tasks = await prisma.task.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [{ creatorId: admin.id }, { creator: { branch: branch } }],
          },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        assignedTo: true,
        priority: true,
        status: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Transform tasks to match frontend format
    const formattedTasks: TaskData[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      date: t.date.toISOString().split("T")[0] as string, // YYYY-MM-DD format
      time: t.time || "",
      assignedTo: t.assignedTo,
      priority: t.priority,
      status: t.status,
    }));

    return { success: true, data: formattedTasks };
  } catch (error: unknown) {
    logger.error({ err: error }, "Error fetching tasks");
    return {
      success: false,
      error: "Failed to fetch tasks",
      data: [] as TaskData[],
    };
  }
}
