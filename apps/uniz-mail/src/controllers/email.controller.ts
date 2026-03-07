import { Request, Response } from "express";
import {
  sendOtpEmail,
  sendResultEmail,
  sendLoginNotification,
  sendOutpassRequestNotification,
  sendOutingRequestNotification,
  sendOutpassApprovalNotification,
  sendOutingApprovalNotification,
  sendNewRequestAlertToAdmin,
  sendActionConfirmationToAdmin,
  sendCheckpointNotification,
  sendPasswordChangeNotification,
  sendProfileUpdateNotification,
  sendAttendanceReportEmail,
  sendGrievanceSubmissionNotification,
} from "../services/email.service";

export const sendEmail = async (req: Request, res: Response) => {
  const { type, to, data } = req.body;
  console.log(`[MAIL] Received request: type=${type}, to=${to}`);

  try {
    let success = false;
    switch (type) {
      case "otp":
        success = await sendOtpEmail(to, data.username, data.otp);
        break;
      case "results":
        success = await sendResultEmail(
          to,
          data.username,
          data.name,
          data.branch,
          data.campus,
          data.semesterId,
          data.grades,
        );
        break;
      case "attendance_report":
        success = await sendAttendanceReportEmail(
          to,
          data.username,
          data.name,
          data.branch,
          data.campus || "RGUKT Ongole",
          data.semesterId,
          data.records,
        );
        break;
      case "login_alert":
        success = await sendLoginNotification(to, data.username, data.ip);
        break;
      case "outpass_request":
        success = await sendOutpassRequestNotification(
          to,
          data.username,
          data.reason,
          data.fromDate,
          data.toDate,
        );
        break;
      case "outing_request":
        success = await sendOutingRequestNotification(
          to,
          data.username,
          data.reason,
          data.fromDate,
          data.toDate,
        );
        break;
      case "outpass_approval":
        success = await sendOutpassApprovalNotification(
          to,
          data.username,
          data.status,
          data.approver,
          data.comment,
        );
        break;
      case "outing_approval":
        success = await sendOutingApprovalNotification(
          to,
          data.username,
          data.status,
          data.approver,
          data.comment,
        );
        break;
      case "admin_alert":
        success = await sendNewRequestAlertToAdmin(
          to,
          data.studentName,
          data.studentId,
          data.reason,
          data.type,
        );
        break;
      case "admin_action_confirmation":
        success = await sendActionConfirmationToAdmin(
          to,
          data.action,
          data.studentName,
          data.studentId,
          data.type,
        );
        break;
      case "checkpoint":
        success = await sendCheckpointNotification(
          to,
          data.username,
          data.type,
          data.time,
        );
        break;
      case "password_change":
        success = await sendPasswordChangeNotification(to, data.username);
        break;
      case "profile_update":
        success = await sendProfileUpdateNotification(
          to,
          data.username,
          data.updatedFields,
        );
        break;
      case "grievance_submission":
        success = await sendGrievanceSubmissionNotification(
          to,
          data.category,
          data.ticketId,
        );
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid email type" });
    }

    return res.json({ success });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to send email due to a mail server error.",
    });
  }
};
