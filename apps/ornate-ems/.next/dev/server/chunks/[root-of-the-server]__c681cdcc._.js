module.exports = [
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[project]/apps/ornate-ems/src/lib/redis.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "redis",
    ()=>redis
]);
/**
 * ─────────────────────────────────────────────────────────
 * Standard Redis Client (ioredis) — TCP-Based
 * ─────────────────────────────────────────────────────────
 *
 * WHY ioredis:
 *   In your VPS environment, Redis is running as a local K3s service.
 *   ioredis uses standard TCP connections, which are faster and more reliable
 *   within your cluster's internal network than HTTP resets.
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 *   REDIS_URL — e.g. redis://uniz-redis:6379
 * ─────────────────────────────────────────────────────────
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/ornate-ems/node_modules/ioredis/built/index.js [middleware] (ecmascript)");
;
function createRedisClient() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        if ("TURBOPACK compile-time truthy", 1) {
            console.warn("[Redis] REDIS_URL not set — rate limiting might be affected.");
        }
        return null;
    }
    try {
        const client = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"](redisUrl, {
            maxRetriesPerRequest: 3,
            reconnectOnError: (err)=>{
                console.error("[Redis] Reconnect error:", err.message);
                return true;
            }
        });
        client.on("error", (err)=>{
            console.error("[Redis] Client error:", err.message);
        });
        return client;
    } catch (e) {
        console.error("[Redis] Failed to initialize:", e);
        return null;
    }
}
const redis = createRedisClient();
}),
"[project]/apps/ornate-ems/src/lib/rateLimiter.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SlidingWindowLimiter",
    ()=>SlidingWindowLimiter,
    "apiRateLimiter",
    ()=>apiRateLimiter,
    "authRateLimiter",
    ()=>authRateLimiter
]);
/**
 * ─────────────────────────────────────────────────────────
 * Rate Limiting Configuration — Custom ioredis Implementation
 * ─────────────────────────────────────────────────────────
 *
 * WHY CUSTOM:
 *   We moved from Upstash (HTTP) to local Redis (TCP). @upstash/ratelimit
 *   is built for HTTP. This custom implementation uses standard Redis
 *   commands (INCR, EXPIRE) to provide the same sliding window protection.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/ornate-ems/src/lib/redis.ts [middleware] (ecmascript)");
;
class SlidingWindowLimiter {
    prefix;
    max;
    windowSeconds;
    constructor(prefix, max, window){
        this.prefix = prefix;
        this.max = max;
        // Parse "5 m" or "1 m" to seconds
        const match = window.match(/^(\d+)\s*(m|s|h)$/);
        if (!match || !match[1] || !match[2]) throw new Error(`Invalid window format: ${window}`);
        const value = parseInt(match[1]);
        const unit = match[2];
        this.windowSeconds = unit === "m" ? value * 60 : unit === "h" ? value * 3600 : value;
    }
    async limit(identifier) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"]) {
            return {
                success: true,
                limit: this.max,
                remaining: this.max,
                reset: Date.now()
            };
        }
        const key = `${this.prefix}:${identifier}`;
        const now = Math.floor(Date.now() / 1000);
        const windowKey = `${key}:${Math.floor(now / this.windowSeconds)}`;
        const count = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"].incr(windowKey);
        if (count === 1) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$ornate$2d$ems$2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"].expire(windowKey, this.windowSeconds * 2);
        }
        const remaining = Math.max(0, this.max - count);
        const reset = (Math.floor(now / this.windowSeconds) + 1) * this.windowSeconds * 1000;
        return {
            success: count <= this.max,
            limit: this.max,
            remaining,
            reset
        };
    }
}
const authRateLimiter = new SlidingWindowLimiter("ratelimit:auth", 5, "5 m");
const apiRateLimiter = new SlidingWindowLimiter("ratelimit:api", 100, "1 m");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c681cdcc._.js.map