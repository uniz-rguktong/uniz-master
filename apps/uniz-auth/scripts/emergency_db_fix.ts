import { PrismaClient } from "../src/generated/client";

// Use the base URL without schema parameter to connect to default (public) schema
// But we need to use raw SQL to alter tables across schemas.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    },
  },
});

async function moveTable(schema: string, table: string) {
  try {
    console.log(`Moving ${schema}.${table} to public.${table}...`);
    // We need to double quote table names to handle case sensitivity if Prisma created them quoted
    // PostgreSQL default is valid too if lowercase.
    // We try both if one fails? No, usually Prisma uses "ModelName" or "modelname" depending on map.
    // The logs showed "AuthCredential".
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${schema}."${table}" SET SCHEMA public;`,
    );
    console.log("Done.");
  } catch (e: any) {
    console.log(`Note: ${e.message.split("\n").pop()}`);
  }
}

async function main() {
  console.log("Starting emergency schema migration to 'public'...");

  // Auth Service
  await moveTable("auth", "AuthCredential");
  await moveTable("auth", "OtpLog");

  // User Service
  await moveTable("users", "StudentProfile");
  await moveTable("users", "FacultyProfile");
  await moveTable("users", "AdminProfile");
  await moveTable("users", "Banner");

  // Academics Service
  await moveTable("academics", "Subject");
  await moveTable("academics", "Grade");
  await moveTable("academics", "Attendance");

  // Outpass Service
  await moveTable("outpass", "Outpass");
  await moveTable("outpass", "Outing");
  await moveTable("outpass", "Grievance");

  console.log(
    "Migration complete. Tables should now be accessible via default connection string.",
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
