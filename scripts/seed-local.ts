import { Client } from "pg";
import bcrypt from "bcrypt";

// Seeder logic using raw SQL
const dbConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/uniz_db?sslmode=disable",
};

async function seed() {
  console.log("🌱 Starting Deep Seeding (Local DB - Universal Version)...");
  const client = new Client(dbConfig);
  const seededCreds: { username: string; role: string; desc: string }[] = [];

  try {
    await client.connect();
    const hash = await bcrypt.hash("password123", 10);

    // --- CLEANUP (Fresh Start for Local Dev) ---
    console.log("- Cleaning up existing data...");
    await client.query('TRUNCATE TABLE auth_v2."AuthCredential" CASCADE;');
    await client.query('TRUNCATE TABLE user_v2."AdminProfile" CASCADE;');
    await client.query('TRUNCATE TABLE user_v2."FacultyProfile" CASCADE;');
    await client.query('TRUNCATE TABLE user_v2."StudentProfile" CASCADE;');
    await client.query('TRUNCATE TABLE user_v2."Banner" CASCADE;');
    await client.query('TRUNCATE TABLE user_v2."PublicNotification" CASCADE;');

    const upsertUser = async (
      id: string,
      username: string,
      role: string,
      desc: string,
      profileType: "Admin" | "Faculty" | "Student",
      extra: any = {},
    ) => {
      // 1. Auth Credential
      await client.query(
        `
        INSERT INTO auth_v2."AuthCredential" (id, username, "passwordHash", role, "updatedAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          username = EXCLUDED.username,
          "passwordHash" = EXCLUDED."passwordHash",
          role = EXCLUDED.role,
          "updatedAt" = NOW();
      `,
        [id, username, hash, role],
      );

      // 2. Profile
      if (profileType === "Admin") {
        await client.query(
          `
          INSERT INTO user_v2."AdminProfile" (id, username, email, name, role, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            username = EXCLUDED.username,
            name = EXCLUDED.name, 
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            "updatedAt" = NOW();
        `,
          [
            id,
            username,
            extra.email || `${username}@rguktong.ac.in`,
            extra.name || username.toUpperCase(),
            role,
          ],
        );
      } else if (profileType === "Faculty") {
        await client.query(
          `
          INSERT INTO user_v2."FacultyProfile" (id, username, name, email, department, designation, role, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            department = EXCLUDED.department, 
            designation = EXCLUDED.designation,
            role = EXCLUDED.role,
            "updatedAt" = NOW();
        `,
          [
            id,
            username,
            extra.name || `Dr. ${username.toUpperCase()}`,
            extra.email || `${username}@rguktong.ac.in`,
            extra.dept || "GENERAL",
            extra.designation || "Faculty",
            role,
          ],
        );
      } else if (profileType === "Student") {
        await client.query(
          `
          INSERT INTO user_v2."StudentProfile" (id, username, name, email, branch, year, semester, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            branch = EXCLUDED.branch, 
            year = EXCLUDED.year,
            semester = EXCLUDED.semester,
            "updatedAt" = NOW();
        `,
          [
            id,
            username,
            extra.name || `Student ${username.toUpperCase()}`,
            extra.email || `${username}@rguktong.ac.in`,
            extra.branch || "CSE",
            "E4",
            "Sem-1",
          ],
        );
      }

      seededCreds.push({ username, role, desc });
    };

    // --- SEEDING CORE ROLES ---
    console.log("- Seeding Core Roles...");
    await upsertUser(
      "webmaster-id",
      "webmaster",
      "webmaster",
      "Main System Administrator",
      "Admin",
      { email: "webadmin@rguktong.ac.in", name: "UniZ Webmaster" },
    );
    await upsertUser(
      "dean-id",
      "dean",
      "dean",
      "Dean of Academic Affairs",
      "Admin",
      { email: "dean.ac@rguktong.ac.in", name: "Dean Academics" },
    );
    await upsertUser(
      "director-id",
      "director",
      "director",
      "Campus Director",
      "Admin",
      { email: "director@rguktong.ac.in", name: "Campus Director" },
    );
    await upsertUser(
      "swo-id",
      "swo_office",
      "swo",
      "Student Welfare Officer",
      "Admin",
      { email: "swo@rguktong.ac.in", name: "SWO Chief" },
    );

    // --- SEEDING HODs (One per branch) ---
    console.log("- Seeding Department Heads...");
    const branches = ["CSE", "ECE", "ME", "CE", "EEE", "MME", "CHEM"];
    for (const dept of branches) {
      await upsertUser(
        `hod-${dept.toLowerCase()}-id`,
        `hod_${dept.toLowerCase()}`,
        "hod",
        `${dept} Head of Department`,
        "Faculty",
        { dept, designation: "Head of Department" },
      );
    }

    // --- SEEDING STUDENTS (O21 Batch - Mandatory IDs) ---
    console.log("- Seeding O21 Sample Students...");
    const o21Students = [
      { id: "O210001", branch: "CSE", name: "CSE Senior" },
      { id: "O210002", branch: "ECE", name: "ECE Senior" },
      { id: "O210003", branch: "ME", name: "ME Senior" },
      { id: "O210004", branch: "CE", name: "CE Senior" },
      { id: "O210005", branch: "EEE", name: "EEE Senior" },
      { id: "O210006", branch: "MME", name: "MME Senior" },
      { id: "O210008", branch: "CSE", name: "Target Student (O210008)" },
      { id: "O210009", branch: "CIVIL", name: "O21 Senior" },
      { id: "O210010", branch: "CSE", name: "O21 Senior" },
    ];

    for (const student of o21Students) {
      await upsertUser(
        `${student.id}-id`,
        student.id,
        "student",
        `${student.branch} student (O21)`,
        "Student",
        { branch: student.branch, name: student.name },
      );
    }

    // --- SEEDING CMS CONTENT ---
    console.log("- Seeding CMS Assets...");
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
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = NOW();
      `,
        [id, title, text, imageUrl],
      );
    };

    await upsertBanner(
      "banner-1",
      "Modern Digital Library",
      "Access over 50,000 journals.",
      "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=2070",
    );
    await upsertBanner(
      "banner-2",
      "Academic Excellence",
      "Track results with Warp speed.",
      "https://images.unsplash.com/photo-1523050853064-06c57f642461?auto=format&fit=crop&q=80&w=2070",
    );
    await upsertBanner(
      "banner-3",
      "Campus Collaboration",
      "Connect with clubs easily.",
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=2070",
    );

    await client.query(
      `
      INSERT INTO user_v2."PublicNotification" (id, title, content, link, "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, "updatedAt" = NOW();
    `,
      [
        "notif-1",
        "Admission Cycle 2026",
        "2026 UG Admissions open.",
        "https://rguktong.ac.in/admissions",
      ],
    );

    console.log("\n✅ Seeding Complete!\n");
    console.log(
      "--------------------------------------------------------------------------",
    );
    console.log("🔑 LOCAL DEVELOPMENT CREDENTIALS (PASSWORD: password123)");
    console.log(
      "--------------------------------------------------------------------------",
    );
    console.table(seededCreds);
    console.log(
      "--------------------------------------------------------------------------",
    );
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
