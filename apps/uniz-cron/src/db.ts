import { PrismaClient } from "@prisma/client";

// Generate client for other services using this schema?
// Actually uniz-cron-service depends on shared logic, usually it needs its own schema copy or imports from another package.
// For now let's assume it has its own prisma schema which is a copy/superset of others or connects to same db.
// Since we used isolated schemas (auth, users, outpass), Cron needs access to ALL of them.
// So we need specific clients or a multi-schema setup.

// Vercel Serverless requires we instantiate Prisma outside the handler for connection pooling.
const prisma = new PrismaClient();
export default prisma;
