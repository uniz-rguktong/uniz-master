import { PrismaClient } from "../generated/prisma";

/**
 * Append an explicit connection pool size + timeout to the DB URL.
 *
 * Prisma's default pool is `num_cpus * 2 + 1`, computed from the *host* CPU
 * count — under K8s (multiple services share one Postgres) that silently
 * over-provisions connections and can exhaust `max_connections`. We pin a
 * small, override-able limit so total connections stay well under the server
 * cap. Tunable via PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT.
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

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: pooledUrl(
          process.env.NOTIFICATION_DATABASE_URL || process.env.DATABASE_URL,
        ),
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
