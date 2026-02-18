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
  console.log("--- 🌱 Seeding UniZ Local Database (via pg) ---");

  // Hashes
  const password123Hash = await bcrypt.hash("password123", 10);
  const webmasterHash = await bcrypt.hash("webmaster@uniz", 10);
  const caretakerHash = await bcrypt.hash("caretaker_male@uniz", 10);
  const caretakerFemaleHash = await bcrypt.hash("caretaker_female@uniz", 10);
  const wardenHash = await bcrypt.hash("warden_male@uniz", 10);
  const swoHash = await bcrypt.hash("swo@uniz", 10);
  const securityHash = await bcrypt.hash("security@uniz", 10);

  const studentId = "O210008";
  const studentEmail = "o210008@rguktong.ac.in";

  // --- GENERATE UUID ---
  const generateId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  let studentAuthId = generateId(); // Pre-generate ID for linking

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
          `
          INSERT INTO "auth_v2"."AuthCredential" ("id", "username", "passwordHash", "role", "createdAt", "updatedAt", "isDisabled")
          VALUES ($1, $2, $3, $4, NOW(), NOW(), false)
          ON CONFLICT ("username") DO UPDATE SET "passwordHash" = $3;
        `,
          [id, username, passwordHash, role],
        );
        return id;
      };

      // Create Users
      await createAuthUser(
        "O210008",
        password123Hash,
        "student",
        studentAuthId,
      );
      await createAuthUser(
        "webmaster",
        webmasterHash,
        "webmaster",
        generateId(),
      ); // UUID for webmaster
      await createAuthUser("caretaker_male", caretakerHash, "caretaker_male");
      await createAuthUser(
        "caretaker_female",
        caretakerFemaleHash,
        "caretaker_female",
      );
      await createAuthUser("warden_male", wardenHash, "warden_male");
      await createAuthUser("swo", swoHash, "swo");
      await createAuthUser("security", securityHash, "security");

      console.log("✅ All Auth credentials seeded.");
    } catch (err) {
      console.error("❌ Auth seed failed:", err.message);
    } finally {
      await pool.end();
    }
  }

  // --- USER SERVICE SEED ---
  if (process.env.USER_DATABASE_URL) {
    console.log("Seeding User Service...");
    const pool = getPool(process.env.USER_DATABASE_URL);
    try {
      const exists = await pool.query(
        `SELECT 1 FROM "user_v2"."StudentProfile" WHERE "username" = $1`,
        [studentId],
      );
      if (exists.rowCount === 0) {
        // Use the SAME UUID generated for Auth
        await pool.query(
          `
          INSERT INTO "user_v2"."StudentProfile" 
          ("id", "username", "name", "email", "branch", "year", "section", "roomno", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());
        `,
          [
            studentAuthId, // Use consistent UUID
            studentId,
            "SABER Desu",
            studentEmail,
            "CSE",
            "E4",
            "A",
            "302",
          ],
        );
      }
      console.log("✅ Student profile seeded.");
    } catch (err) {
      console.error("❌ User seed failed:", err.message);
    } finally {
      await pool.end();
    }
  }

  console.log("--- 🎉 Seeding Complete ---");
}

seed().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
