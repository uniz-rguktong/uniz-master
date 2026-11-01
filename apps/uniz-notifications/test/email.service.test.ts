import { beforeEach, describe, expect, it, vi } from "vitest";

const gmailSend = vi.hoisted(() => vi.fn());
const sesSend = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() => vi.fn());
const SESv2Client = vi.hoisted(() => vi.fn());
const generateResultPdf = vi.hoisted(() => vi.fn());
const generateAttendancePdf = vi.hoisted(() => vi.fn());

vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client,
  SendEmailCommand: class SendEmailCommand {},
}));

vi.mock("../src/mail/utils/pdf.util", () => ({
  generateResultPdf,
  generateAttendancePdf,
}));

function baseEnv() {
  process.env.EMAIL_USER = "unit-test@example.com";
  process.env.EMAIL_PASS = "unit-test-pass";
  process.env.FORCE_GMAIL = "true";
  delete process.env.DOCKER_ENV;
  delete process.env.ENABLE_RESULT_EMAILS;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.PROD_AWS_ACCESS_KEY_NEWONE_AFTER_LEAK;
  delete process.env.PROD_AWS_ACCESS_KEY_SECRET_NEWONE_AFTER_LEAK;
  delete process.env.AWS_REGION;
}

async function loadEmail() {
  vi.resetModules();
  return import("../src/mail/services/email.service");
}

