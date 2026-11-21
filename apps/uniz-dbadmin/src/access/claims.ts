export function accessCertsUrl(teamDomain: string): URL {
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain)) {
    throw new Error("CF_ACCESS_TEAM_DOMAIN is not a Cloudflare Access team domain");
  }
  return new URL(`https://${teamDomain}/cdn-cgi/access/certs`);
}

export function accessIssuer(teamDomain: string): string {
  return `https://${teamDomain}`;
}

export function claimsAllow(
  payload: { iss?: string; aud?: string | string[] },
  issuer: string,
  aud: string,
): boolean {
  if (!issuer || !aud) return false;
  if (payload.iss !== issuer) return false;
  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  return audiences.includes(aud);
}

export function readAccessToken(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const raw = headers["cf-access-jwt-assertion"];
  if (typeof raw !== "string") return null;
  const token = raw.trim();
  return token ? token : null;
}

export async function decideAccess(
  token: string | null,
  verify: (token: string) => Promise<{ iss?: string; aud?: string | string[] }>,
  issuer: string,
  aud: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const payload = await verify(token);
    return claimsAllow(payload, issuer, aud);
  } catch {
    return false;
  }
}
