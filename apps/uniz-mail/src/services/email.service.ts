import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import * as sesv2 from "@aws-sdk/client-sesv2";
import * as SESv2Saves from "@aws-sdk/client-sesv2";
import {
  generateResultPdf,
  ResultData,
  generateAttendancePdf,
  AttendanceData,
} from "../utils/pdf.util";
import {
  buildAdminActionEmail,
  buildAdminAlertEmail,
  buildAttendanceEmail,
  buildCheckpointEmail,
  buildGrievanceResolvedEmail,
  buildGrievanceSubmissionEmail,
  buildLoginAlertEmail,
  buildOtpEmail,
  buildOutingApprovalEmail,
  buildOutingRequestEmail,
  buildOutpassApprovalEmail,
  buildOutpassRequestEmail,
  buildPasswordChangeEmail,
  buildProfileUpdateEmail,
  buildResultsEmail,
  formatGrievanceCategoryLabel,
  formatStudentDisplayName,
  isActionableGrievanceDescription,
} from "@uniz/shared";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// --- PROVIDER SELECTION ---
const isProduction = process.env.DOCKER_ENV === "true";
const forceGmail = process.env.FORCE_GMAIL === "true";

let sesTransporter: Transporter | null = null;

if (isProduction && !forceGmail) {
  try {
    const accessKeyId =
      process.env.PROD_AWS_ACCESS_KEY_NEWONE_AFTER_LEAK ||
      process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.PROD_AWS_ACCESS_KEY_SECRET_NEWONE_AFTER_LEAK ||
      process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || "ap-south-1";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS Credentials missing for SES production.");
    }

    const sesClient = new sesv2.SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    sesTransporter = nodemailer.createTransport({
      SES: {
        sesClient,
        SendEmailCommand: sesv2.SendEmailCommand,
      },
    } as any);

    console.log(
      `[MAIL-SES] Production SES v3 Transporter Initialized with key prefix: ${accessKeyId.substring(0, 5)}...`,
    );
  } catch (error) {
    console.error(`[MAIL-SES] initialization failed: ${error}`);
  }
}

// --- GMAIL SETUP (Local / Fallback) ---
const localGmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "noreplycampusschield@gmail.com",
    pass: (process.env.EMAIL_PASS || "acix rfbi kujh xwtj").replace(/\s/g, ""),
  },
});

const getTransporter = () => {
  if (sesTransporter) return sesTransporter;
  return localGmailTransporter;
};

console.log(`[MAIL] Transporter Initialized.`);
console.log(`[MAIL] Active Provider: ${sesTransporter ? "AWS SES" : "Gmail"}`);

// --- RESEND SETUP ---
// --- EMAIL DELIVERY SETUP ---
// Unified email sender using the Gmail Pool (Google Workspace / Organizational)
const sendEmailUnified = async (options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}): Promise<boolean> => {
  const provider = sesTransporter ? "SES" : "GMAIL";
  try {
    const info = await getTransporter().sendMail({
      ...options,
      headers: {
        "X-Entity-Ref-ID": `uniz-${Date.now()}`,
        "X-Priority": "1 (Highest)",
        "X-Mailer": "UniZ-Mail-Engine",
      },
    });

    console.log(
      `[MAIL-SUCCESS] [${provider}] ID=${info.messageId}, To=${options.to}, Subject="${options.subject}"`,
    );
    return true;
  } catch (err: any) {
    // Classification of errors for robustness during surges
    if (err.message?.includes("Throttling") || err.code === "Throttling") {
      console.error(
        `[MAIL-CRITICAL] [${provider}] SES Rate Limit Exceeded. Surge protection active.`,
      );
    } else if (
      err.message?.includes("Blacklisted") ||
      err.name === "MessageRejected"
    ) {
      console.error(
        `[MAIL-BOUNCE] [${provider}] Recipient ${options.to} rejected/bounced. Flagging for review.`,
      );
      // TODO: Implement DB flag for invalid email if we add a persistence layer here
    } else {
      console.error(
        `[MAIL-ERROR] [${provider}] Delivery failed for ${options.to}:`,
        err.message,
      );
    }
    return false;
  }
};

// Logic moved to simplified sendEmailUnified above

// Layout and copy live in @uniz/shared email-messages.

