import { beforeEach, describe, expect, it, vi } from "vitest";

const { redisMock, enqueue, axiosMock } = vi.hoisted(() => ({
  redisMock: {
    get: vi.fn(),
    setex: vi.fn(),
  },
  enqueue: vi.fn(),
  axiosMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../src/utils/redis.util", () => ({ redis: redisMock }));
vi.mock("../src/utils/queue.util", () => ({
  enqueueNotificationJob: enqueue,
}));
vi.mock("axios", () => ({
  default: axiosMock,
}));

async function loadEmail() {
  vi.resetModules();
  return import("../src/utils/email.util");
}

describe("email delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SKIP_PUSH;
    delete process.env.USER_SERVICE_URL;
    delete process.env.MAIL_SERVICE_URL;
    delete process.env.NOTIFICATION_SERVICE_URL;
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockResolvedValue("OK");
    enqueue.mockResolvedValue({ id: "job-1" });
    axiosMock.get.mockRejectedValue(new Error("down"));
    axiosMock.post.mockResolvedValue({ data: { success: true, sent: 2 } });
  });

  it("returns a cached profile email without calling the user service", async () => {
    redisMock.get.mockResolvedValue("cached@rguktong.ac.in");
    const { resolveProfileEmail } = await loadEmail();
    await expect(resolveProfileEmail("o210008")).resolves.toBe(
      "cached@rguktong.ac.in",
    );
    expect(axiosMock.get).not.toHaveBeenCalled();
  });

  it("walks student, faculty, then admin and caches the address", async () => {
    process.env.USER_SERVICE_URL = "http://users.test/health";
    axiosMock.get
      .mockRejectedValueOnce(new Error("no student"))
      .mockResolvedValueOnce({
        data: { faculty: { email: "hod@rguktong.ac.in" } },
      });
    const { resolveProfileEmail } = await loadEmail();
    await expect(resolveProfileEmail("hod_cse")).resolves.toBe(
      "hod@rguktong.ac.in",
    );
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      1,
      "http://users.test/admin/student/hod_cse",
      expect.objectContaining({
        headers: { "x-internal-secret": "unit-test-internal" },
      }),
    );
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      2,
      "http://users.test/admin/faculty/hod_cse",
      expect.any(Object),
    );
    expect(redisMock.setex).toHaveBeenCalledWith(
      "otp:email:HOD_CSE",
      3600,
      "hod@rguktong.ac.in",
    );
  });

  it("reads a bare email field and the docker gateway default", async () => {
    process.env.DOCKER_ENV = "true";
    axiosMock.get
      .mockResolvedValueOnce({ data: { student: {} } })
      .mockResolvedValueOnce({ data: { email: "plain@rguktong.ac.in" } });
    const { resolveProfileEmail, sendOtpPush } = await loadEmail();
    await expect(resolveProfileEmail("o210008")).resolves.toBe(
      "plain@rguktong.ac.in",
    );
    delete process.env.DOCKER_ENV;

    process.env.DOCKER_ENV = "true";
    delete process.env.NOTIFICATION_SERVICE_URL;
    enqueue.mockRejectedValueOnce(new Error("queue down"));
    const { sendOtpPush: push } = await loadEmail();
    await push("o210008", "123456");
    expect(axiosMock.post).toHaveBeenCalledWith(
      "http://uniz-gateway-api:3000/api/v1/notifications/internal/push",
      expect.any(Object),
      expect.any(Object),
    );
    delete process.env.DOCKER_ENV;
  });

  it("falls back to the campus address when lookup and redis both fail", async () => {
    redisMock.get.mockRejectedValue(new Error("redis down"));
    redisMock.setex.mockRejectedValue(new Error("redis down"));
    const { resolveProfileEmail } = await loadEmail();
    await expect(resolveProfileEmail("O210008")).resolves.toBe(
      "o210008@rguktong.ac.in",
    );
  });

  it("queues an otp email and falls back to the mail service", async () => {
    process.env.MAIL_SERVICE_URL = "http://mail.test/health";
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendOtpEmail } = await loadEmail();
    await expect(
      sendOtpEmail("a@rguktong.ac.in", "o210008", "123456"),
    ).resolves.toBe(true);
    expect(enqueue).toHaveBeenCalledWith(
      "OTP_EMAIL",
      expect.objectContaining({ to: "a@rguktong.ac.in", otp: "123456" }),
    );

    enqueue.mockRejectedValueOnce(new Error("queue down"));
    await expect(
      sendOtpEmail("a@rguktong.ac.in", "o210008", "123456"),
    ).resolves.toBe(true);
    expect(axiosMock.post).toHaveBeenCalledWith(
      "http://mail.test/send",
      expect.objectContaining({ type: "otp", to: "a@rguktong.ac.in" }),
      expect.objectContaining({
        headers: { "x-internal-secret": "unit-test-internal" },
      }),
    );
    error.mockRestore();
  });

  it("returns false when the otp email cannot be queued or posted", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    enqueue.mockRejectedValue(new Error("queue down"));
    axiosMock.post.mockRejectedValue(new Error("mail down"));
    const { sendOtpEmail } = await loadEmail();
    await expect(
      sendOtpEmail("a@rguktong.ac.in", "o210008", "123456"),
    ).resolves.toBe(false);
    error.mockRestore();
  });

  it("queues push-first otp delivery", async () => {
    const { queueOtpDelivery } = await loadEmail();
    await expect(queueOtpDelivery("O210008", "123456")).resolves.toBe(true);
    expect(enqueue).toHaveBeenCalledWith(
      "OTP_DELIVER",
      expect.objectContaining({
        username: "O210008",
        email: "o210008@rguktong.ac.in",
      }),
    );

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    enqueue.mockRejectedValueOnce(new Error("queue down"));
    await expect(
      queueOtpDelivery("O210008", "123456", "custom@rguktong.ac.in"),
    ).resolves.toBe(false);
    error.mockRestore();
  });

  it("skips push when SKIP_PUSH is set", async () => {
    process.env.SKIP_PUSH = "true";
    const { sendOtpPush } = await loadEmail();
    await expect(sendOtpPush("o210008", "123456")).resolves.toBe(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("sends a push through the queue, then http if the queue is down", async () => {
    process.env.NOTIFICATION_SERVICE_URL = "http://notify.test/health";
    const { sendOtpPush } = await loadEmail();
    await expect(sendOtpPush("o210008", "123456")).resolves.toBe(1);

    enqueue.mockRejectedValueOnce(new Error("queue down"));
    await expect(sendOtpPush("o210008", "123456")).resolves.toBe(2);
    expect(axiosMock.post).toHaveBeenCalledWith(
      "http://notify.test/internal/push",
      expect.objectContaining({ username: "o210008", type: "OTP" }),
      expect.any(Object),
    );

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    enqueue.mockRejectedValueOnce(new Error("queue down"));
    axiosMock.post.mockRejectedValueOnce(new Error("push down"));
    await expect(sendOtpPush("o210008", "123456")).resolves.toBe(0);
    error.mockRestore();
  });

  it("mentions the device in a login alert only when it is known", async () => {
    const {
      sendLoginNotification,
      sendPasswordChangeNotification,
      sendProfileUpdateNotification,
    } = await loadEmail();
    await expect(
      sendLoginNotification(
        "a@rguktong.ac.in",
        "o210008",
        "127.0.0.1",
        "Chrome on Linux",
      ),
    ).resolves.toBe(true);
    expect(enqueue.mock.calls.at(-1)?.[1].body).toContain(
      "using Chrome on Linux",
    );

    await sendLoginNotification(
      "a@rguktong.ac.in",
      "o210008",
      "127.0.0.1",
      "Unknown Browser on Unknown OS",
    );
    expect(enqueue.mock.calls.at(-1)?.[1].body).not.toContain("using ");

    await expect(
      sendPasswordChangeNotification("a@rguktong.ac.in", "o210008"),
    ).resolves.toBe(true);
    await expect(
      sendProfileUpdateNotification("a@rguktong.ac.in", "o210008", [
        "phone",
        "email",
      ]),
    ).resolves.toBe(true);
    expect(enqueue.mock.calls.at(-1)?.[1].body).toContain("phone, email");
  });
});
