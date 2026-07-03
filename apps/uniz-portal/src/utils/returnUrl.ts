/**
 * Safe internal return paths after sign-in (open redirect guard).
 */
export function getSafeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    if (decoded.includes("://")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function signInWithReturn(
  portal: "student" | "admin",
  returnPath: string,
): string {
  return `/${portal}/signin?returnUrl=${encodeURIComponent(returnPath)}`;
}
