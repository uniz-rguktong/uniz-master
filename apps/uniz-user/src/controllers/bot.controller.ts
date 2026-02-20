import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";

const prisma = new PrismaClient();

// Internal Secret validation
const INTERNAL_SECRET = process.env.INTERNAL_BOT_SECRET || "SUPER_SECRET_VALUE";

export const validateBotToken = (req: Request, res: Response, next: any) => {
  const secret = req.headers["x-internal-secret"];
  if (secret !== INTERNAL_SECRET) {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized Bot Request" });
  }
  next();
};

export const linkTelegramAccount = async (req: Request, res: Response) => {
  try {
    const { chatId, telegramCode } = req.body;

    const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();

    const targetUsername = await redis.get(`bot_link_${telegramCode}`);
    await redis.disconnect();

    if (!targetUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired link code." });
    }

    const profile = await prisma.studentProfile.update({
      where: { username: targetUsername },
      data: { telegramChatId: chatId.toString() },
    });

    res.status(200).json({
      success: true,
      studentId: profile.username,
      name: profile.name,
      message: "Account successfully linked.",
    });
  } catch (err: any) {
    console.error("Link Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to link account." });
  }
};

export const getBotProfile = async (req: Request, res: Response) => {
  try {
    const chatId = req.query.chatId as string;

    const profile = await prisma.studentProfile.findFirst({
      where: { telegramChatId: chatId.toString() },
    });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found or not linked." });
    }

    res.status(200).json({
      success: true,
      name: profile.name,
      studentId: profile.username,
      branch: profile.branch,
      isPresentInCampus: profile.isPresentInCampus,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile." });
  }
};
