import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  processor: null as null | ((job: { name: string; data: any; id?: string }) => Promise<unknown>),
  opts: null as null | { concurrency: number },
  handlers: {} as Record<string, Function>,
  queueConnection: null as unknown,
}));

const sendWebPush = vi.hoisted(() => vi.fn());
const dispatchEmailByType = vi.hoisted(() => vi.fn());

vi.mock("bullmq", () => ({
  Queue: class {
    constructor(
      public name: string,
      public opts: { connection: unknown },
    ) {
      state.queueConnection = opts.connection;
    }
  },
  Worker: class {
    opts: { concurrency: number };
    constructor(
      public name: string,
      processor: (job: { name: string; data: any }) => Promise<unknown>,
      opts: { concurrency: number },
    ) {
      this.opts = opts;
      state.processor = processor;
      state.opts = opts;
    }
    on(event: string, cb: Function) {
      state.handlers[event] = cb;
      return this;
    }
  },
}));

vi.mock("../src/services/push.service", () => ({ sendWebPush }));
vi.mock("../src/mail/services/email-dispatch.service", () => ({
  dispatchEmailByType,
}));

import { createNotificationWorker } from "../src/worker/notification.worker";

function job(name: string, data: Record<string, unknown>) {
  return { id: "job-1", name, data };
}

