import { PrismaClient } from "@/lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

const prismaClientSingleton = () => {
    const dbUrl = process.env.DATABASE_URL;
    const isBuildPhase = dbUrl === "base" || !dbUrl;

    if (!globalForPrisma.pool) {
        console.log('[Prisma] Initializing new PG connection pool');
        
        // If we are in build phase and URL is 'base', use a dummy URL to prevent Pool crash initialization
        // though Pool only crashes on connect. 
        const effectiveUrl = (dbUrl === "base" || !dbUrl) 
            ? "postgresql://postgres:postgres@localhost:5432/postgres" 
            : dbUrl;

        globalForPrisma.pool = new Pool({
            connectionString: effectiveUrl,
            max: 4,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000, // Shorter timeout for build safety
            allowExitOnIdle: true,
        });

        globalForPrisma.pool.on('error', (err) => {
            if (!isBuildPhase) console.error('Unexpected error on idle client', err);
        });
    }

    const adapter = new PrismaPg(globalForPrisma.pool as Pool);
    
    const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // --- Build Safety Extension ---
    // This catches database connection errors (like the "base" error on VPS build)
    // and returns empty data instead of crashing the Next.js prerendering.
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    try {
                        return await query(args);
                    } catch (err: any) {
                        // If it's a connection error and we're likely in a build/misconfigured state
                        const isConnectionError = err.message?.includes('Can\'t reach database') || 
                                              err.code === 'P1001' || 
                                              dbUrl === 'base';
                        
                        if (isConnectionError) {
                            console.warn(`[Prisma Build Safety] Suppressing DB error for ${model}.${operation} (URL: ${dbUrl})`);
                            
                            // Return safe defaults for read operations to allow build to continue
                            if (operation.startsWith('findMany')) return [];
                            if (operation.startsWith('find')) return null;
                            if (operation.startsWith('count')) return 0;
                            if (operation.startsWith('aggregate')) return {};
                            if (operation.startsWith('groupBy')) return [];
                        }
                        
                        throw err;
                    }
                },
            },
        },
    });
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = (prisma as any);
}
