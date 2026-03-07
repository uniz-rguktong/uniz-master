const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Helper to get pool for a specific connection URL
// Automatically swaps 'uniz-postgres' with 'localhost' if running from host
const getPool = (connectionString) => {
  const hostUrl = connectionString.replace("uniz-postgres", "localhost");
  return new Pool({ connectionString: hostUrl });
};

async function seed() {
  console.log("--- Seeding UniZ Local Database (via pg) ---");

  // Hashes
  const password123Hash = await bcrypt.hash("password123", 10);
  const webmasterHash = await bcrypt.hash("webmaster@uniz", 10);
  const caretakerHash = await bcrypt.hash("caretaker_male@uniz", 10);
  const caretakerFemaleHash = await bcrypt.hash("caretaker_female@uniz", 10);
  const wardenHash = await bcrypt.hash("warden_male@uniz", 10);
  const swoHash = await bcrypt.hash("swo@uniz", 10);
  const securityHash = await bcrypt.hash("security@uniz", 10);
  const deanHash = await bcrypt.hash("dean@uniz", 10);
  const directorHash = await bcrypt.hash("director@uniz", 10);

  // Students to seed
  const students = [
    {
      id: "O210008",
      email: "o210008@rguktong.ac.in",
      name: "Student O210008",
      branch: "CSE",
      year: "E2",
      section: "A",
      room: "I-207",
    },
    {
      id: "O210829",
      email: "o210829@rguktong.ac.in",
      name: "Student O210829",
      branch: "CSE",
      year: "E2",
      section: "A",
      room: "I-302",
    },
    {
      id: "O210329",
      email: "o210329@rguktong.ac.in",
      name: "Student O210329",
      branch: "CSE",
      year: "E2",
      section: "B",
      room: "I-105",
    },
  ];

  const generateId = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  // --- AUTH SERVICE SEED ---
  if (process.env.AUTH_DATABASE_URL) {
    console.log("Seeding Auth Service...");
    const pool = getPool(process.env.AUTH_DATABASE_URL);
    try {
      const createAuthUser = async (
        username,
        passwordHash,
        role,
        explicitId = null,
      ) => {
        const id = explicitId || generateId();
        await pool.query(
          `INSERT INTO "auth_v2"."AuthCredential" ("id","username","passwordHash","role","createdAt","updatedAt","isDisabled")
           VALUES ($1,$2,$3,$4,NOW(),NOW(),false)
           ON CONFLICT ("username") DO UPDATE SET "passwordHash"=$3;`,
          [id, username, passwordHash, role],
        );
        return id;
      };

      // Admins
      await createAuthUser("webmaster", webmasterHash, "webmaster");
      await createAuthUser("caretaker_male", caretakerHash, "caretaker_male");
      await createAuthUser(
        "caretaker_female",
        caretakerFemaleHash,
        "caretaker_female",
      );
      await createAuthUser("warden_male", wardenHash, "warden_male");
      await createAuthUser("swo", swoHash, "swo");
      await createAuthUser("security", securityHash, "security");
      await createAuthUser("dean", deanHash, "dean");
      await createAuthUser("director", directorHash, "director");
      console.log("  Admin credentials seeded.");

      // Students — store IDs for user service linking
      for (const s of students) {
        s.authId = await createAuthUser(
          s.id.toUpperCase(),
          password123Hash,
          "student",
        );
      }
      console.log("  Student credentials seeded.");
    } catch (err) {
      console.error("Auth seed failed:", err.message);
    } finally {
      await pool.end();
    }
  }

  // --- USER SERVICE SEED ---
  if (process.env.USER_DATABASE_URL) {
    console.log("Seeding User Service...");
    const pool = getPool(process.env.USER_DATABASE_URL);
    try {
      for (const s of students) {
        const exists = await pool.query(
          `SELECT 1 FROM "user_v2"."StudentProfile" WHERE "username"=$1`,
          [s.id.toUpperCase()],
        );
        if (exists.rowCount === 0) {
          await pool.query(
            `INSERT INTO "user_v2"."StudentProfile"
             ("id","username","name","email","branch","year","section","roomno","createdAt","updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW());`,
            [
              s.authId || generateId(),
              s.id.toUpperCase(),
              s.name,
              s.email,
              s.branch,
              s.year,
              s.section,
              s.room,
            ],
          );
          console.log(`  Profile seeded: ${s.id}`);
        } else {
          console.log(`  Profile already exists: ${s.id}`);
        }
      }
    } catch (err) {
      console.error("User seed failed:", err.message);
    } finally {
      await pool.end();
    }
  }

  console.log("--- Seeding Complete ---");
}

seed().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
