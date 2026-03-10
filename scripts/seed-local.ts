import { Client } from "pg";
import bcrypt from "bcrypt";

// Seeder logic using raw SQL
const dbConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/uniz_db?sslmode=disable",
};

async function seed() {
  console.log("🌱 Starting Seeding (Local DB)...");
  const client = new Client(dbConfig);

  try {
    await client.connect();
    const hash = await bcrypt.hash("password123", 10);

    // 1. Seed Auth Credentials (Into auth_v2 schema)
    console.log("- Seeding Auth Credentials...");
    await client.query(
      `
      INSERT INTO auth_v2."AuthCredential" (id, username, "passwordHash", role, "updatedAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (username) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash";
    `,
      ["webmaster-id", "webmaster", hash, "webmaster"],
    );

    await client.query(
      `
      INSERT INTO auth_v2."AuthCredential" (id, username, "passwordHash", role, "updatedAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (username) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash";
    `,
      ["hod-cse-id", "hod_cse", hash, "hod"],
    );

    // 2. Seed User Profiles (Into user_v2 schema)
    console.log("- Seeding User Profiles...");

    // Webmaster Profile (Using columns verified via psql description)
    await client.query(
      `
      INSERT INTO user_v2."AdminProfile" (id, username, email, role, "updatedAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (username) DO NOTHING;
    `,
      ["webmaster-id", "webmaster", "webadmin@rguktong.ac.in", "webmaster"],
    );

    // Faculty Profile
    await client.query(
      `
      INSERT INTO user_v2."FacultyProfile" (id, username, name, email, department, designation, role, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (username) DO NOTHING;
    `,
      [
        "hod-cse-id",
        "hod_cse",
        "Dr. CSE HOD",
        "hod.cse@rguktong.ac.in",
        "CSE",
        "Head of Department",
        "hod",
      ],
    );

    // 3. Seed CMS Content (Banners & Notifications into user_v2)
    console.log("- Seeding Landing Page Content...");
    await client.query(
      `
      INSERT INTO user_v2."Banner" (id, title, text, "imageUrl", "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `,
      [
        "banner-1",
        "UniZ v2.0 is now live",
        "Experience the next generation of campus management with our high-speed microservice architecture.",
        "https://images.unsplash.com/photo-1523050853064-06c57f642461?q=80&w=2070",
        true,
      ],
    );

    await client.query(
      `
      INSERT INTO user_v2."PublicNotification" (id, title, content, link, "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `,
      [
        "notif-1",
        "Admission Cycle 2026",
        "The 2026 undergraduate admission cycle is now open for all departments.",
        "https://rguktong.ac.in/admissions",
        true,
      ],
    );

    console.log("✅ Seeding Complete!");
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
