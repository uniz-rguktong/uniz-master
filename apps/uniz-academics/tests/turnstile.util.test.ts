import axios from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { verifyTurnstileToken } from "../src/utils/turnstile.util";

afterEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
});

describe("verifyTurnstileToken", () => {
  it("skips verification when no secret is configured", async () => {
    await expect(verifyTurnstileToken("")).resolves.toBe(true);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("rejects a missing token once a secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "unit-test-turnstile";
    await expect(verifyTurnstileToken("")).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("accepts a token the verifier marks successful", async () => {
    process.env.TURNSTILE_SECRET_KEY = "unit-test-turnstile";
    axios.post.mockResolvedValue({ data: { success: true } });
    await expect(verifyTurnstileToken("token-1", "203.0.113.4")).resolves.toBe(
      true,
    );
    expect(axios.post).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.stringContaining("remoteip=203.0.113.4"),
      expect.any(Object),
    );
  });

  it("returns false when verification fails or the request throws", async () => {
    process.env.TURNSTILE_SECRET_KEY = "unit-test-turnstile";
    axios.post.mockResolvedValueOnce({
      data: { success: false, "error-codes": ["invalid-input-response"] },
    });
    await expect(verifyTurnstileToken("token-1")).resolves.toBe(false);

    axios.post.mockRejectedValueOnce(new Error("offline"));
    await expect(verifyTurnstileToken("token-1")).resolves.toBe(false);
  });
});
