import {
  escapeEmailHtml,
  renderUnizEmail,
  UNIZ_PORTAL_URL,
  type UnizEmailButton,
} from "./email-layout";

export type CampusEmail = {
  id: string;
  subject: string;
  html: string;
  text: string;
};

const RESULTS_URL = "https://uniz.sreecharandesu.in";

function paragraph(html: string): string {
  return `<p style="margin:0 0 12px 0;">${html}</p>`;
}

function detail(rows: Array<[string, string]>): string {
  const lines = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px 0;"><strong>${escapeEmailHtml(label)}:</strong> ${value}</p>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;background:#f2f5fb;border:1px solid #e3e5e9;"><tr><td style="padding:16px;">${lines}</td></tr></table>`;
}

function message(input: {
  id: string;
  subject: string;
  title: string;
  bodyHtml: string;
  reason: string;
  text: string;
  otp?: { code: string; expiresIn: string };
  button?: UnizEmailButton;
}): CampusEmail {
  const rendered = renderUnizEmail({
    title: input.title,
    bodyHtml: input.bodyHtml,
    reason: input.reason,
    text: input.text,
    otp: input.otp,
    button: input.button,
  });
  return { id: input.id, subject: input.subject, ...rendered };
}

function dateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeEmailHtml(value);
  return escapeEmailHtml(date.toLocaleDateString("en-IN"));
}

export function buildOtpEmail(input: {
  username: string;
  otp: string;
}): CampusEmail {
  const username = escapeEmailHtml(input.username);
  const text = [
    `Identity verification for ${input.username}.`,
    "",
    `Your code is ${input.otp}.`,
    "This code expires in 10 minutes.",
  ].join("\n");
  return message({
    id: "otp",
    subject: `Your uniZ access code: ${input.otp}`,
    title: "Verification required",
    reason: "you asked uniZ for an email code",
    bodyHtml:
      paragraph(`Identity verification for <strong>${username}</strong>.`) +
      paragraph(
        "Enter this code to continue. It works once and only for this request.",
      ),
    text,
    otp: { code: input.otp, expiresIn: "10 minutes" },
  });
}

export function buildLoginAlertEmail(input: {
  username: string;
  timestamp: string;
  ipAddress?: string;
}): CampusEmail {
  const username = escapeEmailHtml(input.username);
  const rows: Array<[string, string]> = [
    ["Time", escapeEmailHtml(input.timestamp)],
  ];
  if (input.ipAddress)
    rows.push(["IP address", escapeEmailHtml(input.ipAddress)]);
  rows.push(["Device", "Web browser"]);
  const text = [
    `A new login was detected on the uniZ account ${input.username}.`,
    `Time: ${input.timestamp}`,
    input.ipAddress ? `IP address: ${input.ipAddress}` : "",
    "If this was not you, reset your password in the portal.",
  ]
    .filter(Boolean)
    .join("\n");
  return message({
    id: "login_alert",
    subject: "New login on your uniZ account",
    title: "New login",
    reason: "someone signed in to your uniZ account",
    bodyHtml:
      paragraph(`Dear <strong>${username}</strong>,`) +
      paragraph("A new login was detected on your uniZ account.") +
      detail(rows) +
      paragraph("If this was not you, reset your password in the portal."),
    text,
    button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
  });
}

export function buildOutpassRequestEmail(input: {
  username: string;
  reason: string;
  fromDate: string;
  toDate: string;
}): CampusEmail {
  return requestEmail("outpass_request", "outpass", input);
}

export function buildOutingRequestEmail(input: {
  username: string;
  reason: string;
  fromDate: string;
  toDate: string;
}): CampusEmail {
  return requestEmail("outing_request", "outing", input);
}

function requestEmail(
  id: string,
  kind: "outpass" | "outing",
  input: {
    username: string;
    reason: string;
    fromDate: string;
    toDate: string;
  },
): CampusEmail {
  const username = escapeEmailHtml(input.username);
  const text = [
    `Your ${kind} application is awaiting review.`,
    `Reason: ${input.reason}`,
    `From: ${input.fromDate}`,
    `To: ${input.toDate}`,
    "Status: Pending approval",
  ].join("\n");
  return message({
    id,
    subject: `uniZ ${kind} request received`,
    title: `${kind[0].toUpperCase()}${kind.slice(1)} request received`,
    reason: `you submitted a ${kind} request in uniZ`,
    bodyHtml:
      paragraph(`Dear <strong>${username}</strong>,`) +
      paragraph(
        `Your ${kind} application has been submitted and is awaiting review.`,
      ) +
      detail([
        ["Reason", escapeEmailHtml(input.reason)],
        ["From", dateLabel(input.fromDate)],
        ["To", dateLabel(input.toDate)],
        ["Status", "Pending approval"],
      ]) +
      paragraph("You will get another email once the request is processed."),
    text,
  });
}

export function buildOutpassApprovalEmail(input: {
  username: string;
  status: string;
  approver: string;
  comment?: string;
}): CampusEmail {
  return approvalEmail("outpass_approval", "outpass", input);
}

export function buildOutingApprovalEmail(input: {
  username: string;
  status: string;
  approver: string;
  comment?: string;
}): CampusEmail {
  return approvalEmail("outing_approval", "outing", input);
}

function approvalEmail(
  id: string,
  kind: "outpass" | "outing",
  input: {
    username: string;
    status: string;
    approver: string;
    comment?: string;
  },
): CampusEmail {
  const statusText =
    input.status.charAt(0).toUpperCase() + input.status.slice(1);
  const rows: Array<[string, string]> = [
    ["Reviewer", escapeEmailHtml(input.approver)],
  ];
  if (input.comment) rows.push(["Remark", escapeEmailHtml(input.comment)]);
  rows.push(["Status", escapeEmailHtml(statusText)]);
  const text = [
    `Your ${kind} application has been ${statusText}.`,
    `Reviewer: ${input.approver}`,
    input.comment ? `Remark: ${input.comment}` : "",
    `Status: ${statusText}`,
  ]
    .filter(Boolean)
    .join("\n");
  return message({
    id,
    subject: `uniZ ${kind} ${statusText.toLowerCase()}`,
    title: `${kind[0].toUpperCase()}${kind.slice(1)} ${statusText.toLowerCase()}`,
    reason: `your ${kind} request was updated`,
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.username)}</strong>,`) +
      paragraph(
        `Your ${kind} application has been <strong>${escapeEmailHtml(statusText)}</strong>.`,
      ) +
      detail(rows),
    text,
  });
}

