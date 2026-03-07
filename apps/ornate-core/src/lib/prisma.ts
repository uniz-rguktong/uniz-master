import { PrismaClient } from "./generated/client";
import logger from "@/lib/logger";

const DEFAULT_FIND_MANY_TAKE = 200;
const MAX_FIND_MANY_TAKE = 500;
const DEFAULT_DEV_POOL_TIMEOUT_SECONDS = 60;
const DEFAULT_DEV_CONNECTION_LIMIT = 25;
const DEFAULT_TRANSACTION_MAX_WAIT_MS = 10_000;
const DEFAULT_TRANSACTION_TIMEOUT_MS = 30_000;

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn(
      { name, rawValue, fallback },
      "Invalid numeric env value; using fallback",
    );
    return fallback;
  }

  return parsed;
}

function buildDatasourceUrlOverride(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  // Dev-only pool tuning to reduce transient pool checkout timeouts during local concurrency.
  if (process.env.NODE_ENV === "production") return undefined;

  try {
    const parsed = new URL(databaseUrl);
    const poolTimeoutSeconds = getPositiveIntegerEnv(
      "PRISMA_POOL_TIMEOUT_SECONDS",
      DEFAULT_DEV_POOL_TIMEOUT_SECONDS,
    );
    const connectionLimit = getPositiveIntegerEnv(
      "PRISMA_CONNECTION_LIMIT",
      DEFAULT_DEV_CONNECTION_LIMIT,
    );

    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", String(poolTimeoutSeconds));
    }

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", String(connectionLimit));
    }

    return parsed.toString();
  } catch (error) {
    logger.warn(
      { err: error },
      "Unable to parse DATABASE_URL for Prisma pool tuning override",
    );
    return undefined;
  }
}

const prismaClientSingleton = () => {
  logger.debug("Generating fresh Prisma client from local generated directory");
  const datasourceUrl = buildDatasourceUrlOverride();
  const transactionOptions = {
    maxWait: getPositiveIntegerEnv(
      "PRISMA_TX_MAX_WAIT_MS",
      DEFAULT_TRANSACTION_MAX_WAIT_MS,
    ),
    timeout: getPositiveIntegerEnv(
      "PRISMA_TX_TIMEOUT_MS",
      DEFAULT_TRANSACTION_TIMEOUT_MS,
    ),
  };

  const baseClient = datasourceUrl
    ? new PrismaClient({ datasourceUrl, transactionOptions })
    : new PrismaClient({ transactionOptions });

  return baseClient.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const inputArgs = (args ?? {}) as { take?: number };
          const currentTake = inputArgs.take;

          if (typeof currentTake !== "number") {
            inputArgs.take = DEFAULT_FIND_MANY_TAKE;
          } else {
            inputArgs.take = Math.max(
              1,
              Math.min(currentTake, MAX_FIND_MANY_TAKE),
            );
          }

          if (
            typeof currentTake === "number" &&
            currentTake > MAX_FIND_MANY_TAKE
          ) {
            logger.warn(
              {
                model,
                requestedTake: currentTake,
                appliedTake: inputArgs.take,
              },
              "Capped findMany take to hard limit",
            );
          }

          if (
            process.env.DATABASE_URL?.includes("dummy") ||
            process.env.DATABASE_URL?.includes("localhost:5432")
          ) {
            logger.debug(
              { model, action: "findMany" },
              "Bypassing findMany for dummy database during build",
            );
            return [];
          }

          try {
            return await query(inputArgs);
          } catch (error: any) {
            if (
              error.name === "PrismaClientInitializationError" &&
              process.env.DATABASE_URL?.includes("dummy")
            ) {
              logger.warn(
                { model },
                "DB connection failed during build, returning empty array",
              );
              return [];
            }
            throw error;
          }
        },
        async findUnique({ model, args, query }) {
          if (process.env.DATABASE_URL?.includes("dummy")) return null;
          try {
            return await query(args);
          } catch (error: any) {
            if (
              error.name === "PrismaClientInitializationError" &&
              process.env.DATABASE_URL?.includes("dummy")
            ) {
              return null;
            }
            throw error;
          }
        },
        async findFirst({ model, args, query }) {
          if (process.env.DATABASE_URL?.includes("dummy")) return null;
          try {
            return await query(args);
          } catch (error: any) {
            if (
              error.name === "PrismaClientInitializationError" &&
              process.env.DATABASE_URL?.includes("dummy")
            ) {
              return null;
            }
            throw error;
          }
        },
        async count({ model, args, query }) {
          if (process.env.DATABASE_URL?.includes("dummy")) return 0;
          try {
            return await query(args);
          } catch (error: any) {
            if (
              error.name === "PrismaClientInitializationError" &&
              process.env.DATABASE_URL?.includes("dummy")
            ) {
              return 0;
            }
            throw error;
          }
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
