import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  "CSE",
  "CIVIL",
  "ECE",
  "EEE",
  "ME",
  "MATHEMATICS",
  "PHYSICS",
  "CHEMISTRY",
  "IT",
  "BIOLOGY",
  "ENGLISH",
  "LIB",
  "MANAGEMENT",
  "PED",
  "TELUGU",
  "YOGA",
];

async function seed() {
  console.log("🚀 Starting Faculty Seed...");

  for (const dept of DEPARTMENTS) {
    try {
      console.log(`📡 Fetching data for department: ${dept}...`);
      const response = await axios.get(
        `https://college-scraped.vercel.app/api/departments/${dept}?deep=true`,
      );
      const data = response.data;

      if (data && data.faculties) {
        console.log(
          `✅ Received ${data.faculties.length} faculties for ${dept}.`,
        );

        for (const faculty of data.faculties) {
          // Basic email validation to avoid seeding invalid data if any
          if (!faculty.email || !faculty.email.includes("@")) {
            console.warn(
              `⚠️ Skipping faculty ${faculty.name} due to missing or invalid email.`,
            );
            continue;
          }

          await prisma.faculty.upsert({
            where: { email: faculty.email },
            update: {
              name: faculty.name,
              photo: faculty.photo,
              department: dept,
              bio: faculty.bio,
            },
            create: {
              name: faculty.name,
              email: faculty.email,
              photo: faculty.photo,
              department: dept,
              bio: faculty.bio,
              role: "FACULTY",
            },
          });
        }
      }
    } catch (error: any) {
      console.error(`❌ Error seeding ${dept}:`, error.message);
    }
  }

  console.log("🏁 Faculty Seed Completed!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