export function buildCheckpointEmail(input: {
  username: string;
  action: string;
  time: string;
}): CampusEmail {
  const text = [
    `You have ${input.action.toLowerCase()} at the campus gate.`,
    `Action: ${input.action}`,
    `Time: ${input.time}`,
  ].join("\n");
  return message({
    id: "checkpoint",
    subject: `uniZ gate: ${input.action}`,
    title: input.action,
    reason: "your campus gate record was updated",
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.username)}</strong>,`) +
      paragraph(
        `You have successfully ${escapeEmailHtml(input.action.toLowerCase())} at the campus gate.`,
      ) +
      detail([
        ["Action", escapeEmailHtml(input.action)],
        ["Time", escapeEmailHtml(input.time)],
      ]) +
      paragraph("Safe travels."),
    text,
  });
}

export function buildResultsEmail(input: {
  name: string;
  semesterId: string;
}): CampusEmail {
  const text = [
    `The results for ${input.semesterId} have been published.`,
    "The grade report is attached as a PDF.",
    `View them at ${RESULTS_URL}`,
  ].join("\n");
  return message({
    id: "results",
    subject: `uniZ results published: ${input.semesterId}`,
    title: "Results published",
    reason: "results were published for your semester",
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.name)}</strong>,`) +
      paragraph(
        `The results for <strong>${escapeEmailHtml(input.semesterId)}</strong> have been officially published.`,
      ) +
      paragraph(
        "Your detailed grade report is attached to this email as a PDF.",
      ),
    text,
    button: { label: "View on dashboard", href: RESULTS_URL },
  });
}

