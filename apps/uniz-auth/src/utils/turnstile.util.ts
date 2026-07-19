import axios from "axios";
import http from "http";
import https from "https";

/** Cloudflare Turnstile dummy secret — always passes (local/dev only). */
const TURNSTILE_TEST_SECRET_ALWAYS_PASS = "1x0000000000000000000000000000000AA";

/** Real Turnstile tokens are long alphanumeric strings (with . _ -). */
const TURNSTILE_TOKEN_PATTERN = /^[A-Za-z0-9._-]+$/;
const TURNSTILE_MIN_TOKEN_LENGTH = 50;
const TURNSTILE_VERIFY_TIMEOUT_MS = 800;

const turnstileClient = axios.create({
  timeout: TURNSTILE_VERIFY_TIMEOUT_MS,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

/**
 * Verifies a Cloudflare Turnstile token.
 *
 * @param token The turnstile token from the client
 * @param clientIp The IP address of the client (optional but recommended)
 * @returns boolean indicating if the token is valid
 */
export const verifyTurnstileToken = async (
  token: string,
  clientIp?: string,
): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[TURNSTILE] TURNSTILE_SECRET_KEY not configured in production.",
      );
      return false;
    }
    console.warn(
      "[TURNSTILE] TURNSTILE_SECRET_KEY not configured. Skipping verification (dev only).",
    );
    return true;
  }

  // Local dev: Cloudflare dummy secret — always passes (even without a client token).
  if (
    secretKey === TURNSTILE_TEST_SECRET_ALWAYS_PASS &&
    process.env.NODE_ENV !== "production"
  ) {
    return true;
  }

  if (!token) {
    return false;
  }

  if (
    token.length < TURNSTILE_MIN_TOKEN_LENGTH ||
    !TURNSTILE_TOKEN_PATTERN.test(token)
  ) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const response = await turnstileClient.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const result = response.data;
    if (!result.success) {
      console.warn("[TURNSTILE] Verification failed:", result["error-codes"]);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("[TURNSTILE] Error verifying token:", error.message);
    return false;
  }
};
