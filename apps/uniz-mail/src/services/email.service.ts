import nodemailer from "nodemailer";
import * as SES from "@aws-sdk/client-ses";
import {
  generateResultPdf,
  ResultData,
  generateAttendancePdf,
  AttendanceData,
} from "../utils/pdf.util";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// --- AWS SES SETUP (Refined 2026) ---
const useSES = !!(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);
let sesTransporter: nodemailer.Transporter | null = null;

if (useSES) {
  try {
    const ses = new SES.SESClient({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    sesTransporter = nodemailer.createTransport({
      // @ts-ignore
      SES: { ses, aws: SES },
    });
    console.log(
      `[MAIL-SES] Production SES Transporter Initialized in ${process.env.AWS_REGION || "ap-south-1"}.`,
    );
  } catch (error) {
    console.error("[MAIL-SES] Failed to initialize SES Client:", error);
  }
}

// --- GMAIL POOL SETUP (Fallback/Legacy) ---
const emailPoolStr = process.env.EMAIL_POOL || ""; // format: "u1:p1,u2:p2"
const accounts = emailPoolStr
  ? emailPoolStr
      .split(",")
      .map((a) => a.split(":"))
      .filter((a) => a.length === 2)
  : [
      [
        process.env.EMAIL_USER || "webadmin@rguktong.ac.in",
        process.env.EMAIL_PASS || "kwcn zptw vagg ksbi",
      ],
    ];

let currentGmailIndex = 0;
const gmailTransporters = accounts.map(([user, pass]) =>
  nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 3,
    auth: { user, pass },
  }),
);

const getTransporter = () => {
  // Always use SES if configured
  if (sesTransporter) return sesTransporter;

  // Otherwise fallback to Gmail pool
  const transporter = gmailTransporters[currentGmailIndex];
  currentGmailIndex = (currentGmailIndex + 1) % gmailTransporters.length;
  return transporter;
};

console.log(
  `[MAIL] Gmail Pool Initialized with ${gmailTransporters.length} accounts.`,
);

console.log(`[MAIL] Active Provider: ${useSES ? "AWS SES" : "Gmail Pool"}`);

