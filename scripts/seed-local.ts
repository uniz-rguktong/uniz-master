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

    console.log("✅ Seeding Complete!");
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
