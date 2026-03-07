/**
 * ==============================================================================
 * UNIZ AUTH SERVICE - SECURITY GATEKEEPER (TURNSTILE)
 * ==============================================================================
 * This utility handles the backend verification of Cloudflare Turnstile tokens
 * to prevent automated bot attacks on authentication endpoints.
 * ==============================================================================
 */

import axios from "axios";

/**
 * Verifies a Cloudflare Turnstile token against the Cloudflare API.
 *
 * DESIGN PATTERN: Fail-Safe
 * If the secret key is missing, we log a warning but allow the request to
 * proceed to prevent complete service lockout due to misconfiguration.
 *
 * @param token The turnstile token from the client
 * @param clientIp The IP address of the client (optional but recommended for risk analysis)
 * @returns boolean indicating if the token is valid or verification is skipped
 */
export const verifyTurnstileToken = async (
  token: string,
  clientIp?: string,
): Promise<boolean> => {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn(
      "[TURNSTILE] TURNSTILE_SECRET_KEY not configured. Skipping verification.",
    );
    return true; // Don't block if not configured, but log a warning
  }

  // Skip if not in production or Docker environment to allow seamless development
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DOCKER_ENV !== "true"
  ) {
    console.log(
      "[TURNSTILE] Development mode detected. Skipping verification.",
    );
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const response = await axios.post(
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
