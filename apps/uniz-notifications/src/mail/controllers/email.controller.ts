import { Request, Response } from "express";
import { enqueueNotificationJob } from "../../utils/queue.util";
import { preparePlainNotice } from "../services/plain-notice";

export const sendEmail = async (req: Request, res: Response) => {
  const { type, to, data } = req.body;
  console.log(`[MAIL] Queue request: type=${type}, to=${to}`);

  if (!type || !to) {
    return res
      .status(400)
      .json({ success: false, message: "type and to are required" });
  }

  if (type === "plain_notice") {
    try {
      preparePlainNotice(to, data || {});
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid plain notice";
      return res.status(400).json({ success: false, message });
    }
  }

  try {
    const jobName = type === "otp" ? "OTP_EMAIL" : "EMAIL";
    const job = await enqueueNotificationJob(jobName, {
      type,
      to,
      data: data || {},
      // Flatten otp fields for OTP_EMAIL convenience
      ...(type === "otp"
        ? { username: data?.username, otp: data?.otp, email: to }
        : {}),
    });

    return res.status(202).json({
      success: true,
      queued: true,
      jobId: job.id,
      message: "Email queued for delivery",
    });
  } catch (e: any) {
    console.error("[MAIL] Failed to enqueue email:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to queue email due to a mail server error.",
    });
  }
};
