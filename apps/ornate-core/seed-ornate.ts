import { PrismaClient } from "./src/lib/generated/client";
import * as fs from "fs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "",
    },
  },
});

async function main() {
  const rawData = fs.readFileSync("seed-data-for-ornate-core.json", "utf8");
  const admins = JSON.parse(rawData);

  console.log(`Seeding ${admins.length} admins to DB...`);

  for (const admin of admins) {
    // Prepare the payload according to the model
    // remove unwanted fields before insertion like idx
    const { idx, ...adminPayload } = admin;

    if (adminPayload.createdAt) {
      adminPayload.createdAt = new Date(adminPayload.createdAt).toISOString();
    }
    if (adminPayload.coordinatorTokenExpiry) {
      adminPayload.coordinatorTokenExpiry = new Date(
        adminPayload.coordinatorTokenExpiry,
      ).toISOString();
    }
    if (adminPayload.preferences === "null") {
      adminPayload.preferences = null;
    } else if (typeof adminPayload.preferences === "string") {
      try {
        adminPayload.preferences = JSON.parse(adminPayload.preferences);
      } catch (e) {}
    }
    if (adminPayload.notificationSettings === "null") {
      adminPayload.notificationSettings = null;
    } else if (typeof adminPayload.notificationSettings === "string") {
      try {
        adminPayload.notificationSettings = JSON.parse(
          adminPayload.notificationSettings,
        );
      } catch (e) {}
    }

    try {
      await prisma.admin.upsert({
        where: { email: adminPayload.email },
        update: adminPayload,
        create: adminPayload,
      });
      console.log(`Seeded admin: ${adminPayload.email}`);
    } catch (error) {
      console.error(`Failed to seed admin ${adminPayload.email}:`, error);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
