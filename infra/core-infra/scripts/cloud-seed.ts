import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// This script should be run with DATABASE_URL for each service schema
// Or one script that handles all if we use multiple prisma clients.
// For simplicity, let's make a generic seeder.

async function main() {
  const authPrisma = new PrismaClient({
    datasources: { db: { url: process.env.AUTH_DATABASE_URL } },
  });
  const userPrisma = new PrismaClient({
    datasources: { db: { url: process.env.USER_DATABASE_URL } },
  });

  console.log("--- Seeding UniZ Cloud (Neon) ---");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Student
  const studentUsername = "S2025001";
  await authPrisma.authCredential.upsert({
    where: { username: studentUsername },
    update: {},
    create: {
      username: studentUsername,
      passwordHash,
      role: "student",
      email: "student@uniz.edu",
    },
  });
  await userPrisma.studentProfile.upsert({
    where: { username: studentUsername },
    update: {},
    create: {
      id: studentUsername,
      username: studentUsername,
      name: "Sample Student",
      email: "student@uniz.edu",
      branch: "CSE",
      year: "E4",
      section: "A",
      roomno: "302",
    },
  });

  // 2. Create Admin
  const adminUsername = "admin_uniz";
  await authPrisma.authCredential.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
      role: "webmaster",
      email: "admin@uniz.edu",
    },
  });

  console.log('Seeding complete! You can login with password "password123"');
}

main().catch(console.error);
