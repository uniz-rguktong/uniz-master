export const PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED";
export const AUTH_TOKEN_REVOKED = "AUTH_TOKEN_REVOKED";

export type SessionRejection = {
  status: 401 | 403;
  code: string;
  message: string;
};

export type CredentialStatusSnapshot = {
  isDisabled: boolean;
  tokenVersion: number;
  mustChangePassword: boolean;
};

/** Password change and logout stay available while a new password is required. */
export function isPasswordChangeExempt(method: string, path: string): boolean {
  if (String(method || "").toUpperCase() !== "POST") return false;
  const bare = String(path || "")
    .split("?")[0]
    .replace(/\/+$/, "")
    .toLowerCase();
  return (
    bare.endsWith("/password/change") ||
    bare.endsWith("/password/change/otp") ||
    bare.endsWith("/logout")
  );
}

/**
 * Reject a JWT whose tokenVersion is older than the credential, and block
 * every other call while mustChangePassword is set.
 * A missing JWT version is generation 0, matching credentials that have
 * never been bumped.
 */
export function rejectStaleSession(input: {
  jwtVersion?: number | null;
  currentVersion: number;
  mustChangePassword: boolean;
  method: string;
  path: string;
}): SessionRejection | null {
  const jwtVersion = Number.isFinite(input.jwtVersion)
    ? Number(input.jwtVersion)
    : 0;
  const current = Number.isFinite(input.currentVersion)
    ? Number(input.currentVersion)
    : 0;
  if (jwtVersion !== current) {
    return {
      status: 401,
      code: AUTH_TOKEN_REVOKED,
      message: "Your session has ended. Please sign in again.",
    };
  }
  if (
    input.mustChangePassword &&
    !isPasswordChangeExempt(input.method, input.path)
  ) {
    return {
      status: 403,
      code: PASSWORD_CHANGE_REQUIRED,
      message: "Set a new password before continuing.",
    };
  }
  return null;
}

export function encodeCredentialStatus(
  status: CredentialStatusSnapshot,
): string {
  return JSON.stringify({
    d: status.isDisabled ? 1 : 0,
    v: status.tokenVersion,
    m: status.mustChangePassword ? 1 : 0,
  });
}

/** Legacy "true"/"false" suspension cache is a miss so the version is reloaded. */
export function decodeCredentialStatus(
  raw: string | null | undefined,
): CredentialStatusSnapshot | null {
  if (!raw || raw === "true" || raw === "false") return null;
  try {
    const parsed = JSON.parse(raw) as {
      d?: unknown;
      v?: unknown;
      m?: unknown;
    };
    if (typeof parsed.v !== "number" || !Number.isFinite(parsed.v)) return null;
    return {
      isDisabled: parsed.d === 1 || parsed.d === true,
      tokenVersion: parsed.v,
      mustChangePassword: parsed.m === 1 || parsed.m === true,
    };
  } catch {
    return null;
  }
}