describe("notification worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.handlers = {};
    delete process.env.NOTIFICATION_WORKER_CONCURRENCY;
    sendWebPush.mockResolvedValue(1);
    dispatchEmailByType.mockResolvedValue(true);
    createNotificationWorker({ redis: true } as never);
  });

  it("listens on the notification queue with the configured concurrency", () => {
    process.env.NOTIFICATION_WORKER_CONCURRENCY = "3";
    createNotificationWorker({ redis: true } as never);
    expect(state.opts?.concurrency).toBe(3);
    expect(state.queueConnection).toEqual({ redis: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    state.handlers.failed({ id: "9", name: "PUSH" }, new Error("nope"));
    state.handlers.ready();
    expect(String(error.mock.calls[0][0])).toContain("Job 9 (PUSH)");
    expect(String(log.mock.calls[0][0])).toContain("concurrency=3");
    state.handlers.failed(undefined, new Error("missing job"));
    error.mockRestore();
    log.mockRestore();
  });

  it("sends email jobs and rejects incomplete or failed delivery", async () => {
    await expect(
      state.processor!(job("OTP_EMAIL", { to: "a@b.c", username: "ada", otp: "1" })),
    ).resolves.toEqual({ sent: true, type: "otp", to: "a@b.c" });
    expect(dispatchEmailByType).toHaveBeenCalledWith("otp", "a@b.c", {
      to: "a@b.c",
      username: "ada",
      otp: "1",
    });

    await expect(
      state.processor!(
        job("EMAIL", {
          type: "login_alert",
          email: "a@b.c",
          data: { username: "from-nested", ip: "1.1.1.1" },
          username: "outer",
        }),
      ),
    ).resolves.toEqual({ sent: true, type: "login_alert", to: "a@b.c" });
    expect(dispatchEmailByType).toHaveBeenLastCalledWith("login_alert", "a@b.c", {
      type: "login_alert",
      email: "a@b.c",
      data: { username: "from-nested", ip: "1.1.1.1" },
      username: "from-nested",
      ip: "1.1.1.1",
    });

    await expect(state.processor!(job("EMAIL", { to: "a@b.c" }))).rejects.toThrow(
      "EMAIL job requires type and to",
    );
    dispatchEmailByType.mockResolvedValueOnce(false);
    await expect(
      state.processor!(job("EMAIL", { type: "otp", to: "a@b.c" })),
    ).rejects.toThrow("Email delivery failed");
  });

  it("prefers push for OTP delivery and falls back to email", async () => {
    sendWebPush.mockResolvedValueOnce(2);
    await expect(
      state.processor!(job("OTP_DELIVER", { username: "Ada", otp: "123456" })),
    ).resolves.toEqual({ deliveryMethod: "push", sent: 2 });
    expect(dispatchEmailByType).not.toHaveBeenCalled();
    expect(sendWebPush).toHaveBeenCalledWith(
      "Ada",
      expect.objectContaining({ rawBody: true, data: { type: "OTP" } }),
    );

    sendWebPush.mockResolvedValueOnce(0);
    await expect(
      state.processor!(
        job("OTP_DELIVER", { username: "Ada", otp: "123456", email: "" }),
      ),
    ).resolves.toEqual({ deliveryMethod: "email", sent: 0 });
    expect(dispatchEmailByType).toHaveBeenCalledWith("otp", "ada@rguktong.ac.in", {
      username: "Ada",
      otp: "123456",
    });

    await expect(state.processor!(job("OTP_DELIVER", { username: "Ada" }))).rejects.toThrow(
      "OTP_DELIVER requires username and otp",
    );
    sendWebPush.mockResolvedValueOnce(0);
    dispatchEmailByType.mockResolvedValueOnce(false);
    await expect(
      state.processor!(
        job("OTP_DELIVER", {
          username: "Ada",
          otp: "123456",
          email: "ada@example.com",
        }),
      ),
    ).rejects.toThrow("OTP email fallback failed for Ada");
  });

  it("sends direct push jobs", async () => {
    await expect(
      state.processor!(
        job("PUSH", {
          username: "ada",
          title: "Hello",
          body: "There",
          rawBody: false,
          image: "pic",
          name: "Ada",
          data: { type: "SYSTEM" },
        }),
      ),
    ).resolves.toEqual({ sent: 1 });
    expect(sendWebPush).toHaveBeenCalledWith("ada", {
      title: "Hello",
      body: "There",
      rawBody: false,
      image: "pic",
      name: "Ada",
      data: { type: "SYSTEM" },
    });

    await expect(state.processor!(job("OTP_PUSH", { username: "ada" }))).resolves.toEqual({
      sent: 1,
    });
    expect(sendWebPush).toHaveBeenLastCalledWith("ada", {
      title: "UniZ Notification",
      body: "",
      rawBody: true,
      image: undefined,
      name: undefined,
      data: { type: "SYSTEM" },
    });

    await expect(state.processor!(job("PUSH", {}))).rejects.toThrow(
      "PUSH job requires username",
    );
  });

  it("personalizes a broadcast and ignores individual push failures", async () => {
    const users = Array.from({ length: 21 }, (_, i) =>
      i === 0
        ? { username: "o210001" }
        : { username: `o21000${i}`, name: `Student ${i}` },
    );
    sendWebPush.mockImplementation(async () => 1);
    sendWebPush.mockRejectedValueOnce(new Error("one failed"));

    const result = await state.processor!(
      job("PUSH_BROADCAST", {
        users,
        title: "Hi {{name}}",
        body: "Dear note for {{username}}",
        image: "banner",
      }),
    );
    expect(result).toEqual({ sent: 20, total: 21 });
    expect(sendWebPush).toHaveBeenCalledTimes(21);
    expect(sendWebPush.mock.calls[0][1]).toMatchObject({
      title: "Hi o210001",
      body: "Dear o210001,\n\nDear note for o210001",
      rawBody: true,
      data: { type: "BROADCAST" },
    });
    expect(sendWebPush.mock.calls[1][1]).toMatchObject({
      title: "Hi Student 1",
      body: "Dear Student 1,\n\nDear note for o210001",
    });

    await expect(
      state.processor!(job("PUSH_BROADCAST", { users: [], title: "T", body: "B" })),
    ).rejects.toThrow("PUSH_BROADCAST requires title, body, and users");
    await expect(
      state.processor!(job("PUSH_BROADCAST", { title: "T" })),
    ).rejects.toThrow("PUSH_BROADCAST requires title, body, and users");
  });

  it("turns result, attendance, and legacy jobs into push messages", async () => {
    await state.processor!(
      job("RESULTS", { username: "ada", semesterId: "E1", name: "Ada" }),
    );
    expect(sendWebPush).toHaveBeenCalledWith(
      "ada",
      expect.objectContaining({
        title: "Examination Results Published",
        name: "Ada",
        data: { type: "RESULTS", semesterId: "E1" },
      }),
    );

    await state.processor!(
      job("ATTENDANCE_REPORT", { username: "ada", semesterId: "E2", name: "Ada" }),
    );
    expect(sendWebPush).toHaveBeenLastCalledWith(
      "ada",
      expect.objectContaining({
        title: "Attendance Report Generated",
        data: { type: "ATTENDANCE", semesterId: "E2" },
      }),
    );

    await state.processor!(
      job("LEGACY_EMAIL_PUSH", { username: "ada", subject: "Update", body: "Read this" }),
    );
    expect(sendWebPush).toHaveBeenLastCalledWith("ada", {
      title: "Update",
      body: "Read this",
      name: undefined,
      data: { type: "GENERIC" },
    });

    await state.processor!(job("LEGACY_EMAIL_PUSH", { username: "ada" }));
    expect(sendWebPush).toHaveBeenLastCalledWith(
      "ada",
      expect.objectContaining({
        title: "UniZ Academic Notification",
        body: expect.stringContaining("academic update"),
      }),
    );
  });

  it("warns on an unknown job and rejects one without a username", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      state.processor!(job("MYSTERY", { username: "ada" })),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "[NotificationWorker] Unknown job type: MYSTERY",
    );
    await expect(state.processor!(job("MYSTERY", {}))).rejects.toThrow(
      "Missing username in job data",
    );
    warn.mockRestore();
  });
});
