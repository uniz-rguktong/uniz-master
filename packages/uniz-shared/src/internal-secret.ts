const DEV_FALLBACK = "uniz-core";

/** Resolved internal secret; throws at startup in production if unset. */
export function getInternalSecret(): string {
  const secret = process.env.INTERNAL_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_SECRET is required in production");
  }
  return secret || DEV_FALLBACK;
}

/** Validates `x-internal-secret` (or any header value) against INTERNAL_SECRET. */
export function isValidInternalSecret(
  provided: string | string[] | undefined,
): boolean {
  if (!provided || Array.isArray(provided)) {
    return false;
  }
  return provided.trim() === getInternalSecret();
}
