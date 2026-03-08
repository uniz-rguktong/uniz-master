module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[project]/apps/ornate-ems/src/lib/logger.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$pino$29$__ = __turbopack_context__.i("[externals]/pino [external] (pino, cjs, [project]/apps/ornate-ems/node_modules/pino)");
;
const transport = ("TURBOPACK compile-time truthy", 1) ? {
    target: "pino-pretty",
    options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "SYS:standard"
    }
} : "TURBOPACK unreachable";
const logger = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$pino$29$__["default"])({
    level: process.env.LOG_LEVEL || "info",
    transport: transport,
    base: {
        env: ("TURBOPACK compile-time value", "development")
    }
});
const __TURBOPACK__default__export__ = logger;
}),
"[project]/apps/ornate-ems/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/ornate-ems/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2d$auth$2f$middleware$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/ornate-ems/node_modules/next-auth/middleware.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$logger$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/ornate-ems/src/lib/logger.ts [middleware] (ecmascript)");
;
;
;
/**
 * ─────────────────────────────────────────────────────────
 * PROXY — Rate Limiting + Role-Based Access Guard
 * ─────────────────────────────────────────────────────────
 *
 * EXECUTION ORDER:
 *   1. Rate limiting (Upstash Redis) — runs FIRST for /api/* routes
 *   2. Authentication + Role guard (next-auth) — runs for dashboard routes
 *
 * IMPORTANT: Rate limiting and role-based auth protect DIFFERENT routes.
 *   - Rate limiting: /api/* (API endpoints only)
 *   - Role guard: /branch-admin/*, /clubs-portal/*, etc. (dashboard pages)
 *   This means they never conflict or produce duplicate responses.
 *
 * WHY THIS IS SAFE:
 *   - No changes to Prisma, server actions, unstable_cache, or revalidation
 *   - Rate limiting uses Upstash Redis (HTTP-based, Edge-compatible)
 *   - Rate limit state is stored in Upstash Redis, completely separate
 *     from Vercel's Data Cache (used by unstable_cache)
 *   - If Upstash env vars are missing, rate limiting is silently skipped
 *     (fail-open) to avoid breaking the app during development
 * ─────────────────────────────────────────────────────────
 */ // ─── Define the home paths for each role ───────────────
