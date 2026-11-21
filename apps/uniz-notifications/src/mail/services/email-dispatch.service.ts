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
  sendGrievanceResolvedNotification,
  sendPlainNoticeEmail,
} from "./email.service";
import { preparePlainNotice, type PreparedPlainNotice } from "./plain-notice";

export const EMAIL_TYPES = [
  "otp",
  "results",
  "attendance_report",
  "login_alert",
  "outpass_request",
  "outing_request",
  "outpass_approval",
  "outing_approval",
  "admin_alert",
  "admin_action_confirmation",
  "checkpoint",
  "password_change",
  "profile_update",
  "grievance_submission",
  "grievance_resolved",
  "plain_notice",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export async function dispatchEmailByType(
  type: string,
  to: string,
  data: Record<string, any> = {},
  deps?: {
    sendPlainNotice?: (notice: PreparedPlainNotice) => Promise<boolean>;
  },
): Promise<boolean> {
  switch (type) {
    case "otp":
      return sendOtpEmail(to, data.username, data.otp);
    case "results":
      return sendResultEmail(
        to,
        data.username,
        data.name,
        data.branch,
        data.campus,
        data.semesterId,
        data.grades,
      );
    case "attendance_report":
      return sendAttendanceReportEmail(
        to,
        data.username,
        data.name,
        data.branch,
        data.campus || "RGUKT Ongole",
        data.semesterId,
        data.records,
      );
    case "login_alert":
      return sendLoginNotification(to, data.username, data.ip);
    case "outpass_request":
      return sendOutpassRequestNotification(
        to,
        data.username,
        data.reason,
        data.fromDate,
        data.toDate,
      );
    case "outing_request":
      return sendOutingRequestNotification(
        to,
        data.username,
        data.reason,
        data.fromDate,
        data.toDate,
      );
    case "outpass_approval":
      return sendOutpassApprovalNotification(
        to,
        data.username,
        data.status,
        data.approver,
        data.comment,
      );
    case "outing_approval":
      return sendOutingApprovalNotification(
        to,
        data.username,
        data.status,
        data.approver,
        data.comment,
      );
    case "admin_alert":
      return sendNewRequestAlertToAdmin(
        to,
        data.studentName,
        data.studentId,
        data.reason,
        data.type,
      );
    case "admin_action_confirmation":
      return sendActionConfirmationToAdmin(
        to,
        data.action,
        data.studentName,
        data.studentId,
        data.type,
      );
    case "checkpoint":
      return sendCheckpointNotification(
        to,
        data.username,
        data.type,
        data.time,
      );
    case "password_change":
      return sendPasswordChangeNotification(to, data.username);
    case "profile_update":
      return sendProfileUpdateNotification(
        to,
        data.username,
        data.updatedFields,
      );
    case "grievance_submission":
      return sendGrievanceSubmissionNotification(
        to,
        data.category,
        data.ticketId,
      );
    case "grievance_resolved":
      return sendGrievanceResolvedNotification(
        to,
        data.studentName,
        data.category,
        data.description ?? "",
      );
    case "plain_notice": {
      const notice = preparePlainNotice(to, data);
      const send = deps?.sendPlainNotice ?? sendPlainNoticeEmail;
      return send(notice);
    }
    default:
      throw new Error(`Invalid email type: ${type}`);
  }
}