describe("email.service", () => {
  beforeEach(() => {
    baseEnv();
    gmailSend.mockReset();
    sesSend.mockReset();
    gmailSend.mockResolvedValue({ messageId: "gmail-1" });
    sesSend.mockResolvedValue({ messageId: "ses-1" });
    createTransport.mockReset();
    createTransport.mockImplementation((opts: { SES?: unknown }) =>
      opts?.SES ? { sendMail: sesSend } : { sendMail: gmailSend },
    );
    SESv2Client.mockReset();
    generateResultPdf.mockReset();
    generateAttendancePdf.mockReset();
    generateResultPdf.mockResolvedValue(Buffer.from("result"));
    generateAttendancePdf.mockResolvedValue(Buffer.from("attendance"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("sends an OTP through the gmail transporter", async () => {
    const { sendOtpEmail } = await loadEmail();
    await expect(sendOtpEmail("ada@example.com", "O1", "654321")).resolves.toBe(
      true,
    );
    expect(gmailSend).toHaveBeenCalledTimes(1);
    const message = gmailSend.mock.calls[0][0];
    expect(message.to).toBe("ada@example.com");
    expect(message.subject).toBe("Your UniZ Access Code: 654321");
    expect(message.html).toContain("654321");
    expect(message.html).toContain("Verification Required");
    expect(message.html).toContain("O1");
    expect(message.headers["X-Mailer"]).toBe("UniZ-Mail-Engine");
    expect(sesSend).not.toHaveBeenCalled();
  });

  it("classifies throttling, bounces, and other delivery failures", async () => {
    const { sendOtpEmail } = await loadEmail();
    gmailSend.mockRejectedValueOnce(
      Object.assign(new Error("Throttling: slow down"), { code: "Throttling" }),
    );
    await expect(sendOtpEmail("a@b.c", "O1", "111111")).resolves.toBe(false);

    gmailSend.mockRejectedValueOnce(
      Object.assign(new Error("nope"), { name: "MessageRejected" }),
    );
    await expect(sendOtpEmail("a@b.c", "O1", "222222")).resolves.toBe(false);

    gmailSend.mockRejectedValueOnce(new Error("smtp down"));
    await expect(sendOtpEmail("a@b.c", "O1", "333333")).resolves.toBe(false);
    expect(sesSend).not.toHaveBeenCalled();
  });

  it("suppresses the non-OTP notices without calling the transporter", async () => {
    const mail = await loadEmail();
    await expect(
      mail.sendLoginNotification("a@b.c", "ada", "1.1.1.1"),
    ).resolves.toBe(true);
    await expect(
      mail.sendLoginNotification("a@b.c", "ada"),
    ).resolves.toBe(true);
    await expect(
      mail.sendOutpassRequestNotification(
        "a@b.c",
        "ada",
        "home",
        "2026-04-01",
        "2026-04-02",
      ),
    ).resolves.toBe(true);
    await expect(
      mail.sendOutingRequestNotification(
        "a@b.c",
        "ada",
        "market",
        "2026-04-01",
        "2026-04-01",
      ),
    ).resolves.toBe(true);
    await expect(
      mail.sendOutpassApprovalNotification(
        "a@b.c",
        "ada",
        "approved",
        "dean",
        "ok",
      ),
    ).resolves.toBe(true);
    await expect(
      mail.sendOutpassApprovalNotification("a@b.c", "ada", "rejected", "dean"),
    ).resolves.toBe(true);
    await expect(
      mail.sendOutingApprovalNotification(
        "a@b.c",
        "ada",
        "forwarded",
        "hod",
        "see me",
      ),
    ).resolves.toBe(true);
    await expect(
      mail.sendCheckpointNotification("a@b.c", "ada", "check_in", "10:00"),
    ).resolves.toBe(true);
    await expect(
      mail.sendCheckpointNotification("a@b.c", "ada", "check_out", "18:00"),
    ).resolves.toBe(true);
    await expect(
      mail.sendNewRequestAlertToAdmin("admin@b.c", "Ada", "O1", "home"),
    ).resolves.toBe(true);
    await expect(
      mail.sendNewRequestAlertToAdmin("admin@b.c", "Ada", "O1", "home", "outing"),
    ).resolves.toBe(true);
    await expect(
      mail.sendActionConfirmationToAdmin("admin@b.c", "approved", "Ada", "O1"),
    ).resolves.toBe(true);
    await expect(
      mail.sendActionConfirmationToAdmin(
        "admin@b.c",
        "rejected",
        "Ada",
        "O1",
        "outing",
      ),
    ).resolves.toBe(true);
    await expect(
      mail.sendPasswordChangeNotification("a@b.c", "ada"),
    ).resolves.toBe(true);
    await expect(
      mail.sendProfileUpdateNotification("a@b.c", "ada", ["phone", "email"]),
    ).resolves.toBe(true);
    await expect(
      mail.sendGrievanceSubmissionNotification("a@b.c", "hostel", "T1"),
    ).resolves.toBe(true);
    expect(gmailSend).not.toHaveBeenCalled();
  });

  it("returns false when a suppressed template cannot be built", async () => {
    const mail = await loadEmail();
    await expect(
      mail.sendProfileUpdateNotification("a@b.c", "ada", undefined as never),
    ).resolves.toBe(false);
    await expect(
      mail.sendOutpassApprovalNotification(
        "a@b.c",
        "ada",
        undefined as never,
        "dean",
      ),
    ).resolves.toBe(false);
    await expect(
      mail.sendOutingApprovalNotification(
        "a@b.c",
        "ada",
        undefined as never,
        "hod",
      ),
    ).resolves.toBe(false);
  });

  it("skips result and attendance PDFs while those emails are disabled", async () => {
    const mail = await loadEmail();
    await expect(
      mail.sendResultEmail("a@b.c", "o1", "Ada", "CSE", "Ongole", "E1", []),
    ).resolves.toBe(true);
    await expect(
      mail.sendAttendanceReportEmail(
        "a@b.c",
        "o1",
        "Ada",
        "CSE",
        "Ongole",
        "E1",
        [],
      ),
    ).resolves.toBe(true);
    expect(generateResultPdf).not.toHaveBeenCalled();
    expect(generateAttendancePdf).not.toHaveBeenCalled();
    expect(gmailSend).not.toHaveBeenCalled();
  });

  it("builds result and attendance PDFs when the flag is on, then still suppresses delivery", async () => {
    process.env.ENABLE_RESULT_EMAILS = "true";
    const mail = await loadEmail();
    await expect(
      mail.sendResultEmail("a@b.c", "o1", "", "", "", "E1", [{ grade: 10 }]),
    ).resolves.toBe(true);
    expect(generateResultPdf).toHaveBeenCalledWith({
      username: "o1",
      name: "o1",
      branch: "N/A",
      campus: "RGUKT",
      semesterId: "E1",
      grades: [{ grade: 10 }],
    });

    await expect(
      mail.sendAttendanceReportEmail("a@b.c", "o1", "Ada", "CSE", "", "E1", []),
    ).resolves.toBe(true);
    expect(generateAttendancePdf).toHaveBeenCalledWith({
      username: "o1",
      name: "Ada",
      branch: "CSE",
      campus: "RGUKT",
      semesterId: "E1",
      records: [],
    });
    expect(gmailSend).not.toHaveBeenCalled();
  });

  it("returns false when PDF generation throws", async () => {
    process.env.ENABLE_RESULT_EMAILS = "true";
    generateResultPdf.mockRejectedValueOnce(new Error("pdf failed"));
    generateAttendancePdf.mockRejectedValueOnce(new Error("pdf failed"));
    const mail = await loadEmail();
    await expect(
      mail.sendResultEmail("a@b.c", "o1", "Ada", "CSE", "Ongole", "E1", []),
    ).resolves.toBe(false);
    await expect(
      mail.sendAttendanceReportEmail(
        "a@b.c",
        "o1",
        "Ada",
        "CSE",
        "Ongole",
        "E1",
        [],
      ),
    ).resolves.toBe(false);
  });

  it("sends a resolved or closed grievance with the shared copy", async () => {
    const { sendGrievanceResolvedNotification } = await loadEmail();
    const actionable =
      "The hostel water cooler on the second floor has been broken all week.";
    await expect(
      sendGrievanceResolvedNotification(
        "ada@example.com",
        "ada lovelace",
        "hostel",
        actionable,
      ),
    ).resolves.toBe(true);
    const resolved = gmailSend.mock.calls[0][0];
    expect(resolved.subject).toBe("Grievance resolved: hostel");
    expect(resolved.from).toContain("UniZ SWO");
    expect(resolved.html).toContain("Grievance resolved");
    expect(resolved.html).toContain("Ada Lovelace");
    expect(resolved.html).toContain("hostel / mess");

    await expect(
      sendGrievanceResolvedNotification(
        "ada@example.com",
        "ada",
        "academic",
        "asdf",
      ),
    ).resolves.toBe(true);
    const closed = gmailSend.mock.calls[1][0];
    expect(closed.subject).toBe("Grievance update: academic");
    expect(closed.html).toContain("Grievance closed");
    expect(closed.html).toContain("academic matters");
  });

  it("returns false when the grievance sender fails", async () => {
    const { sendGrievanceResolvedNotification } = await loadEmail();
    gmailSend.mockRejectedValueOnce(new Error("down"));
    await expect(
      sendGrievanceResolvedNotification("a@b.c", "Ada", "mess", "short"),
    ).resolves.toBe(false);
  });

  it("uses SES in production and falls back when credentials are missing", async () => {
    delete process.env.FORCE_GMAIL;
    process.env.DOCKER_ENV = "true";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "unit-test-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "unit-test-secret";
    let mail = await loadEmail();
    expect(SESv2Client).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "unit-test-access-key",
        secretAccessKey: "unit-test-secret",
      },
    });
    await expect(mail.sendOtpEmail("a@b.c", "o1", "999999")).resolves.toBe(true);
    expect(sesSend).toHaveBeenCalledTimes(1);
    expect(gmailSend).not.toHaveBeenCalled();

    SESv2Client.mockReset();
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    mail = await loadEmail();
    expect(SESv2Client).not.toHaveBeenCalled();
    await expect(mail.sendOtpEmail("a@b.c", "o1", "888888")).resolves.toBe(true);
    expect(gmailSend).toHaveBeenCalledTimes(1);
  });

  it("prefers the rotated production key and skips SES when gmail is forced", async () => {
    delete process.env.FORCE_GMAIL;
    process.env.DOCKER_ENV = "true";
    process.env.PROD_AWS_ACCESS_KEY_NEWONE_AFTER_LEAK = "rotated-access-key";
    process.env.PROD_AWS_ACCESS_KEY_SECRET_NEWONE_AFTER_LEAK = "rotated-secret";
    process.env.AWS_ACCESS_KEY_ID = "old-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "old-secret";
    await loadEmail();
    expect(SESv2Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "ap-south-1",
        credentials: {
          accessKeyId: "rotated-access-key",
          secretAccessKey: "rotated-secret",
        },
      }),
    );

    process.env.FORCE_GMAIL = "true";
    SESv2Client.mockClear();
    await loadEmail();
    expect(SESv2Client).not.toHaveBeenCalled();
  });
});
