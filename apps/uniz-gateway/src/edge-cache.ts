// Edge cache policy for anonymous public landing reads.
// Authenticated, cookied, and non-public responses stay uncacheable.
// A null decision leaves an upstream Cache-Control value alone (image assets).

export const PUBLIC_EDGE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=60";
export const PRIVATE_CACHE_CONTROL = "private, no-store";

const PUBLIC_PREFIXES = [
  "/api/v1/cms/api/home",
  "/api/v1/cms/api/departments",
  "/api/v1/cms/api/institute",
  "/api/v1/cms/api/notifications",
  "/api/v1/cms/api/academics",
];

export type HeaderMap = Record<string, unknown>;

export function pathOnly(url: string): string {
  const q = url.indexOf("?");
  return (q >= 0 ? url.slice(0, q) : url) || "/";
}

export function isPublicLandingRead(path: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function nonempty(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => nonempty(item));
  return String(value ?? "").trim().length > 0;
}

export function decideEdgeCacheControl(input: {
  method: string;
  path: string;
  authorization?: unknown;
  cookie?: unknown;
  setCookie?: unknown;
  status: number;
}): string | null {
  const method = input.method.toUpperCase();
  const privateRequest =
    nonempty(input.authorization) ||
    nonempty(input.cookie) ||
    nonempty(input.setCookie);
  if (privateRequest || (method !== "GET" && method !== "HEAD")) {
    return PRIVATE_CACHE_CONTROL;
  }
  if (input.status < 200 || input.status >= 300) {
    return PRIVATE_CACHE_CONTROL;
  }
  if (isPublicLandingRead(input.path)) {
    return PUBLIC_EDGE_CACHE_CONTROL;
  }
  return null;
}

export function mergeVary(existing: unknown, add: string): string {
  const parts: string[] = [];
  const raw = Array.isArray(existing) ? existing.join(",") : String(existing ?? "");
  for (const bit of `${raw},${add}`.split(",")) {
    const item = bit.trim();
    if (item && !parts.includes(item)) parts.push(item);
  }
  return parts.join(", ");
}

export function applyEdgeCacheToHeaderMap(
  headers: HeaderMap,
  input: {
    method: string;
    path: string;
    authorization?: unknown;
    cookie?: unknown;
    status: number;
  },
): void {
  const decision = decideEdgeCacheControl({
    ...input,
    setCookie: headers["set-cookie"] ?? headers["Set-Cookie"],
  });
  if (!decision) return;

  let existingVary: unknown;
  for (const key of Object.keys(headers)) {
    const lower = key.toLowerCase();
    if (lower === "vary") existingVary = headers[key];
    if (lower === "cache-control" || lower === "vary") delete headers[key];
  }
  headers["cache-control"] = decision;
  headers["vary"] = mergeVary(existingVary, "Authorization, Cookie");
}

export function copyResponseHeaders(source: object | undefined): HeaderMap {
  const out: HeaderMap = {};
  if (!source) return out;
  for (const [key, value] of Object.entries(source as HeaderMap)) {
    if (key.toLowerCase() === "cross-origin-resource-policy") continue;
    out[key] = value;
  }
  return out;
}
