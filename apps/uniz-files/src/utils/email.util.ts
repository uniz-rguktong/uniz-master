import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
    const fieldsList = updatedFields
      .map((field) => `<li>${field}</li>`)
      .join("");
    const text = `Hello ${username},

Your profile has been updated successfully.

Updated at: ${timestamp}
Fields updated:
${updatedFields.map((field) => `- ${field}`).join("\n")}

If you did not make these changes, please contact the administrator immediately.${emailFooter}`;

    await transporter.sendMail({
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
      from: '"UniZ Campus" <noreplycampusschield@gmail.com>',
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