export function buildAttendanceEmail(input: {
  name: string;
  semesterId: string;
}): CampusEmail {
  const text = [
    `The attendance report for ${input.semesterId} is available.`,
    "The record is attached to this email.",
  ].join("\n");
  return message({
    id: "attendance_report",
    subject: `uniZ attendance report: ${input.semesterId}`,
    title: "Attendance report",
    reason: "an attendance report was prepared for you",
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.name)}</strong>,`) +
      paragraph(
        `The attendance report for <strong>${escapeEmailHtml(input.semesterId)}</strong> is now available.`,
      ) +
      paragraph("Your detailed attendance record is attached to this email."),
    text,
    button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
  });
}

export function buildAdminAlertEmail(input: {
  studentName: string;
  studentId: string;
  reason: string;
  type: string;
}): CampusEmail {
  const label = input.type.charAt(0).toUpperCase() + input.type.slice(1);
  const text = [
    `A new ${label.toLowerCase()} was submitted by ${input.studentName} (${input.studentId}).`,
    `Details: ${input.reason}`,
  ].join("\n");
  return message({
    id: "admin_alert",
    subject: `New ${label.toLowerCase()} request`,
    title: `New ${label.toLowerCase()}`,
    reason: "you receive uniZ administrator notices",
    bodyHtml:
      paragraph("Dear administrator,") +
      paragraph(
        `A new <strong>${escapeEmailHtml(label.toLowerCase())}</strong> has been submitted by <strong>${escapeEmailHtml(input.studentName)}</strong> (${escapeEmailHtml(input.studentId)}).`,
      ) +
      detail([["Details", escapeEmailHtml(input.reason)]]) +
      paragraph("Sign in to the uniZ admin portal to review it."),
    text,
    button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
  });
}

export function buildGrievanceSubmissionEmail(input: {
  category: string;
  ticketId: string;
}): CampusEmail {
  const text = [
    `Your grievance about ${input.category} has been received.`,
    `Ticket ID: ${input.ticketId}`,
    "Status: Under review",
  ].join("\n");
  return message({
    id: "grievance_submission",
    subject: `Grievance received: ${input.category}`,
    title: "Grievance received",
    reason: "you submitted a grievance in uniZ",
    bodyHtml:
      paragraph("Dear student,") +
      paragraph(
        `Your grievance regarding <strong>${escapeEmailHtml(input.category)}</strong> has been received.`,
      ) +
      detail([
        ["Ticket ID", escapeEmailHtml(input.ticketId)],
        ["Status", "Under review"],
      ]) +
      paragraph("The Student Welfare Office will look into this shortly."),
    text,
  });
}

export function buildGrievanceResolvedEmail(input: {
  studentName: string;
  category: string;
  categoryLabel: string;
  actionable: boolean;
}): CampusEmail {
  const name = escapeEmailHtml(input.studentName);
  const category = escapeEmailHtml(input.category);
  const label = escapeEmailHtml(input.categoryLabel);
  if (input.actionable) {
    const text = [
      `Dear ${input.studentName},`,
      `Your grievance about ${input.categoryLabel} has been marked resolved.`,
      `Category: ${input.category}`,
      "Status: Resolved",
      "If the issue remains, submit a follow-up through the uniZ portal.",
    ].join("\n");
    return message({
      id: "grievance_resolved",
      subject: `Grievance resolved: ${input.category}`,
      title: "Grievance resolved",
      reason: "the Student Welfare Office updated your grievance",
      bodyHtml:
        paragraph(`Dear <strong>${name}</strong>,`) +
        paragraph(
          `We have reviewed your grievance regarding <strong>${label}</strong>.`,
        ) +
        paragraph(
          "The Student Welfare Office has looked into the matter based on the details you shared, and this grievance has been marked as <strong>resolved</strong>.",
        ) +
        detail([
          ["Category", category],
          ["Status", "Resolved"],
        ]) +
        paragraph(
          "If you feel the issue is still unresolved, or if you have additional information to share, you may submit a follow-up grievance through the uniZ portal.",
        ) +
        paragraph("Thank you for bringing this to our attention.") +
        paragraph(
          "Regards,<br><strong>Student Welfare Office (SWO)</strong><br>Rajiv Gandhi University of Knowledge Technologies, Ongole",
        ),
      text,
      button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
    });
  }
  const text = [
    `Dear ${input.studentName},`,
    `We could not identify a specific concern in your ${input.categoryLabel} grievance, so it is closed.`,
    "Submit a new grievance with a clear description if the issue continues.",
  ].join("\n");
  return message({
    id: "grievance_closed",
    subject: `Grievance update: ${input.category}`,
    title: "Grievance closed",
    reason: "the Student Welfare Office updated your grievance",
    bodyHtml:
      paragraph(`Dear <strong>${name}</strong>,`) +
      paragraph("Thank you for using the uniZ grievance portal.") +
      paragraph(
        `We have reviewed your submission regarding <strong>${label}</strong>. After going through the details you shared, we were unable to identify a specific concern that we can take forward from the information provided.`,
      ) +
      paragraph(
        "For this reason, we are <strong>closing this grievance</strong>. This does not mean your concern is unimportant. We need a clear description of the issue so the Student Welfare Office can look into it properly.",
      ) +
      detail([
        ["Category", category],
        ["Status", "Closed"],
      ]) +
      paragraph(
        `If you are facing a genuine issue related to ${label}, please submit a <strong>new grievance</strong> with:`,
      ) +
      `<ul style="margin:0 0 12px 20px;padding:0;color:#0a0a0b;">
        <li>A brief, clear description of what happened</li>
        <li>When and where it occurred, if that applies</li>
        <li>Any other details that would help us verify and take action</li>
      </ul>` +
      paragraph(
        "If you need help submitting the grievance, reply to this email or contact the SWO office.",
      ) +
      paragraph(
        "Regards,<br><strong>Student Welfare Office (SWO)</strong><br>Rajiv Gandhi University of Knowledge Technologies, Ongole",
      ),
    text,
    button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
  });
}

export function buildAdminActionEmail(input: {
  action: string;
  studentName: string;
  studentId: string;
  type: string;
}): CampusEmail {
  const actionText =
    input.action.charAt(0).toUpperCase() + input.action.slice(1);
  const label = input.type.charAt(0).toUpperCase() + input.type.slice(1);
  const text = `You ${actionText.toLowerCase()} the ${label.toLowerCase()} request for ${input.studentName} (${input.studentId}).`;
  return message({
    id: "admin_action_confirmation",
    subject: `${label} ${actionText.toLowerCase()}`,
    title: `${label} ${actionText.toLowerCase()}`,
    reason: "you took an action in the uniZ admin portal",
    bodyHtml:
      paragraph("Dear administrator,") +
      paragraph(
        `You have successfully <strong>${escapeEmailHtml(actionText.toLowerCase())}</strong> the ${escapeEmailHtml(label.toLowerCase())} request for <strong>${escapeEmailHtml(input.studentName)}</strong> (${escapeEmailHtml(input.studentId)}).`,
      ),
    text,
  });
}

export function buildPasswordChangeEmail(input: {
  username: string;
  timestamp: string;
}): CampusEmail {
  const text = [
    `The password for ${input.username} was changed.`,
    `Time: ${input.timestamp}`,
    "If you did not do this, contact uniZ administration.",
  ].join("\n");
  return message({
    id: "password_change",
    subject: "Your uniZ password was changed",
    title: "Password changed",
    reason: "the password on your uniZ account was changed",
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.username)}</strong>,`) +
      paragraph("Your uniZ account password has been changed.") +
      detail([["Time", escapeEmailHtml(input.timestamp)]]) +
      paragraph(
        "If you did not do this, contact uniZ administration immediately.",
      ),
    text,
    button: { label: "Open uniZ", href: UNIZ_PORTAL_URL },
  });
}