export const sendOtpEmail = async (
  email: string,
  username: string,
  otp: string,
): Promise<boolean> => {
  try {
    const rendered = buildOtpEmail({ username, otp });
    const success = await sendEmailUnified({
      from: '"uniZ" <no-reply@rguktong.in>',
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    return success;
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
    return false;
  }
};

export const sendLoginNotification = async (
  email: string,
  username: string,
  ipAddress?: string,
): Promise<boolean> => {
  try {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const rendered = buildLoginAlertEmail({ username, timestamp, ipAddress });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Login notification suppressed for ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to send login notification:`, error);
    return false;
  }
};

export const sendOutpassRequestNotification = async (
  email: string,
  username: string,
  reason: string,
  fromDate: string,
  toDate: string,
): Promise<boolean> => {
  try {
    const rendered = buildOutpassRequestEmail({
      username,
      reason,
      fromDate,
      toDate,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Outpass notification suppressed for ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to send outpass request notification:`, error);
    return false;
  }
};

export const sendOutingRequestNotification = async (
  email: string,
  username: string,
  reason: string,
  fromDate: string,
  toDate: string,
): Promise<boolean> => {
  try {
    const rendered = buildOutingRequestEmail({
      username,
      reason,
      fromDate,
      toDate,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Outing notification suppressed for ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to send outing request notification:`, error);
    return false;
  }
};

export const sendOutpassApprovalNotification = async (
  email: string,
  username: string,
  status: "approved" | "rejected" | "forwarded",
  approver: string,
  comment?: string,
): Promise<boolean> => {
  try {
    const rendered = buildOutpassApprovalEmail({
      username,
      status,
      approver,
      comment,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Outpass approval suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const sendOutingApprovalNotification = async (
  email: string,
  username: string,
  status: "approved" | "rejected" | "forwarded",
  approver: string,
  comment?: string,
): Promise<boolean> => {
  try {
    const rendered = buildOutingApprovalEmail({
      username,
      status,
      approver,
      comment,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Outing approval suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const sendCheckpointNotification = async (
  email: string,
  username: string,
  type: "check_in" | "check_out",
  time: string,
): Promise<boolean> => {
  try {
    const action = type === "check_in" ? "Checked In" : "Checked Out";
    const rendered = buildCheckpointEmail({ username, action, time });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Checkpoint notification suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const sendResultEmail = async (
  email: string,
  username: string,
  name: string,
  branch: string,
  campus: string,
  semesterId: string,
  grades: any[],
): Promise<boolean> => {
  try {

    const rendered = buildResultsEmail({
      name: name || username,
      semesterId,
    });
    const pdfBuffer = await generateResultPdf({
      username,
      name: name || username,
      branch: branch || "N/A",
      campus: campus || "RGUKT",
      semesterId,
      grades,
    });
    void rendered;
    void pdfBuffer;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Result email suppressed for ${username}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to send result email:`, error.message);
    return false;
  }
};

export const sendAttendanceReportEmail = async (
  email: string,
  username: string,
  name: string,
  branch: string,
  campus: string,
  semesterId: string,
  records: any[],
): Promise<boolean> => {
  try {

    const rendered = buildAttendanceEmail({
      name: name || username,
      semesterId,
    });
    const pdfBuffer = await generateAttendancePdf({
      username,
      name,
      branch,
      campus: campus || "RGUKT",
      semesterId,
      records,
    });
    void rendered;
    void pdfBuffer;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Attendance email suppressed for ${username}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to send attendance email:`, error.message);
    return false;
  }
};

export const sendNewRequestAlertToAdmin = async (
  adminEmail: string,
  studentName: string,
  studentId: string,
  reason: string,
  type: string = "outpass",
): Promise<boolean> => {
  try {
    const rendered = buildAdminAlertEmail({
      studentName,
      studentId,
      reason,
      type,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Admin alert suppressed`);
    return true;
  } catch (error) {
    console.error(`Failed to send admin alert:`, error);
    return false;
  }
};

export const sendGrievanceSubmissionNotification = async (
  email: string,
  category: string,
  ticketId: string,
): Promise<boolean> => {
  try {
    const rendered = buildGrievanceSubmissionEmail({ category, ticketId });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Grievance ack suppressed`);
    return true;
  } catch (error) {
    console.error(`Failed to send grievance ack:`, error);
    return false;
  }
};

export const sendGrievanceResolvedNotification = async (
  email: string,
  studentName: string,
  category: string,
  description: string,
): Promise<boolean> => {
  try {
    const safeName = formatStudentDisplayName(studentName);
    const categoryLabel = formatGrievanceCategoryLabel(category);
    const actionable = isActionableGrievanceDescription(description);
    const rendered = buildGrievanceResolvedEmail({
      studentName: safeName,
      category,
      categoryLabel,
      actionable,
    });

    return await sendEmailUnified({
      from: '"uniZ SWO" <no-reply@rguktong.in>',
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  } catch (error) {
    console.error(`Failed to send grievance resolved email:`, error);
    return false;
  }
};

export const sendActionConfirmationToAdmin = async (
  adminEmail: string,
  action: "approved" | "rejected",
  studentName: string,
  studentId: string,
  type: "outing" | "outpass" = "outpass",
): Promise<boolean> => {
  try {
    const rendered = buildAdminActionEmail({
      action,
      studentName,
      studentId,
      type,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Admin confirmation suppressed`);
    return true;
  } catch (error) {
    return false;
  }
};

export const sendPasswordChangeNotification = async (
  email: string,
  username: string,
): Promise<boolean> => {
  try {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const rendered = buildPasswordChangeEmail({ username, timestamp });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Password change alert suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};

export const sendProfileUpdateNotification = async (
  email: string,
  username: string,
  updatedFields: string[],
): Promise<boolean> => {
  try {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const rendered = buildProfileUpdateEmail({
      username,
      timestamp,
      updatedFields,
    });
    void rendered;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Profile update alert suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};