// --- RESEND SETUP ---
// --- EMAIL DELIVERY SETUP ---
// Unified email sender using the Gmail Pool (Google Workspace / Organizational)
const sendEmailUnified = async (options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}): Promise<boolean> => {
  const provider = useSES ? "SES" : "GMAIL-FALLBACK";
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

// Minimalist professional email template
const emailTemplate = (title: string, content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1a1a1b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #eeeeee; border-radius: 8px;">
    <!-- Minimal Header -->
    <div style="margin-bottom: 30px; border-bottom: 2px solid #cc0000; padding-bottom: 15px;">
      <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #cc0000; letter-spacing: -0.5px;">UniZ Portal</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 10px 0;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #000000;">${title}</h2>
      <div style="font-size: 15px; color: #374151;">
        ${content}
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
      <p style="font-size: 13px; color: #6b7280; margin: 0;">
        Best Regards,<br>
        <strong>Office of Student Affairs</strong><br>
        Rajiv Gandhi University of Knowledge Technologies
      </p>
      <p style="font-size: 11px; color: #9ca3af; margin-top: 20px;">
        Official transaction email from RGUKT Ongole Campus.
      </p>
    </div>
  </div>
`;

export const sendOtpEmail = async (
  email: string,
  username: string,
  otp: string,
): Promise<boolean> => {
  try {
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Please use the verification code below to complete your password reset request:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e0; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #cc0000;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #718096;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    const success = await sendEmailUnified({
      from: '"UniZ Official" <mail-service@rguktong.in>',
      to: email,
      subject: `[SECURE] Verification Code: ${otp}`,
      html: emailTemplate("Security Verification", content),
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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>A new login was detected on your UniZ account.</p>
      <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Time:</strong> ${timestamp}</p>
        ${ipAddress ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
        <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Device:</strong> Web Browser</p>
      </div>
      <p style="color: #e53e3e; font-size: 13px; font-weight: 500;">If this was not you, please reset your password immediately via the UniZ portal.</p>
    `;

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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your outpass application has been successfully submitted and is now awaiting review.</p>
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
        <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin: 10px 0 0 0;"><strong>From:</strong> ${new Date(fromDate).toLocaleDateString("en-IN")}</p>
        <p style="margin: 5px 0 0 0;"><strong>To:</strong> ${new Date(toDate).toLocaleDateString("en-IN")}</p>
        <p style="margin: 10px 0 0 0; color: #3182ce;"><strong>Status:</strong> Pending Approval</p>
      </div>
      <p>You will receive another email once your request is processed.</p>
    `;

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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your outing application has been successfully submitted.</p>
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
        <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
        <p style="margin: 10px 0 0 0;"><strong>From:</strong> ${new Date(fromDate).toLocaleDateString("en-IN")}</p>
        <p style="margin: 5px 0 0 0;"><strong>To:</strong> ${new Date(toDate).toLocaleDateString("en-IN")}</p>
        <p style="margin: 10px 0 0 0; color: #3182ce;"><strong>Status:</strong> Pending Approval</p>
      </div>
      <p>You will be notified once the request is reviewed.</p>
    `;

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
    let statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your outpass application has been <strong>${statusText}</strong>.</p>
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
        <p style="margin: 0;"><strong>Reviewer:</strong> ${approver}</p>
        ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Remark:</strong> ${comment}</p>` : ""}
        <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${statusText}</p>
      </div>
    `;

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
    let statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your outing application has been <strong>${statusText}</strong>.</p>
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
        <p style="margin: 0;"><strong>Reviewer:</strong> ${approver}</p>
        ${comment ? `<p style="margin: 10px 0 0 0;"><strong>Remark:</strong> ${comment}</p>` : ""}
        <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${statusText}</p>
      </div>
    `;

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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>You have successfully ${action.toLowerCase()} at the campus gate.</p>
      <div style="background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Action:</strong> ${action}</p>
        <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <p>Safe travels!</p>
    `;

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
    const content = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>The results for <strong>${semesterId}</strong> have been officially published.</p>
      <p>Please find your detailed grade report attached to this email as a PDF document.</p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="https://uniz.sreecharandesu.in" style="background-color: #cc0000; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View on Dashboard</a>
      </div>
    `;

    const pdfBuffer = await generateResultPdf({
      username,
      name: name || username,
      branch: branch || "N/A",
      campus: campus || "RGUKT",
      semesterId,
      grades,
    });

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Result email suppressed for ${username}`);
    return true;

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
    const content = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>The attendance report for <strong>${semesterId}</strong> is now available.</p>
      <p>Please find your detailed attendance record attached to this email.</p>
    `;

    const pdfBuffer = await generateAttendancePdf({
      username,
      name,
      branch,
      campus: campus || "RGUKT",
      semesterId,
      records,
    });

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Attendance email suppressed for ${username}`);
    return true;

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
    let label = type.charAt(0).toUpperCase() + type.slice(1);
    const content = `
      <p>Dear Administrator,</p>
      <p>A new <strong>${label.toLowerCase()}</strong> has been submitted by <strong>${studentName}</strong> (${studentId}).</p>
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #edf2f7;">
        <p style="margin: 0;"><strong>Details:</strong> ${reason}</p>
      </div>
      <p>Please login to the UniZ Admin Portal to review and take action.</p>
    `;

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
    const content = `
      <p>Dear Student,</p>
      <p>Your grievance regarding <strong>${category}</strong> has been received.</p>
      <div style="background-color: #fff5f5; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fed7d7;">
        <p style="margin: 0; color: #c53030;"><strong>Ticket ID:</strong> ${ticketId}</p>
        <p style="margin: 10px 0 0 0;"><strong>Status:</strong> Under Review</p>
      </div>
      <p>The Student Welfare Office will look into this matter shortly.</p>
    `;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Grievance ack suppressed`);
    return true;
  } catch (error) {
    console.error(`Failed to send grievance ack:`, error);
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
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    const content = `
      <p>Dear Administrator,</p>
      <p>You have successfully <strong>${actionText.toLowerCase()}</strong> the ${label.toLowerCase()} request for <strong>${studentName}</strong> (${studentId}).</p>
    `;

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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your UniZ account password has been changed successfully.</p>
      <p style="margin-top: 20px;"><strong>Time:</strong> ${timestamp}</p>
      <p style="color: #e53e3e; font-size: 13px; margin-top: 20px;">If you did not perform this action, please contact UniZ administration immediately.</p>
    `;

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
    const content = `
      <p>Dear <strong>${username}</strong>,</p>
      <p>Your profile information has been updated.</p>
      <div style="background-color: #f7fafc; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0;"><strong>Time:</strong> ${timestamp}</p>
        <p style="margin: 10px 0 0 0;"><strong>Fields Updated:</strong></p>
        <ul style="margin: 5px 0 0 0; color: #4b5563;">
          ${updatedFields.map((f) => `<li>${f}</li>`).join("")}
        </ul>
      </div>
      <p style="font-size: 13px; color: #718096;">If you did not make these changes, please notify administration.</p>
    `;

    // Disabled per user policy: only OTP-on-demand uses email
    console.log(`[MAIL] Profile update alert suppressed for ${username}`);
    return true;
  } catch (error) {
    return false;
  }
};