const rolePaths = {
    SUPER_ADMIN: "/super-admin",
    BRANCH_ADMIN: "/branch-admin",
    CLUB_COORDINATOR: "/clubs-portal",
    SPORTS_ADMIN: "/sports",
    BRANCH_SPORTS_ADMIN: "/sports/all-sports",
    HHO: "/hho",
    EVENT_COORDINATOR: "/coordinator"
};
let hasLoggedProxyRateLimitFailOpen = false;
// ─── Helper: Extract client IP safely ──────────────────
/**
 * Resolves the client IP address from the request.
 *
 * Priority order:
 *   1. request.ip (Vercel Edge provides this natively)
 *   2. x-forwarded-for header (standard proxy header)
 *   3. x-real-ip header (Nginx convention)
 *   4. "anonymous" as fallback (ensures rate limiting still works,
 *      but with a shared bucket — acceptable for edge cases)
 */ function getClientIp(request) {
    // Vercel Edge Runtime injects `ip` at runtime, but Next.js 16
    // removed it from the TypeScript types. Safe cast to access it.
    const ip = request.ip;
    if (ip) return ip;
    // Fallback: x-forwarded-for may contain a comma-separated list;
    // the first entry is the original client IP
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const firstIp = forwarded.split(",")[0]?.trim();
        if (firstIp) return firstIp;
    }
    // Fallback: x-real-ip (set by some reverse proxies)
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
    // Final fallback: shared anonymous bucket
    return "anonymous";
}
// ─── Rate Limiting Logic (API routes only) ─────────────
/**
 * Applies rate limiting for /api/* routes.
 *
 * Returns a 429 Response if the limit is exceeded,
 * or null if the request should proceed.
 *
 * Fail-open: If Upstash is not configured (e.g., local dev),
 * rate limiting is silently skipped.
 */ async function applyRateLimit(request) {
    const pathname = request.nextUrl.pathname;
    // Only rate-limit /api/* routes
    if (!pathname.startsWith("/api/")) {
        return null;
    }
    try {
        // Dynamic import to avoid initialization issues and only load when needed
        const { authRateLimiter, apiRateLimiter } = await __turbopack_context__.A("[project]/apps/ornate-ems/src/lib/rateLimiter.ts [middleware] (ecmascript, async loader)");
        // If rate limiters couldn't be initialized, skip
        if (!authRateLimiter || !apiRateLimiter) return null;
        const clientIp = getClientIp(request);
        // ── LAYER 1: Strict auth rate limiting ──────────────
        // Applies ONLY to actual login submissions (POST to callback/signin).
        // Session checks and regular polling are NOT restricted here.
        const isLoginAttempt = request.method === "POST" && (pathname.startsWith("/api/auth/callback") || pathname.startsWith("/api/auth/signin"));
        if (isLoginAttempt) {
            const { success, limit, remaining, reset } = await authRateLimiter.limit(clientIp);
            if (!success) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                    error: "Too many login attempts. Please try again later."
                }), {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString()
                    }
                });
            }
            return null;
        }
        // ── LAYER 2: General API rate limiting ──────────────
        // Applies to: /api/* (certificates, exports, uploads, etc.)
        // Policy: 100 requests per 1 minute per IP
        // We skip rate limiting for session checks to avoid the " Unexpected token <" error
        // caused by background polling hitting limits.
        if (!pathname.startsWith("/api/auth/")) {
            const { success, limit, remaining, reset } = await apiRateLimiter.limit(clientIp);
            if (!success) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                    error: "Too many requests. Please try again later."
                }), {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString()
                    }
                });
            }
        }
    } catch (error) {
        // FAIL-OPEN: If Redis is unreachable or not configured,
        // allow the request through rather than blocking all traffic.
        // This is intentional — rate limiting is a defense layer,
        // not a gatekeeper for core functionality.
        //
        // ⚠ ESCALATION: Log as ERROR with structured tag so log watchers/alerting
        // can detect when rate limiting is silently disabled.
        if (!hasLoggedProxyRateLimitFailOpen) {
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$logger$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["default"].warn({
                err: error,
                alert: "RATE_LIMIT_FAIL_OPEN",
                layer: "proxy",
                pathname: request.nextUrl.pathname,
                clientIp: getClientIp(request)
            }, "[RATE_LIMIT_FAIL_OPEN] Proxy rate limiting failed — allowing requests without Redis in this process.");
            hasLoggedProxyRateLimitFailOpen = true;
        }
    }
    return null;
}
// ─── Role-Based Auth Guard (dashboard routes) ──────────
/**
 * The existing role-based auth middleware, unchanged.
 * Protected by next-auth's withAuth wrapper which handles
 * JWT validation and redirects unauthenticated users to /login.
 */ const authMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2d$auth$2f$middleware$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["withAuth"])(function authHandler(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    if (!token) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/login", req.url));
    }
    const userRole = token.role;
    const branch = token.branch;
    let allowedPath = rolePaths[userRole] || "/login";
    // Strict Role-Based Access Control for Dashboard Routes
    // Branch Admin Route Protection
    if (pathname.startsWith("/branch-admin") && userRole !== "BRANCH_ADMIN" && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    // Clubs Portal Route Protection
    if (pathname.startsWith("/clubs-portal") && userRole !== "CLUB_COORDINATOR" && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    // Sports Admin Route Protection
    if (pathname.startsWith("/sports") && userRole !== "SPORTS_ADMIN" && userRole !== "BRANCH_SPORTS_ADMIN" && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    // HHO Route Protection
    if (pathname.startsWith("/hho") && userRole !== "HHO" && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    // Super Admin Route Protection
    if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    // Event Coordinator Route Protection
    if (pathname.startsWith("/coordinator") && userRole !== "EVENT_COORDINATOR" && userRole !== "SUPER_ADMIN") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(allowedPath, req.url));
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
}, {
    callbacks: {
        authorized: ({ token })=>!!token
    },
    pages: {
        signIn: "/login"
    }
});
// ─── CSRF Origin Validation (mutating API routes) ──────
/**
 * Validates that mutating requests (POST, PUT, DELETE, PATCH) to /api/*
 * originate from the same site. This prevents cross-site form submissions
 * that exploit cookie-based session authentication.
 *
 * Strategy: Check `Origin` header (or `Referer` as fallback) against
 * the app's own URL. If neither header is present on a mutating request,
 * reject it — legitimate browser requests always include at least one.
 *
 * Exemptions:
 *   - GET/HEAD/OPTIONS requests (safe methods, no state change)
 *   - /api/auth/* routes (handled by next-auth's own CSRF protection)
 *   - Non-browser clients (API keys, cron jobs) can set a custom
 *     `X-Requested-With: XMLHttpRequest` header to bypass, which
 *     cannot be set cross-origin without CORS preflight approval.
 */ function validateCsrf(request) {
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    // Only check mutating methods on /api/* routes
    if (!pathname.startsWith("/api/")) return null;
    if ([
        "GET",
        "HEAD",
        "OPTIONS"
    ].includes(method)) return null;
    // next-auth has its own CSRF token validation
    if (pathname.startsWith("/api/auth/")) return null;
    // Allow requests with X-Requested-With header (cannot be set cross-origin
    // without CORS preflight, which we don't allow from foreign origins)
    if (request.headers.get("x-requested-with")) return null;
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    // Determine the allowed origin from the request's own host
    // (works for any domain/port without env var dependency)
    const allowedOrigin = request.nextUrl.origin;
    if (origin) {
        // Origin header present — must match our origin exactly
        if (origin !== allowedOrigin) {
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$logger$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["default"].warn({
                origin,
                allowedOrigin,
                pathname,
                method
            }, "[CSRF] Blocked cross-origin mutating request");
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Cross-origin requests are not allowed"
            }, {
                status: 403
            });
        }
        return null; // Origin matches — safe
    }
    if (referer) {
        // No Origin but Referer present — validate the Referer starts with our origin
        try {
            const refererOrigin = new URL(referer).origin;
            if (refererOrigin !== allowedOrigin) {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$logger$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["default"].warn({
                    referer,
                    allowedOrigin,
                    pathname,
                    method
                }, "[CSRF] Blocked cross-origin mutating request (referer mismatch)");
                return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Cross-origin requests are not allowed"
                }, {
                    status: 403
                });
            }
            return null; // Referer matches — safe
        } catch  {
            // Malformed referer URL — reject
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Invalid request origin"
            }, {
                status: 403
            });
        }
    }
    // Neither Origin nor Referer present on a mutating request.
    // Browsers always send at least one for POST requests.
    // This could be a direct API call (curl, etc.) — allow only if
    // the request includes Content-Type header (simple requests
    // without Content-Type of application/json are the CSRF vector).
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        // application/json triggers CORS preflight for cross-origin requests,
        // so if it reaches here, it's same-origin or a non-browser client.
        return null;
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$logger$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["default"].warn({
        pathname,
        method
    }, "[CSRF] Blocked mutating request with no Origin/Referer headers");
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Missing origin validation headers"
    }, {
        status: 403
    });
}
async function proxy(request) {
    // STEP 0: CSRF validation — blocks cross-origin mutating requests
    const csrfResponse = validateCsrf(request);
    if (csrfResponse) {
        return csrfResponse;
    }
    // STEP 1: Rate limiting — runs first, returns 429 if exceeded
    const rateLimitResponse = await applyRateLimit(request);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }
    // STEP 2: Auth + Role guard — only runs for dashboard routes
    // (API routes matched above already passed rate limiting;
    //  the withAuth wrapper handles its own matching internally)
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/branch-admin") || pathname.startsWith("/clubs-portal") || pathname.startsWith("/sports") || pathname.startsWith("/hho") || pathname.startsWith("/super-admin") || pathname.startsWith("/coordinator")) {
        // Cast to any because withAuth returns a middleware-compatible
        // function but TypeScript types don't perfectly align between
        // NextRequest and NextRequestWithAuth for manual invocation.
        return authMiddleware(request, {});
    }
    // All other routes: proceed without intervention
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        "/api/:path*",
        "/branch-admin/:path*",
        "/clubs-portal/:path*",
        "/sports/:path*",
        "/hho/:path*",
        "/super-admin/:path*",
        "/coordinator/:path*"
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bd7bbea2._.js.map