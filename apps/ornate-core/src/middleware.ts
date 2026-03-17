import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import logger from "@/lib/logger";

/**
 * ─────────────────────────────────────────────────────────
 * MIDDLEWARE — Rate Limiting + Role-Based Access Guard
 * ─────────────────────────────────────────────────────────
 */

// ─── Define the home paths for each role ───────────────
const rolePaths: Record<string, string> = {
    SUPER_ADMIN: "/super-admin",
    BRANCH_ADMIN: "/branch-admin",
    CLUB_COORDINATOR: "/clubs-portal",
    SPORTS_ADMIN: "/sports",
    BRANCH_SPORTS_ADMIN: "/sports/all-sports",
    HHO: "/hho",
    EVENT_COORDINATOR: "/coordinator",
};

let hasLoggedProxyRateLimitFailOpen = false;

// ─── Helper: Extract client IP safely ──────────────────
function getClientIp(request: NextRequest): string {
    const ip = (request as NextRequest & { ip?: string }).ip;
    if (ip) return ip;

    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const firstIp = forwarded.split(",")[0]?.trim();
        if (firstIp) return firstIp;
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;

    return "anonymous";
}

// ─── Rate Limiting Logic (API routes only) ─────────────
async function applyRateLimit(
    request: NextRequest
): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    if (!pathname.startsWith("/api/")) {
        return null;
    }

    try {
        const { authRateLimiter, apiRateLimiter } = await import("./lib/rateLimiter");

        if (!authRateLimiter || !apiRateLimiter) return null;

        const clientIp = getClientIp(request);

        const isLoginAttempt =
            request.method === "POST" &&
            (pathname.startsWith("/api/auth/callback") ||
                pathname.startsWith("/api/auth/signin"));

        if (isLoginAttempt) {
            const { success, limit, remaining, reset } =
                await authRateLimiter.limit(clientIp);

            if (!success) {
                return new NextResponse(
                    JSON.stringify({
                        error: "Too many login attempts. Please try again later.",
                    }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "X-RateLimit-Limit": limit.toString(),
                            "X-RateLimit-Remaining": remaining.toString(),
                            "X-RateLimit-Reset": reset.toString(),
                            "Retry-After": Math.ceil(
                                (reset - Date.now()) / 1000
                            ).toString(),
                        },
                    }
                );
            }

            return null;
        }

        if (!pathname.startsWith("/api/auth/")) {
            const { success, limit, remaining, reset } =
                await apiRateLimiter.limit(clientIp);

            if (!success) {
                return new NextResponse(
                    JSON.stringify({
                        error: "Too many requests. Please try again later.",
                    }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "X-RateLimit-Limit": limit.toString(),
                            "X-RateLimit-Remaining": remaining.toString(),
                            "X-RateLimit-Reset": reset.toString(),
                            "Retry-After": Math.ceil(
                                (reset - Date.now()) / 1000
                            ).toString(),
                        },
                    }
                );
            }
        }
    } catch (error) {
        if (!hasLoggedProxyRateLimitFailOpen) {
            logger.warn(
                {
                    err: error,
                    alert: 'RATE_LIMIT_FAIL_OPEN',
                    layer: 'proxy',
                    pathname: request.nextUrl.pathname,
                    clientIp: getClientIp(request),
                },
                '[RATE_LIMIT_FAIL_OPEN] Proxy rate limiting failed — allowing requests without Redis in this process.'
            );
            hasLoggedProxyRateLimitFailOpen = true;
        }
    }

    return null;
}

// ─── Role-Based Auth Guard (dashboard routes) ──────────
const authMiddleware = withAuth(
    function authHandler(req: NextRequestWithAuth) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const userRole = token.role as string;
        let allowedPath = rolePaths[userRole] || "/login";

        // Role-Based Access Control
        if (pathname.startsWith("/branch-admin") && userRole !== "BRANCH_ADMIN" && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }
        if (pathname.startsWith("/clubs-portal") && userRole !== "CLUB_COORDINATOR" && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }
        if (pathname.startsWith("/sports") && userRole !== "SPORTS_ADMIN" && userRole !== "BRANCH_SPORTS_ADMIN" && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }
        if (pathname.startsWith("/hho") && userRole !== "HHO" && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }
        if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }
        if (pathname.startsWith("/coordinator") && userRole !== "EVENT_COORDINATOR" && userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL(allowedPath, req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
        cookies: {
            sessionToken: {
                name: "next-auth.session-token.ornate-core",
            },
        },
    }
);

// ─── CSRF Origin Validation (mutating API routes) ──────
function validateCsrf(request: NextRequest): NextResponse | null {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    if (!pathname.startsWith("/api/")) return null;
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return null;
    if (pathname.startsWith("/api/auth/")) return null;
    if (request.headers.get("x-requested-with")) return null;

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const allowedOrigin = request.nextUrl.origin;

    if (origin) {
        if (origin !== allowedOrigin) {
            logger.warn({ origin, allowedOrigin, pathname, method }, '[CSRF] Blocked cross-origin mutating request');
            return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
        }
        return null;
    }

    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin;
            if (refererOrigin !== allowedOrigin) {
                logger.warn({ referer, allowedOrigin, pathname, method }, '[CSRF] Blocked cross-origin referer mismatch');
                return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
            }
            return null;
        } catch {
            return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
        }
    }

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return null;

    logger.warn({ pathname, method }, '[CSRF] Blocked mutating request with no Origin/Referer');
    return NextResponse.json({ error: "Missing origin validation headers" }, { status: 403 });
}

// ─── Main Middleware Entry Point ───────────────────────
export default async function middleware(request: NextRequest) {
    const csrfResponse = validateCsrf(request);
    if (csrfResponse) return csrfResponse;

    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const pathname = request.nextUrl.pathname;

    if (
        pathname.startsWith("/branch-admin") ||
        pathname.startsWith("/clubs-portal") ||
        pathname.startsWith("/sports") ||
        pathname.startsWith("/hho") ||
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/coordinator")
    ) {
        return (authMiddleware as any)(request, {} as any);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
        "/branch-admin/:path*",
        "/clubs-portal/:path*",
        "/sports/:path*",
        "/hho/:path*",
        "/super-admin/:path*",
        "/coordinator/:path*"
    ],
};
