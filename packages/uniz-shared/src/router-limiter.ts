import { createHash } from "node:crypto";
import { isValidInternalSecret } from "./internal-secret";

type ReqLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
};

function header(req: ReqLike, name: string): string {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v)?.toString().trim() || "";
}

/**
 * Per-client key. Signed-in users are keyed by their token so students behind
 * the shared campus NAT are not pooled into one bucket. Anonymous traffic is
 * keyed by the client address the edge forwards (the gateway proxies headers
 * unchanged), falling back to the socket address.
 */
export function clientKey(req: ReqLike): string {
  const auth = header(req, "authorization");
  if (auth) {
    return `t:${createHash("sha256").update(auth).digest("hex").slice(0, 24)}`;
  }
  const ip =
    header(req, "cf-connecting-ip") ||
    header(req, "x-forwarded-for").split(",")[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";
  return `ip:${ip}`;
}

/**
 * Generous per-router limiter: a backstop against request floods, not a
 * business rule. Service-to-service calls carrying the internal secret and
 * health probes are exempt. Login, OTP and other sensitive routes keep their
 * own, much stricter limiters.
 */
export const routerLimiterOptions = {
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: ReqLike) => clientKey(req),
  skip: (req: ReqLike & { path: string }) =>
    req.path === "/health" ||
    isValidInternalSecret(req.headers["x-internal-secret"]),
  message: { success: false, message: "Too many requests. Please slow down." },
  validate: {
    xForwardedForHeader: false,
    trustProxy: false,
    keyGeneratorIpFallback: false,
  },
};
