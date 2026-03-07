import { PrismaClient } from "@prisma/client";
import axios from "axios";

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

const SCRAPER_URL = "https://college-scraped.vercel.app/api/departments";

async function seedFaculty() {
  console.log("🚀 Starting Faculty Data Seeding...");

  for (const dept of DEPARTMENTS) {
    try {
      console.log(`\n📂 Fetching data for Department: ${dept}...`);
      const response = await axios.get(`${SCRAPER_URL}/${dept}?deep=true`, {
        timeout: 60000,
      });

      if (!response.data || !response.data.faculties) {
        console.warn(`⚠️ No data found for department: ${dept}`);
        continue;
      }

      const faculties = response.data.faculties;
      console.log(`✅ Found ${faculties.length} faculty members in ${dept}.`);

      for (const f of faculties) {
        if (!f.email) {
          console.warn(`⏭️ Skipping ${f.name} - No email found.`);
          continue;
        }

        // Extract username from email (e.g., ncs@rguktong.ac.in -> NCS)
        const username = f.email.split("@")[0].toUpperCase();

        // Clean name (remove degree suffix if present in name string like "Mallikarjuna NandiM.E")
        let cleanName = f.name
          .replace(
            /(M\.?Tech|M\.?E|PhD|M\.?Sc|B\.?Tech|B\.?E|Ph\.?D|,\s?)/gi,
            "",
          )
          .trim();

        // Basic designation if not available
        const designation = f.designation || "Faculty";

        console.log(`   👤 Seeding: ${username} (${cleanName})`);

        await prisma.facultyProfile.upsert({
          where: { username },
          update: {
            name: cleanName,
            email: f.email,
            department: dept,
            designation: designation,
            profileUrl: f.photo || "",
            bio: f.bio || {},
            role: "teacher", // Default role
          },
          create: {
            username: username,
            name: cleanName,
            email: f.email,
            department: dept,
            designation: designation,
            profileUrl: f.photo || "",
            bio: f.bio || {},
            role: "teacher",
          },
        });
      }
    } catch (error: any) {
      console.error(`❌ Error seeding department ${dept}:`, error.message);
    }
  }

  console.log("\n✨ Faculty Seeding Completed!");
  await prisma.$disconnect();
}

seedFaculty().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
