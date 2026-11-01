import { beforeEach, describe, expect, it, vi } from "vitest";
import { INTERNAL_SECRET } from "./auth-token";
import { mount } from "./http";

const enqueueNotificationJob = vi.hoisted(() => vi.fn());

vi.mock("../src/utils/queue.util", () => ({ enqueueNotificationJob }));

import router from "../src/mail/routes/email.routes";

const api = mount(router);
const secret = { "x-internal-secret": INTERNAL_SECRET };

describe("email routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueueNotificationJob.mockResolvedValue({ id: "job-9" });
  });

  it("requires the internal secret and a type plus recipient", async () => {
    expect((await api.post("/send", { type: "otp", to: "a@b.c" })).status).toBe(
      403,
    );
    expect(
      (await api.post("/send", { type: "otp", to: "a@b.c" }, { "x-internal-secret": "nope" }))
        .status,
    ).toBe(403);

    const missing = await api.post("/send", { type: "otp" }, secret);
    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe("type and to are required");
    expect(enqueueNotificationJob).not.toHaveBeenCalled();
  });

  it("queues otp mail with flattened fields and other mail as EMAIL", async () => {
    const otp = await api.post(
      "/send",
      { type: "otp", to: "a@b.c", data: { username: "ada", otp: "123456" } },
      secret,
    );
    expect(otp.status).toBe(202);
    expect(otp.body).toEqual({
      success: true,
      queued: true,
      jobId: "job-9",
      message: "Email queued for delivery",
    });
    expect(enqueueNotificationJob).toHaveBeenCalledWith("OTP_EMAIL", {
      type: "otp",
      to: "a@b.c",
      data: { username: "ada", otp: "123456" },
      username: "ada",
      otp: "123456",
      email: "a@b.c",
    });

    const other = await api.post("/send", { type: "login_alert", to: "a@b.c" }, secret);
    expect(other.status).toBe(202);
    expect(enqueueNotificationJob).toHaveBeenLastCalledWith("EMAIL", {
      type: "login_alert",
      to: "a@b.c",
      data: {},
    });
  });

  it("returns 500 when the queue rejects the job", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    enqueueNotificationJob.mockRejectedValueOnce(new Error("redis down"));
    const res = await api.post("/send", { type: "otp", to: "a@b.c" }, secret);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    error.mockRestore();
  });
});
