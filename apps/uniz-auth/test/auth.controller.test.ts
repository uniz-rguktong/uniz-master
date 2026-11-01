import { randomUUID } from "crypto";
import { createRequire } from "node:module";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../src/utils/password.util";
import { verifyToken } from "../src/utils/token.util";
import { ErrorCode } from "../src/shared/error-codes";

const { prismaMock, redisMock, turnstile, email, axiosMock } = vi.hoisted(
  () => {
    const axiosMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    };
    return {
      prismaMock: {
        authCredential: {
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
          delete: vi.fn(),
        },
        otpLog: {
          create: vi.fn(),
          findFirst: vi.fn(),
          update: vi.fn(),
          deleteMany: vi.fn(),
        },
      },
      redisMock: {
        get: vi.fn(),
        setex: vi.fn(),
        del: vi.fn(),
      },
      turnstile: { verifyTurnstileToken: vi.fn() },
      email: {
        sendOtpEmail: vi.fn(),
        sendOtpPush: vi.fn(),
        sendLoginNotification: vi.fn(),
        sendPasswordChangeNotification: vi.fn(),
        queueOtpDelivery: vi.fn(),
        resolveProfileEmail: vi.fn(),
      },
      axiosMock: Object.assign(axiosMock, { default: axiosMock }),
    };
  },
);

vi.mock("../src/utils/prisma", () => ({ prisma: prismaMock }));
vi.mock("../src/utils/redis.util", () => ({ redis: redisMock }));
vi.mock("../src/utils/turnstile.util", () => turnstile);
vi.mock("../src/utils/email.util", () => email);
vi.mock("axios", () => axiosMock);

import {
  adminLogin,
  adminResetPassword,
  changePassword,
  deleteUserByUsername,
  getUserStatus,
  globalAdminResetPassword,
  login,
  requestOtp,
  requestOtpEmail,
  resetPassword,
  signup,
  studentLogin,
  toggleSuspension,
  verifyOtp,
} from "../src/controllers/auth.controller";

// Fake values generated per run.
const CORRECT_TEST_PW = "test-" + randomUUID();
const WRONG_TEST_PW = "wrong-" + randomUUID();
const NEW_TEST_PW = "new-" + randomUUID();
const BAD_CURRENT_TEST_PW = "bad-" + randomUUID();

function response() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function request(
  body: Record<string, unknown> = {},
  extras: Record<string, unknown> = {},
) {
  return {
    body,
    headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0" },
    ip: "127.0.0.1",
    params: {},
    ...extras,
  };
}

let passwordHash = "";

