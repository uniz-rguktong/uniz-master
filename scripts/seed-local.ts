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

    // 3. Seed CMS Content (Banners & Notifications)
    console.log("- Seeding Landing Page Content (High-Quality Assets)...");

    // Banner Logic
    const upsertBanner = async (
      id: string,
      title: string,
      text: string,
      imageUrl: string,
    ) => {
      await client.query(
        `
        INSERT INTO user_v2."Banner" (id, title, text, "imageUrl", "isVisible", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title,
          text = EXCLUDED.text,
          "imageUrl" = EXCLUDED."imageUrl",
          "updatedAt" = NOW();
      `,
        [id, title, text, imageUrl],
      );
    };

    await upsertBanner(
      "banner-1",
      "Modern Digital Library",
      "Access over 50,000 journals and books from anywhere on campus.",
      "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=2070",
    );
    await upsertBanner(
      "banner-2",
      "Academic Excellence",
      "Track your results and stay ahead with UniZ high-speed analytics.",
      "https://images.unsplash.com/photo-1523050853064-06c57f642461?auto=format&fit=crop&q=80&w=2070",
    );
    await upsertBanner(
      "banner-3",
      "Campus Collaboration",
      "Connect with clubs and manage events through the integrated student hub.",
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=2070",
    );

    await client.query(
      `
      INSERT INTO user_v2."PublicNotification" (id, title, content, link, "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        link = EXCLUDED.link,
        "updatedAt" = NOW();
    `,
      [
        "notif-1",
        "Admission Cycle 2026",
        "The 2026 undergraduate admission cycle is now open for all departments.",
        "https://rguktong.ac.in/admissions",
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
