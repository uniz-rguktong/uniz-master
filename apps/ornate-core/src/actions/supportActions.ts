"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/api-utils";

export interface SupportActionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function submitSupportTicket(
  formData: FormData,
): Promise<SupportActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  return executeAction(async () => {
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const category = formData.get("category") as string;
    const priority = (formData.get("priority") as string) || "medium";

    if (!subject || !message) {
      return {
        success: false,
        error: "Subject and message are required fields.",
      };
    }

    // 1. Identification: Determine who is sending the ticket
    let sender: {
      id: string;
      name: string | null;
      role?: string;
      branch?: string | null;
    } | null = await prisma.admin.findUnique({
      where: { email: session.user!.email! },
      select: { id: true, name: true, role: true, branch: true },
    });

    if (!sender) {
      const user = await prisma.user.findUnique({
        where: { email: session.user!.email! },
        select: { id: true, name: true },
      });
      if (user) {
        sender = { id: user.id, name: user.name };
      }
    }

    if (!sender) {
      return { success: false, error: "Account identity verification failed." };
    }

    // 2. Routing: Find a Super Admin to receive the ticket
    const supportAgent = await prisma.admin.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, name: true, role: true },
    });

    if (!supportAgent) {
      return {
        success: false,
        error: "Support service currently unavailable (No admins found).",
      };
    }

    // 3. Ticket Creation: Create a structured Notification record
    const ticketPayload = JSON.stringify({
      title: subject,
      category: category,
      body: message,
      contactEmail: session.user!.email,
      timestamp: new Date().toISOString(),
    });

    await prisma.notification.create({
      data: {
        senderId: sender.id,
        senderName: sender.name || "System User",
        senderRole: sender.role || "USER",
        senderBranch: sender.branch || "N/A",
        recipientId: supportAgent.id,
        recipientName: supportAgent.name || "Support Agent",
        recipientRole: supportAgent.role,
        message: ticketPayload,
        priority: priority,
        type: "support_ticket",
        isRead: false,
      },
    });

    return { success: true, message: "Support ticket submitted successfully." };
  }, "submitSupportTicket");
}
