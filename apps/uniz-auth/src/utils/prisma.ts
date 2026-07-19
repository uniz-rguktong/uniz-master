import { PrismaClient } from "../generated/prisma";

/**
 * Append an explicit connection pool size + timeout to the DB URL.
 *
 * Prisma's default pool is `num_cpus * 2 + 1`, computed from the *host* CPU
 * count — under K8s (this service scales to 3 replicas sharing one Postgres)
 * that silently over-provisions connections and can exhaust `max_connections`.
 * We pin a small, override-able limit so total connections stay well under the
 * server cap. Tunable via PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT.
 */
function pooledUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set(
        "connection_limit",
        process.env.PRISMA_CONNECTION_LIMIT || "5",
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set(
        "pool_timeout",
        process.env.PRISMA_POOL_TIMEOUT || "15",
      );
    }
    return url.toString();
  } catch {
    return raw;
  }
}

/**
 * Optional slow-query logging. Set SLOW_QUERY_MS=<n> to emit a warning for any
 * query slower than n ms — a temporary, prod-safe probe (off by default, no
 * overhead when unset) for locating hot queries during the perf audit.
 */
const SLOW_MS = Number(process.env.SLOW_QUERY_MS || 0);
const baseLevels: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      SLOW_MS > 0
        ? [
            ...baseLevels.map((level) => ({ emit: "stdout" as const, level })),
            { emit: "event" as const, level: "query" as const },
          ]
        : baseLevels,
    datasources: { db: { url: pooledUrl(process.env.DATABASE_URL) } },
  });

if (SLOW_MS > 0) {
  (
    prisma as unknown as { $on: (e: string, cb: (ev: any) => void) => void }
  ).$on("query", (e: { duration: number; query: string }) => {
    if (e.duration >= SLOW_MS) {
      console.warn(`[slow-query] ${e.duration}ms :: ${e.query}`);
    }
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
