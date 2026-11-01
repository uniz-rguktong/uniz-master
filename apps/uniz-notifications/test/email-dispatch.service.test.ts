import { beforeEach, describe, expect, it, vi } from "vitest";

const email = vi.hoisted(() => ({
  sendOtpEmail: vi.fn(async () => true),
  sendResultEmail: vi.fn(async () => true),
  sendLoginNotification: vi.fn(async () => true),
  sendOutpassRequestNotification: vi.fn(async () => true),
  sendOutingRequestNotification: vi.fn(async () => true),
  sendOutpassApprovalNotification: vi.fn(async () => true),
  sendOutingApprovalNotification: vi.fn(async () => true),
  sendNewRequestAlertToAdmin: vi.fn(async () => true),
  sendActionConfirmationToAdmin: vi.fn(async () => true),
  sendCheckpointNotification: vi.fn(async () => true),
  sendPasswordChangeNotification: vi.fn(async () => true),
  sendProfileUpdateNotification: vi.fn(async () => true),
  sendAttendanceReportEmail: vi.fn(async () => true),
  sendGrievanceSubmissionNotification: vi.fn(async () => true),
  sendGrievanceResolvedNotification: vi.fn(async () => true),
}));

vi.mock("../src/mail/services/email.service", () => email);

import { dispatchEmailByType } from "../src/mail/services/email-dispatch.service";

describe("dispatchEmailByType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes every known type to the matching sender", async () => {
    const data = {
      username: "ada",
      otp: "123456",
      name: "Ada",
      branch: "CSE",
      campus: "Ongole",
      semesterId: "E1_S1",
      grades: [{ grade: 9 }],
      records: [{ attendedClasses: 1 }],
      ip: "1.1.1.1",
      reason: "home",
      fromDate: "2026-01-01",
      toDate: "2026-01-02",
      status: "approved",
      approver: "dean",
      comment: "ok",
      studentName: "Ada Lovelace",
      studentId: "O1",
      type: "outing",
      action: "approved",
      time: "10:00",
      updatedFields: ["phone"],
      category: "hostel",
      ticketId: "T1",
      description: "The cooler is broken for days.",
    };

    await expect(dispatchEmailByType("otp", "a@b.c", data)).resolves.toBe(true);
    expect(email.sendOtpEmail).toHaveBeenCalledWith("a@b.c", "ada", "123456");

    await dispatchEmailByType("results", "a@b.c", data);
    expect(email.sendResultEmail).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "Ada",
      "CSE",
      "Ongole",
      "E1_S1",
      data.grades,
    );

    await dispatchEmailByType("attendance_report", "a@b.c", data);
    expect(email.sendAttendanceReportEmail).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "Ada",
      "CSE",
      "Ongole",
      "E1_S1",
      data.records,
    );

    await dispatchEmailByType("attendance_report", "a@b.c", {
      username: "ada",
      name: "Ada",
      branch: "CSE",
      semesterId: "E1_S1",
      records: [],
    });
    expect(email.sendAttendanceReportEmail).toHaveBeenLastCalledWith(
      "a@b.c",
      "ada",
      "Ada",
      "CSE",
      "RGUKT Ongole",
      "E1_S1",
      [],
    );

    await dispatchEmailByType("login_alert", "a@b.c", data);
    expect(email.sendLoginNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "1.1.1.1",
    );

    await dispatchEmailByType("outpass_request", "a@b.c", data);
    expect(email.sendOutpassRequestNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "home",
      "2026-01-01",
      "2026-01-02",
    );

    await dispatchEmailByType("outing_request", "a@b.c", data);
    expect(email.sendOutingRequestNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "home",
      "2026-01-01",
      "2026-01-02",
    );

    await dispatchEmailByType("outpass_approval", "a@b.c", data);
    expect(email.sendOutpassApprovalNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "approved",
      "dean",
      "ok",
    );

    await dispatchEmailByType("outing_approval", "a@b.c", data);
    expect(email.sendOutingApprovalNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "approved",
      "dean",
      "ok",
    );

    await dispatchEmailByType("admin_alert", "admin@b.c", data);
    expect(email.sendNewRequestAlertToAdmin).toHaveBeenCalledWith(
      "admin@b.c",
      "Ada Lovelace",
      "O1",
      "home",
      "outing",
    );

    await dispatchEmailByType("admin_action_confirmation", "admin@b.c", data);
    expect(email.sendActionConfirmationToAdmin).toHaveBeenCalledWith(
      "admin@b.c",
      "approved",
      "Ada Lovelace",
      "O1",
      "outing",
    );

    await dispatchEmailByType("checkpoint", "a@b.c", data);
    expect(email.sendCheckpointNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      "outing",
      "10:00",
    );

    await dispatchEmailByType("password_change", "a@b.c", data);
    expect(email.sendPasswordChangeNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
    );

    await dispatchEmailByType("profile_update", "a@b.c", data);
    expect(email.sendProfileUpdateNotification).toHaveBeenCalledWith(
      "a@b.c",
      "ada",
      ["phone"],
    );

    await dispatchEmailByType("grievance_submission", "a@b.c", data);
    expect(email.sendGrievanceSubmissionNotification).toHaveBeenCalledWith(
      "a@b.c",
      "hostel",
      "T1",
    );

    await dispatchEmailByType("grievance_resolved", "a@b.c", data);
    expect(email.sendGrievanceResolvedNotification).toHaveBeenCalledWith(
      "a@b.c",
      "Ada Lovelace",
      "hostel",
      "The cooler is broken for days.",
    );

    await dispatchEmailByType("grievance_resolved", "a@b.c", {
      studentName: "Ada",
      category: "mess",
    });
    expect(email.sendGrievanceResolvedNotification).toHaveBeenLastCalledWith(
      "a@b.c",
      "Ada",
      "mess",
      "",
    );
  });

  it("throws for an unknown type", async () => {
    await expect(dispatchEmailByType("fax", "a@b.c")).rejects.toThrow(
      "Invalid email type: fax",
    );
  });
});