export function buildProfileUpdateEmail(input: {
  username: string;
  timestamp: string;
  updatedFields: string[];
}): CampusEmail {
  const fields = input.updatedFields.map((field) => escapeEmailHtml(field));
  const text = [
    `Profile information for ${input.username} was updated.`,
    `Time: ${input.timestamp}`,
    `Fields: ${input.updatedFields.join(", ")}`,
  ].join("\n");
  return message({
    id: "profile_update",
    subject: "Your uniZ profile was updated",
    title: "Profile updated",
    reason: "profile details on your uniZ account were changed",
    bodyHtml:
      paragraph(`Dear <strong>${escapeEmailHtml(input.username)}</strong>,`) +
      paragraph("Your profile information has been updated.") +
      detail([
        ["Time", escapeEmailHtml(input.timestamp)],
        ["Fields", fields.join(", ")],
      ]) +
      paragraph(
        "If you did not make these changes, notify the administration.",
      ),
    text,
  });
}

export function buildPlainNoticeEmail(input: {
  subject: string;
  bodyHtml: string;
  text: string;
}): CampusEmail {
  const rendered = renderUnizEmail({
    title: "Campus notice",
    preheader: input.subject,
    bodyHtml: input.bodyHtml,
    reason: "a campus notice was addressed to you",
    text: input.text,
  });
  return {
    id: "plain_notice",
    subject: input.subject,
    html: rendered.html,
    text: rendered.text,
  };
}

