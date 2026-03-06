import { SlidingWindowLimiter } from "./rateLimiter";
import logger from "@/lib/logger";
import { redis } from "@/lib/redis";

export interface ServerActionRateLimitConfig {
  limit?: number;
  window?: `${number} ${"s" | "m" | "h" | "d"}`;
  prefix?: string;
}

export interface EnforceServerActionRateLimitInput {
  actionName: string;
  identifier: string;
  config?: ServerActionRateLimitConfig;
}

export class ServerActionRateLimitError extends Error {
  code: "RATE_LIMIT_EXCEEDED";
  status: number;
  retryAfter: number;
  limit: number;
  remaining: number;

  constructor(params: {
    actionName: string;
    retryAfter: number;
    limit: number;
    remaining: number;
  }) {
    super(`Rate limit exceeded for ${params.actionName}. Please retry later.`);
    this.name = "ServerActionRateLimitError";
    this.code = "RATE_LIMIT_EXCEEDED";
    this.status = 429;
    this.retryAfter = params.retryAfter;
    this.limit = params.limit;
    this.remaining = params.remaining;
  }
}

const limiterCache = new Map<string, SlidingWindowLimiter>();
const inMemoryFallbackStore = new Map<
  string,
  { count: number; resetAt: number }
>();
let hasLoggedFallbackNotice = false;

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW = "1 m";

function parseWindowToMs(window: string): number {
  const [amountRaw, unitRaw] = window.split(" ") as [
    string,
    "s" | "m" | "h" | "d",
  ];
  const amount = Number.parseInt(amountRaw, 10);
  const safeAmount = Number.isNaN(amount) || amount <= 0 ? 1 : amount;

  if (unitRaw === "s") return safeAmount * 1000;
  if (unitRaw === "m") return safeAmount * 60 * 1000;
  if (unitRaw === "h") return safeAmount * 60 * 60 * 1000;
  return safeAmount * 24 * 60 * 60 * 1000;
}

function enforceInMemoryFallbackRateLimit(params: {
  actionName: string;
  identifier: string;
  limit: number;
  window: string;
  prefix: string;
}): void {
  const { actionName, identifier, limit, window, prefix } = params;
  const now = Date.now();
  const windowMs = parseWindowToMs(window);
  const key = `${prefix}:${identifier}`;

  const existing = inMemoryFallbackStore.get(key);
  const isExpired = !existing || existing.resetAt <= now;

  const nextState = isExpired
    ? { count: 1, resetAt: now + windowMs }
    : { count: existing.count + 1, resetAt: existing.resetAt };

  inMemoryFallbackStore.set(key, nextState);

  if (nextState.count > limit) {
    throw new ServerActionRateLimitError({
      actionName,
      retryAfter: Math.max(1, Math.ceil((nextState.resetAt - now) / 1000)),
      limit,
      remaining: Math.max(0, limit - nextState.count),
    });
  }
}

function getLimiter(
  config?: ServerActionRateLimitConfig,
): SlidingWindowLimiter | null {
  if (!redis) {
    return null;
  }

  const limit = config?.limit ?? DEFAULT_LIMIT;
  const window = config?.window ?? DEFAULT_WINDOW;
  const prefix = config?.prefix ?? "ratelimit:server-action:write";
  const cacheKey = `${prefix}:${limit}:${window}`;

  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(cacheKey, new SlidingWindowLimiter(prefix, limit, window));
  }

  return limiterCache.get(cacheKey)!;
}

export function shouldRateLimitServerAction(context?: string): boolean {
  if (!context) return false;

  const normalized = context.trim().toLowerCase();
  if (!normalized) return false;

  // DEFAULT-DENY: Only skip rate limiting for known read-only prefixes.
  // Everything else (mutations) is rate limited automatically.
  // This prevents bypass when new mutation verbs are introduced.
  if (/^(get|list|fetch|view|load|read|search|count|verify)/.test(normalized)) {
    return false;
  }

  return true;
}

export async function enforceServerActionRateLimit(
  input: EnforceServerActionRateLimitInput,
): Promise<void> {
  const { actionName, identifier, config } = input;
  const limiter = getLimiter(config);
  const resolvedIdentifier = identifier || "anonymous";
  const limit = config?.limit ?? DEFAULT_LIMIT;
  const window = config?.window ?? DEFAULT_WINDOW;
  const prefix = config?.prefix ?? "ratelimit:server-action:write";

  if (!limiter) {
    if (!hasLoggedFallbackNotice) {
      logger.warn(
        {
          actionName,
          identifier: resolvedIdentifier,
          alert: "RATE_LIMIT_FALLBACK_MEMORY",
          layer: "server-action",
        },
        "[RATE_LIMIT_FALLBACK_MEMORY] Redis unavailable — using in-memory rate limiting for this process.",
      );
      hasLoggedFallbackNotice = true;
    }

    enforceInMemoryFallbackRateLimit({
      actionName,
      identifier: resolvedIdentifier,
      limit,
      window,
      prefix,
    });
    return;
  }

  const result = await limiter.limit(resolvedIdentifier);

  if (!result.success) {
    logger.warn(
      {
        actionName,
        identifier: resolvedIdentifier,
        limit,
        remaining: result.remaining,
        reset: result.reset,
      },
      "Server action rate limit exceeded",
    );

    throw new ServerActionRateLimitError({
      actionName,
      retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      limit,
      remaining: result.remaining,
    });
  }
}
