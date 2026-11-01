import { afterEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => ({ post: postMock }),
  },
}));

import { verifyTurnstileToken } from "../src/utils/turnstile.util";

const LONG_TOKEN = "a".repeat(60);

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    postMock.mockReset();
  });

  it("skips verification in dev when no secret is configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(await verifyTurnstileToken("")).toBe(true);
    expect(postMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("fails closed in production when no secret is configured", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(await verifyTurnstileToken(LONG_TOKEN)).toBe(false);
    expect(postMock).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("accepts Cloudflare's dummy secret outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    expect(await verifyTurnstileToken("")).toBe(true);
  });

  it("does not honor the dummy secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    expect(await verifyTurnstileToken("")).toBe(false);
  });

  it("rejects a missing, short, or malformed token", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret");
    expect(await verifyTurnstileToken("")).toBe(false);
    expect(await verifyTurnstileToken("short")).toBe(false);
    expect(await verifyTurnstileToken(`${"a".repeat(50)}!`)).toBe(false);
    expect(postMock).not.toHaveBeenCalled();
  });

  it("posts the token and client ip and accepts a success response", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret");
    postMock.mockResolvedValue({ data: { success: true } });
    expect(await verifyTurnstileToken(LONG_TOKEN, "10.0.0.8")).toBe(true);
    const [url, body, config] = postMock.mock.calls[0];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(body).toContain("secret=real-secret");
    expect(body).toContain(`response=${LONG_TOKEN}`);
    expect(body).toContain("remoteip=10.0.0.8");
    expect(config.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
  });

  it("returns false when Cloudflare rejects the token", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret");
    postMock.mockResolvedValue({
      data: { success: false, "error-codes": ["invalid-input-response"] },
    });
    expect(await verifyTurnstileToken(LONG_TOKEN)).toBe(false);
    warn.mockRestore();
  });

  it("returns false when the verify call throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "real-secret");
    postMock.mockRejectedValue(new Error("timeout"));
    expect(await verifyTurnstileToken(LONG_TOKEN)).toBe(false);
    error.mockRestore();
  });
});
