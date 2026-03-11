import nodemailer from "nodemailer";
import * as SES from "@aws-sdk/client-ses";

// Environment-based Transporter Configuration
const isProduction = process.env.DOCKER_ENV === "true";

let transporter: nodemailer.Transporter;

if (isProduction) {
  // Use AWS SES for Production
  const ses = new SES.SES({
    apiVersion: "2010-12-01",
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId:
        process.env.PROD_AWS_ACCESS_KEY_NEWONE_AFTER_LEAK ||
        process.env.AWS_ACCESS_KEY_ID ||
        "",
      secretAccessKey:
        process.env.PROD_AWS_ACCESS_KEY_SECRET_NEWONE_AFTER_LEAK ||
        process.env.AWS_SECRET_ACCESS_KEY ||
        "",
    },
  });

  transporter = nodemailer.createTransport({
    SES: { ses, aws: SES },
  });
  console.log("[Mail] Using AWS SES Production Transporter");
} else {
  // Use Gmail for Local Development
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "noreplycampusschield@gmail.com",
      pass: process.env.EMAIL_PASS || "acix rfbi kujh xwtj",
    },
  });
  console.log("[Mail] Using Gmail Local Transporter");
}

const FROM_NAME = "UniZ Campus";
const FROM_EMAIL = isProduction
  ? process.env.SES_FROM_EMAIL || "no-reply-ems@rguktong.in"
  : process.env.EMAIL_USER || "noreplycampusschield@gmail.com";

const SENDER = `"${FROM_NAME}" <${FROM_EMAIL}>`;

// Minimal text footer
const emailFooter = `

Regards,
UniZ Portal
Rajiv Gandhi University of Knowledge Technologies`;

export const sendOtpEmail = async (
  email: string,
  username: string,
  otp: string,
): Promise<boolean> => {
  try {
    const text = `Hello ${username},

You have requested to reset your password. Please use the following OTP to proceed:

${otp}

This OTP will expire in 10 minutes.

If you did not request this, please contact the administrator immediately.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Password Reset OTP",
      text,
    });
    console.log(`OTP email sent to ${email}`);
    return true;
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
    const text = `Hello ${username},

A successful login was detected on your account.

Time: ${timestamp}
${ipAddress ? `IP Address: ${ipAddress}\n` : ""}Device: Web Browser

If this wasn't you, please reset your password immediately and contact the administrator.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Login Notification",
      text,
    });
    console.log(`Login notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send login notification:`, error);
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
    const text = `Hello ${username},

Your profile has been updated successfully.

Updated at: ${timestamp}
Fields updated:
${updatedFields.map((field) => `- ${field}`).join("\n")}

If you did not make these changes, please contact the administrator immediately.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Profile Updated",
      text,
    });
    console.log(`Profile update notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send profile update notification:`, error);
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
    const text = `Hello ${username},

Your password has been changed successfully.

Changed at: ${timestamp}

If you did not make this change, your account may be compromised. Please contact the administrator immediately.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Password Changed",
      text,
    });
    console.log(`Password change notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password change notification:`, error);
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
    const text = `Hello ${username},

Your outpass request has been submitted successfully and is pending approval.

Reason: ${reason}
From: ${new Date(fromDate).toLocaleDateString("en-IN")}
To: ${new Date(toDate).toLocaleDateString("en-IN")}
Status: Pending Approval

You will be notified once your request is reviewed.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Outpass Request Submitted",
      text,
    });
    console.log(`Outpass request notification sent to ${email}`);
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
    const text = `Hello ${username},

Your outing request has been submitted successfully and is pending approval.

Reason: ${reason}
From: ${new Date(fromDate).toLocaleDateString("en-IN")}
To: ${new Date(toDate).toLocaleDateString("en-IN")}
Status: Pending Approval

You will be notified once your request is reviewed.${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: "UniZ - Outing Request Submitted",
      text,
    });
    console.log(`Outing request notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send outing request notification:`, error);
    return false;
  }
};

export const sendOutpassApprovalNotification = async (
  email: string,
  username: string,
  status: "approved" | "rejected",
  approver: string,
  comment?: string,
): Promise<boolean> => {
  try {
    const isApproved = status === "approved";
    const statusText = isApproved ? "Approved" : "Rejected";

    const text = `Hello ${username},

Your outpass request has been ${statusText.toLowerCase()}.

Status: ${statusText}
Reviewed by: ${approver}
${comment ? `Comment: ${comment}\n` : ""}
${
  isApproved
    ? "You may proceed with your outpass. Safe travels!"
    : "Please contact the administrator if you have any questions."
}${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: `UniZ - Outpass ${isApproved ? "Approved" : "Rejected"}`,
      text,
    });
    console.log(`Outpass ${status} notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send outpass ${status} notification:`, error);
    return false;
  }
};

export const sendOutingApprovalNotification = async (
  email: string,
  username: string,
  status: "approved" | "rejected",
  approver: string,
  comment?: string,
): Promise<boolean> => {
  try {
    const isApproved = status === "approved";
    const statusText = isApproved ? "Approved" : "Rejected";

    const text = `Hello ${username},

Your outing request has been ${statusText.toLowerCase()}.

Status: ${statusText}
Reviewed by: ${approver}
${comment ? `Comment: ${comment}\n` : ""}
${
  isApproved
    ? "You may proceed with your outing. Safe travels!"
    : "Please contact the administrator if you have any questions."
}${emailFooter}`;

    await transporter.sendMail({
      from: SENDER,
      to: email,
      subject: `UniZ - Outing ${isApproved ? "Approved" : "Rejected"}`,
      text,
    });
    console.log(`Outing ${status} notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send outing ${status} notification:`, error);
    return false;
  }
};
