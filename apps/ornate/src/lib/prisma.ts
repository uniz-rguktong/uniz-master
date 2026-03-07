import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const isBuildTime =
    process.env.DATABASE_URL?.includes("dummy") || !process.env.DATABASE_URL;

  const pool = new Pool({
    connectionString: isBuildTime
      ? "postgresql://dummy:dummy@localhost:5432/dummy"
      : process.env.DATABASE_URL!,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
