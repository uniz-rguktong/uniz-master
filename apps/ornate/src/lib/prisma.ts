import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient() {
    if (!globalForPrisma.pool) {
        console.log('[Prisma] Initializing new PG connection pool');
        // When using Supabase pooler (pgbouncer) in Session mode or Transaction mode,
        // we should configure the generic pg Pool properly to not overwhelm the limits.
        // The connection string itself handles `?pgbouncer=true&connection_limit=X`
        globalForPrisma.pool = new Pool({
            connectionString: process.env.DATABASE_URL!,
            max: 4, // Increased from 1 to support typical Promise.all parallel fetches
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 60000,
            allowExitOnIdle: true,
        });

        globalForPrisma.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    } else {
        console.log('[Prisma] Reusing existing PG connection pool');
    }

    const adapter = new PrismaPg(globalForPrisma.pool as Pool);
    console.log('[Prisma] Creating new PrismaClient with adapter');
    
    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