describe("auth controller", () => {
  beforeAll(async () => {
    passwordHash = await hashPassword(CORRECT_TEST_PW);
    // signup() loads axios with require(), which does not see vi.mock.
    const nodeAxios = createRequire(import.meta.url)("axios");
    vi.spyOn(nodeAxios, "put").mockImplementation((...args: unknown[]) =>
      axiosMock.put(...args),
    );
    vi.spyOn(nodeAxios, "post").mockImplementation((...args: unknown[]) =>
      axiosMock.post(...args),
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    turnstile.verifyTurnstileToken.mockResolvedValue(true);
    email.sendLoginNotification.mockResolvedValue(true);
    email.sendPasswordChangeNotification.mockResolvedValue(true);
    email.sendOtpEmail.mockResolvedValue(true);
    email.sendOtpPush.mockResolvedValue(1);
    email.queueOtpDelivery.mockResolvedValue(true);
    email.resolveProfileEmail.mockResolvedValue("abcd@rguktong.ac.in");
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockResolvedValue("OK");
    redisMock.del.mockResolvedValue(1);
    axiosMock.get.mockRejectedValue(new Error("no profile"));
    axiosMock.post.mockResolvedValue({ data: {} });
    axiosMock.put.mockResolvedValue({ data: {} });
    delete process.env.USER_SERVICE_URL;
  });

  describe("login", () => {
    const activeUser = () => ({
      id: "user-1",
      username: "o210008",
      passwordHash,
      role: "student",
      isDisabled: false,
    });

    it("rejects a failed captcha before looking up the user", async () => {
      turnstile.verifyTurnstileToken.mockResolvedValue(false);
      const res = response();
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        res as never,
      );
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ code: "AUTH_CAPTCHA_FAILED" });
      expect(prismaMock.authCredential.findFirst).not.toHaveBeenCalled();
    });

    it("rejects an unknown user, a suspended user, and a bad password", async () => {
      const unknown = response();
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        unknown as never,
      );
      expect(unknown.statusCode).toBe(401);
      expect(unknown.body).toMatchObject({
        message: "Invalid username or password",
      });

      const studentRes = response();
      await studentLogin(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        studentRes as never,
      );
      expect(studentRes.body).toMatchObject({
        message: "Invalid university ID, email, or password",
      });

      const adminRes = response();
      await adminLogin(
        request({ username: "hod_cse", password: CORRECT_TEST_PW }) as never,
        adminRes as never,
      );
      expect(adminRes.body).toMatchObject({
        message: "Invalid staff ID, email, or password",
      });

      prismaMock.authCredential.findFirst.mockResolvedValue({
        ...activeUser(),
        isDisabled: true,
      });
      const suspended = response();
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        suspended as never,
      );
      expect(suspended.statusCode).toBe(403);
      expect(suspended.body).toMatchObject({ code: "AUTH_SUSPENDED" });

      prismaMock.authCredential.findFirst.mockResolvedValue(activeUser());
      const bad = response();
      await login(
        request({ username: "o210008", password: WRONG_TEST_PW }) as never,
        bad as never,
      );
      expect(bad.statusCode).toBe(401);
    });

    it("issues a student token and a staff token", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue(activeUser());
      const student = response();
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        student as never,
      );
      const studentBody = student.body as {
        success: boolean;
        token: string;
        student_token?: string;
        admin_token?: string;
      };
      expect(studentBody.success).toBe(true);
      expect(studentBody.student_token).toBe(studentBody.token);
      expect(studentBody.admin_token).toBeUndefined();
      expect(verifyToken(studentBody.token)?.username).toBe("O210008");
      expect(email.sendLoginNotification).toHaveBeenCalled();

      prismaMock.authCredential.findFirst.mockResolvedValue({
        ...activeUser(),
        username: "hod_cse",
        role: "faculty",
      });
      const staff = response();
      await login(
        request({ username: "hod_cse", password: CORRECT_TEST_PW }) as never,
        staff as never,
      );
      const staffBody = staff.body as { token: string; admin_token?: string };
      expect(staffBody.admin_token).toBe(staffBody.token);
      expect(verifyToken(staffBody.token)?.department).toBe("CSE");
    });

    it("uses a cached department and a profile department", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        ...activeUser(),
        username: "hod_cse",
        role: "faculty",
      });
      redisMock.get.mockResolvedValue("ECE");
      const cached = response();
      await login(
        request({ username: "hod_cse", password: CORRECT_TEST_PW }) as never,
        cached as never,
      );
      expect(
        verifyToken((cached.body as { token: string }).token)?.department,
      ).toBe("ECE");
      expect(axiosMock.get).not.toHaveBeenCalled();

      redisMock.get.mockRejectedValue(new Error("redis down"));
      axiosMock.get.mockResolvedValue({
        data: { faculty: { department: "EEE" } },
      });
      const lookedUp = response();
      await login(
        request({ username: "hod_cse", password: CORRECT_TEST_PW }) as never,
        lookedUp as never,
      );
      expect(
        verifyToken((lookedUp.body as { token: string }).token)?.department,
      ).toBe("EEE");
      expect(redisMock.setex).toHaveBeenCalledWith(
        "login:dept:HOD_CSE",
        3600,
        "EEE",
      );
    });

    it("resolves an email to a username for the student portal", async () => {
      axiosMock.get.mockImplementation(async (url: string) => {
        if (String(url).includes("resolve-login")) {
          return { data: { username: "o210008" } };
        }
        throw new Error("no profile");
      });
      prismaMock.authCredential.findFirst.mockResolvedValue(activeUser());
      const res = response();
      await studentLogin(
        request({
          username: "o210008@rguktong.ac.in",
          password: CORRECT_TEST_PW,
        }) as never,
        res as never,
      );
      expect(res.statusCode).toBe(200);
      expect(prismaMock.authCredential.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: { equals: "o210008", mode: "insensitive" } },
        }),
      );
    });

    it("returns 500 when the lookup throws", async () => {
      prismaMock.authCredential.findFirst.mockRejectedValue(new Error("db"));
      const res = response();
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        res as never,
      );
      expect(res.statusCode).toBe(500);
      expect(res.body).toMatchObject({ code: ErrorCode.INTERNAL_SERVER_ERROR });
    });
  });

  describe("otp", () => {
    it("queues a code for a known user", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      const res = response();
      await requestOtp(
        request({ username: "o210008", captchaToken: "t" }) as never,
        res as never,
      );
      expect(res.body).toMatchObject({
        success: true,
        deliveryMethod: "queued",
      });
      expect(prismaMock.otpLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ username: "O210008" }),
        }),
      );
    });

    it("falls back to push and then email", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      email.queueOtpDelivery.mockResolvedValue(false);
      email.sendOtpPush.mockResolvedValue(2);
      const push = response();
      await requestOtp(
        request({ username: "o210008" }) as never,
        push as never,
      );
      expect(push.body).toMatchObject({ deliveryMethod: "push" });

      email.sendOtpPush.mockResolvedValue(0);
      const mailed = response();
      await requestOtp(
        request({ username: "o210008" }) as never,
        mailed as never,
      );
      expect(mailed.body).toMatchObject({
        deliveryMethod: "email",
        email: "ab**@rguktong.ac.in",
      });
      expect(email.sendOtpEmail).toHaveBeenCalled();
    });

    it("rejects a failed captcha and an unknown user", async () => {
      turnstile.verifyTurnstileToken.mockResolvedValue(false);
      const captcha = response();
      await requestOtp(
        request({ username: "o210008" }) as never,
        captcha as never,
      );
      expect(captcha.statusCode).toBe(400);

      turnstile.verifyTurnstileToken.mockResolvedValue(true);
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await requestOtp(
        request({ username: "o210008" }) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);
    });

    it("resends the latest unconsumed otp by email", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        username: "o210008",
      });
      prismaMock.otpLog.findFirst.mockResolvedValue(null);
      const missing = response();
      await requestOtpEmail(
        request({ username: "o210008" }) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(400);

      prismaMock.otpLog.findFirst.mockResolvedValue({ otp: "654321" });
      const sent = response();
      await requestOtpEmail(
        request({ username: "o210008" }) as never,
        sent as never,
      );
      expect(sent.body).toMatchObject({ deliveryMethod: "email" });
      expect(email.sendOtpEmail).toHaveBeenCalledWith(
        "abcd@rguktong.ac.in",
        "O210008",
        "654321",
      );
    });

    it("verifies an otp and returns a short lived reset token", async () => {
      prismaMock.otpLog.findFirst.mockResolvedValue(null);
      const bad = response();
      await verifyOtp(
        request({ username: "o210008", otp: "000000" }) as never,
        bad as never,
      );
      expect(bad.statusCode).toBe(400);

      prismaMock.otpLog.findFirst.mockResolvedValue({
        id: "otp-1",
        username: "O210008",
        otp: "123456",
      });
      const ok = response();
      await verifyOtp(
        request({ username: "o210008", otp: "123456" }) as never,
        ok as never,
      );
      const token = (ok.body as { resetToken: string }).resetToken;
      const decoded = verifyToken(token);
      expect(decoded?.role).toBe("system_reset_intent");
      expect(decoded?.jti).toBe("otp-1");
      expect(prismaMock.otpLog.update).toHaveBeenCalled();
    });
  });

  describe("passwords", () => {
    it("resets a password with a valid token and rejects a reused one", async () => {
      const { signToken } = await import("../src/utils/token.util");
      const token = signToken({
        username: "o210008",
        role: "system_reset_intent",
        jti: "otp-1",
        exp: Math.floor(Date.now() / 1000) + 120,
      });

      const missingToken = response();
      await resetPassword(
        request({ username: "o210008", newPassword: NEW_TEST_PW }) as never,
        missingToken as never,
      );
      expect(missingToken.statusCode).toBe(400);

      const bad = response();
      await resetPassword(
        request({
          username: "o210008",
          newPassword: NEW_TEST_PW,
          resetToken: "nope",
        }) as never,
        bad as never,
      );
      expect(bad.statusCode).toBe(403);

      redisMock.get.mockResolvedValueOnce("1");
      const reused = response();
      await resetPassword(
        request({
          username: "o210008",
          newPassword: NEW_TEST_PW,
          resetToken: token,
        }) as never,
        reused as never,
      );
      expect(reused.body).toMatchObject({
        message: "Reset token has already been used.",
      });

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      const ok = response();
      await resetPassword(
        request({
          username: "O210008",
          newPassword: NEW_TEST_PW,
          resetToken: token,
        }) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ success: true });
      expect(prismaMock.authCredential.update).toHaveBeenCalled();
      expect(redisMock.setex).toHaveBeenCalledWith(
        "blacklist:reset:otp-1",
        expect.any(Number),
        "true",
      );
      expect(email.sendPasswordChangeNotification).toHaveBeenCalled();
    });

    it("changes the password of the signed in user", async () => {
      const anon = response();
      await changePassword(
        request({
          currentPassword: CORRECT_TEST_PW,
          newPassword: NEW_TEST_PW,
        }) as never,
        anon as never,
      );
      expect(anon.statusCode).toBe(401);

      const internal = response();
      await changePassword(
        request(
          { currentPassword: CORRECT_TEST_PW, newPassword: NEW_TEST_PW },
          {
            user: {
              id: "internal",
              username: "internal-service",
              role: "webadmin",
            },
          },
        ) as never,
        internal as never,
      );
      expect(internal.statusCode).toBe(401);

      prismaMock.authCredential.findUnique.mockResolvedValue(null);
      const missing = response();
      await changePassword(
        request(
          { currentPassword: CORRECT_TEST_PW, newPassword: NEW_TEST_PW },
          { user: { id: "user-1", username: "o210008", role: "student" } },
        ) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findUnique.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        passwordHash,
      });
      const wrong = response();
      await changePassword(
        request(
          { currentPassword: BAD_CURRENT_TEST_PW, newPassword: NEW_TEST_PW },
          { user: { id: "user-1", username: "o210008", role: "student" } },
        ) as never,
        wrong as never,
      );
      expect(wrong.statusCode).toBe(401);

      const ok = response();
      await changePassword(
        request(
          { currentPassword: CORRECT_TEST_PW, newPassword: NEW_TEST_PW },
          { user: { id: "user-1", username: "o210008", role: "student" } },
        ) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ success: true });
    });

    it("lets an account holder reset and skips mail for an O id", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await adminResetPassword(
        request({
          username: "hod_cse",
          password: CORRECT_TEST_PW,
          new_password: NEW_TEST_PW,
        }) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "fac-1",
        username: "hod_cse",
        passwordHash,
      });
      const bad = response();
      await adminResetPassword(
        request({
          username: "hod_cse",
          password: WRONG_TEST_PW,
          new_password: NEW_TEST_PW,
        }) as never,
        bad as never,
      );
      expect(bad.statusCode).toBe(401);

      const ok = response();
      await adminResetPassword(
        request({
          username: "hod_cse",
          password: CORRECT_TEST_PW,
          new_password: NEW_TEST_PW,
        }) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ success: true });
      expect(email.sendPasswordChangeNotification).toHaveBeenCalled();

      email.sendPasswordChangeNotification.mockClear();
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "fac-2",
        username: "O210008",
        passwordHash,
      });
      const quiet = response();
      await adminResetPassword(
        request({
          username: "O210008",
          password: CORRECT_TEST_PW,
          new_password: NEW_TEST_PW,
        }) as never,
        quiet as never,
      );
      expect(quiet.statusCode).toBe(200);
      expect(email.sendPasswordChangeNotification).not.toHaveBeenCalled();
    });

    it("lets a webadmin reset someone else's password", async () => {
      const denied = response();
      await globalAdminResetPassword(
        request(
          { targetUsername: "o210008", newPassword: NEW_TEST_PW },
          { user: { id: "user-1", username: "o210008", role: "student" } },
        ) as never,
        denied as never,
      );
      expect(denied.statusCode).toBe(403);

      const incomplete = response();
      await globalAdminResetPassword(
        request({}, { user: { role: "webadmin", username: "admin" } }) as never,
        incomplete as never,
      );
      expect(incomplete.statusCode).toBe(400);

      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await globalAdminResetPassword(
        request(
          { targetUsername: "o210008", newPassword: NEW_TEST_PW },
          { user: { role: "dean", username: "dean" } },
        ) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      const ok = response();
      await globalAdminResetPassword(
        request(
          { targetUsername: "o210008", newPassword: NEW_TEST_PW },
          { user: { role: "webadmin", username: "root" } },
        ) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ success: true });
      expect(redisMock.del).toHaveBeenCalledWith("user:status:user-1");
    });
  });

  describe("accounts", () => {
    it("suspends a user for an admin and refuses a student", async () => {
      const denied = response();
      await toggleSuspension(
        request(
          { username: "o210008", suspended: true },
          { user: { id: "user-2", role: "student", username: "x" } },
        ) as never,
        denied as never,
      );
      expect(denied.statusCode).toBe(403);

      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await toggleSuspension(
        request(
          { username: "o210008", suspended: true },
          { user: { id: "internal", role: "webadmin", username: "internal" } },
        ) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      const ok = response();
      await toggleSuspension(
        request(
          { username: "o210008", suspended: true },
          { user: { id: "admin-1", role: "webadmin", username: "root" } },
        ) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ success: true });
      expect(redisMock.setex).toHaveBeenCalledWith(
        "user:status:user-1",
        600,
        "true",
      );
    });

    it("refuses public signup and skips the password when the id already exists", async () => {
      const denied = response();
      await signup(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        denied as never,
      );
      expect(denied.statusCode).toBe(403);

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        role: "student",
      });
      const same = response();
      await signup(
        request(
          { username: "o210008", password: CORRECT_TEST_PW, role: "student" },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        same as never,
      );
      expect(same.body).toMatchObject({
        message: "Credential already exists (skipped password reset)",
      });
      expect(prismaMock.authCredential.update).not.toHaveBeenCalled();

      const changed = response();
      await signup(
        request(
          { username: "o210008", password: CORRECT_TEST_PW, role: "faculty" },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        changed as never,
      );
      expect(prismaMock.authCredential.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "faculty" } }),
      );
    });

    it("creates a credential and a matching profile", async () => {
      process.env.USER_SERVICE_URL = "http://users.test";
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      prismaMock.authCredential.create.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        role: "student",
      });
      const student = response();
      await signup(
        request(
          {
            username: "o210008",
            password: CORRECT_TEST_PW,
            role: "student",
            email: "o210008@rguktong.ac.in",
          },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        student as never,
      );
      expect(student.statusCode).toBe(201);
      expect(axiosMock.put).toHaveBeenCalledWith(
        "http://users.test/admin/student/o210008",
        expect.objectContaining({ email: "o210008@rguktong.ac.in" }),
        expect.any(Object),
      );

      prismaMock.authCredential.create.mockResolvedValue({
        id: "fac-1",
        username: "hod_cse",
        role: "hod",
      });
      const hod = response();
      await signup(
        request(
          { username: "hod_cse", password: CORRECT_TEST_PW, role: "hod" },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        hod as never,
      );
      expect(axiosMock.post).toHaveBeenCalledWith(
        "http://users.test/faculty/create",
        expect.objectContaining({ username: "hod_cse", department: "GENERAL" }),
        expect.any(Object),
      );
    });

    it("maps a unique constraint to a conflict", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      prismaMock.authCredential.create.mockRejectedValue({ code: "P2002" });
      const res = response();
      await signup(
        request(
          { username: "o210008", password: CORRECT_TEST_PW, role: "webadmin" },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        res as never,
      );
      expect(res.statusCode).toBe(409);
      expect(res.body).toMatchObject({
        code: ErrorCode.RESOURCE_ALREADY_EXISTS,
      });

      prismaMock.authCredential.create.mockRejectedValue(new Error("db"));
      const failed = response();
      await signup(
        request(
          { username: "o210008", password: CORRECT_TEST_PW },
          { headers: { "x-internal-secret": "unit-test-internal" } },
        ) as never,
        failed as never,
      );
      expect(failed.statusCode).toBe(500);
    });

    it("reports status only to an internal caller", async () => {
      const denied = response();
      await getUserStatus(
        request({}, { params: { id: "user-1" } }) as never,
        denied as never,
      );
      expect(denied.statusCode).toBe(403);

      prismaMock.authCredential.findUnique.mockResolvedValue(null);
      const missing = response();
      await getUserStatus(
        request(
          {},
          {
            params: { id: "user-1" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findUnique.mockResolvedValue({
        isDisabled: false,
        role: "student",
        username: "o210008",
      });
      const ok = response();
      await getUserStatus(
        request(
          {},
          {
            params: { id: "user-1" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({
        success: true,
        data: { username: "o210008", isDisabled: false },
      });
    });

    it("deletes an auth credential for an internal caller", async () => {
      const denied = response();
      await deleteUserByUsername(
        request({}, { params: { username: "o210008" } }) as never,
        denied as never,
      );
      expect(denied.statusCode).toBe(403);

      const blank = response();
      await deleteUserByUsername(
        request(
          {},
          {
            params: { username: "  " },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        blank as never,
      );
      expect(blank.statusCode).toBe(400);

      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await deleteUserByUsername(
        request(
          {},
          {
            params: { username: "o210008" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        missing as never,
      );
      expect(missing.body).toMatchObject({ deleted: false });

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      const ok = response();
      await deleteUserByUsername(
        request(
          {},
          {
            params: { username: "o210008" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        ok as never,
      );
      expect(ok.body).toMatchObject({ deleted: true, username: "o210008" });
      expect(prismaMock.otpLog.deleteMany).toHaveBeenCalled();
      expect(prismaMock.authCredential.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
    });
  });

  describe("failure paths", () => {
    it("returns 500 when a write fails", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        passwordHash,
        role: "student",
        isDisabled: false,
      });
      prismaMock.otpLog.create.mockRejectedValue(new Error("db"));
      const otp = response();
      await requestOtp(request({ username: "o210008" }) as never, otp as never);
      expect(otp.statusCode).toBe(500);

      prismaMock.otpLog.findFirst.mockRejectedValue(new Error("db"));
      const verify = response();
      await verifyOtp(
        request({ username: "o210008", otp: "123456" }) as never,
        verify as never,
      );
      expect(verify.statusCode).toBe(500);

      prismaMock.authCredential.findUnique.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        passwordHash,
      });
      prismaMock.authCredential.update.mockRejectedValue(new Error("db"));
      const changed = response();
      await changePassword(
        request(
          { currentPassword: CORRECT_TEST_PW, newPassword: NEW_TEST_PW },
          { user: { id: "user-1", username: "o210008", role: "student" } },
        ) as never,
        changed as never,
      );
      expect(changed.statusCode).toBe(500);

      const suspended = response();
      await toggleSuspension(
        request(
          { username: "o210008", suspended: false },
          { user: { id: "admin-1", role: "webadmin", username: "root" } },
        ) as never,
        suspended as never,
      );
      expect(suspended.statusCode).toBe(500);

      const reset = response();
      await adminResetPassword(
        request({
          username: "o210008",
          password: CORRECT_TEST_PW,
          new_password: NEW_TEST_PW,
        }) as never,
        reset as never,
      );
      expect(reset.statusCode).toBe(500);

      const globalReset = response();
      await globalAdminResetPassword(
        request(
          { targetUsername: "o210008", newPassword: NEW_TEST_PW },
          { user: { role: "webadmin", username: "root" } },
        ) as never,
        globalReset as never,
      );
      expect(globalReset.statusCode).toBe(500);

      prismaMock.authCredential.findUnique.mockRejectedValue(new Error("db"));
      const status = response();
      await getUserStatus(
        request(
          {},
          {
            params: { id: "user-1" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        status as never,
      );
      expect(status.statusCode).toBe(500);

      prismaMock.authCredential.delete.mockRejectedValue(new Error("db"));
      const removed = response();
      await deleteUserByUsername(
        request(
          {},
          {
            params: { username: "o210008" },
            headers: { "x-internal-secret": "unit-test-internal" },
          },
        ) as never,
        removed as never,
      );
      expect(removed.statusCode).toBe(500);
    });

    it("rejects a reset with no username and a missing account", async () => {
      const { signToken } = await import("../src/utils/token.util");
      const token = signToken({
        username: "o210008",
        role: "system_reset_intent",
        exp: Math.floor(Date.now() / 1000) + 120,
      });
      const blank = response();
      await resetPassword(
        request({
          username: "  ",
          newPassword: NEW_TEST_PW,
          resetToken: token,
        }) as never,
        blank as never,
      );
      expect(blank.statusCode).toBe(400);

      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await resetPassword(
        request({
          username: "o210008",
          newPassword: NEW_TEST_PW,
          resetToken: token,
        }) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
      });
      prismaMock.authCredential.update.mockRejectedValue(new Error("db"));
      const failed = response();
      await resetPassword(
        request({
          username: "o210008",
          newPassword: NEW_TEST_PW,
          resetToken: token,
        }) as never,
        failed as never,
      );
      expect(failed.statusCode).toBe(500);
    });

    it("emails an otp only after the account is found", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue(null);
      const missing = response();
      await requestOtpEmail(
        request({ username: "missing@rguktong.ac.in" }) as never,
        missing as never,
      );
      expect(missing.statusCode).toBe(404);

      prismaMock.authCredential.findFirst.mockRejectedValue(new Error("db"));
      const failed = response();
      await requestOtpEmail(
        request({ username: "o210008" }) as never,
        failed as never,
      );
      expect(failed.statusCode).toBe(500);
    });

    it("still logs in when the department cache write fails", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "hod_cse",
        passwordHash,
        role: "faculty",
        isDisabled: false,
      });
      redisMock.get.mockResolvedValue(null);
      redisMock.setex.mockRejectedValue(new Error("redis down"));
      axiosMock.get.mockResolvedValue({ data: { branch: "ME" } });
      const res = response();
      await login(
        request({ username: "hod_cse", password: CORRECT_TEST_PW }) as never,
        res as never,
      );
      expect(res.statusCode).toBe(200);
      expect(
        verifyToken((res.body as { token: string }).token)?.department,
      ).toBe("ME");
    });

    it("swallows a background login notification failure", async () => {
      prismaMock.authCredential.findFirst.mockResolvedValue({
        id: "user-1",
        username: "o210008",
        passwordHash,
        role: "student",
        isDisabled: false,
      });
      email.sendLoginNotification.mockRejectedValue(new Error("push down"));
      const res = response();
      await login(
        request({ username: "o210008", password: CORRECT_TEST_PW }) as never,
        res as never,
      );
      expect(res.statusCode).toBe(200);
      await new Promise((resolve) => setImmediate(resolve));
    });
  });
});