/** Fixture of every outbound template, for previews and layout tests. */
export function previewCampusEmails(): CampusEmail[] {
  return [
    buildOtpEmail({ username: "ravi.kumar", otp: "482910" }),
    buildLoginAlertEmail({
      username: "ravi.kumar",
      timestamp: "21 Nov 2026, 10:15 am",
      ipAddress: "10.2.0.14",
    }),
    buildOutpassRequestEmail({
      username: "O210001",
      reason: "Family function",
      fromDate: "2026-11-22",
      toDate: "2026-11-24",
    }),
    buildOutingRequestEmail({
      username: "O210001",
      reason: "Local errand",
      fromDate: "2026-11-22",
      toDate: "2026-11-22",
    }),
    buildOutpassApprovalEmail({
      username: "O210001",
      status: "approved",
      approver: "SWO",
      comment: "Return before 6 pm.",
    }),
    buildOutingApprovalEmail({
      username: "O210001",
      status: "rejected",
      approver: "Warden",
    }),
    buildCheckpointEmail({
      username: "O210001",
      action: "Checked Out",
      time: "21 Nov 2026, 4:10 pm",
    }),
    buildResultsEmail({ name: "Ravi Kumar", semesterId: "S5" }),
    buildAttendanceEmail({ name: "Ravi Kumar", semesterId: "S5" }),
    buildAdminAlertEmail({
      studentName: "Ravi Kumar",
      studentId: "O210001",
      reason: "Family function",
      type: "outpass",
    }),
    buildGrievanceSubmissionEmail({
      category: "Hostel",
      ticketId: "G-1042",
    }),
    buildGrievanceResolvedEmail({
      studentName: "Ravi Kumar",
      category: "Hostel",
      categoryLabel: "Hostel",
      actionable: true,
    }),
    buildGrievanceResolvedEmail({
      studentName: "Ravi Kumar",
      category: "Hostel",
      categoryLabel: "Hostel",
      actionable: false,
    }),
    buildAdminActionEmail({
      action: "approved",
      studentName: "Ravi Kumar",
      studentId: "O210001",
      type: "outpass",
    }),
    buildPasswordChangeEmail({
      username: "ravi.kumar",
      timestamp: "21 Nov 2026, 10:20 am",
    }),
    buildProfileUpdateEmail({
      username: "ravi.kumar",
      timestamp: "21 Nov 2026, 10:20 am",
      updatedFields: ["Phone", "Address"],
    }),
    buildPlainNoticeEmail({
      subject: "Library hours this week",
      bodyHtml:
        '<p style="margin:0;">The library closes at 8 pm on Friday.</p>',
      text: "The library closes at 8 pm on Friday.",
    }),
  ];
}
