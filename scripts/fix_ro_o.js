const { Pool } = require("pg");

function getPgPool(connString) {
  if (!connString) return null;
  // Parse out the ?schema=xxx part
  let schema = "public";
  let cleanedDbUrl = connString;
  const parts = connString.split("?");
  if (parts.length > 1) {
    cleanedDbUrl = parts[0];
    const query = new URLSearchParams(parts[1]);
    if (query.has("schema")) {
      schema = query.get("schema");
    }
  }

  const pool = new Pool({ connectionString: cleanedDbUrl });

  // Use the schema
  pool.on("connect", client => {
    client.query(`SET search_path TO "${schema}", public`);
  });

  return pool;
}

const userDbUrl = process.env.USER_DATABASE_URL || process.env.DATABASE_URL;
const authDbUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
const acadDbUrl = process.env.ACADEMICS_DATABASE_URL || process.env.DATABASE_URL;

console.log("Using DB URLs:");
console.log("USER:", userDbUrl ? "Set" : "Not Set");
console.log("AUTH:", authDbUrl ? "Set" : "Not Set");
console.log("ACAD:", acadDbUrl ? "Set" : "Not Set");

const userPool = getPgPool(userDbUrl);
const authPool = getPgPool(authDbUrl);
const acadPool = getPgPool(acadDbUrl);

async function run() {
  console.log("Starting RO -> O Migration using pg driver...");

  // 1. UPDATE USER PROFILE
  console.log("\n[1/3] Updating uniz-user (StudentProfile)...");
  if (userPool) {
    const unizUsersRes = await userPool.query(`SELECT id, username, email FROM "StudentProfile" WHERE username LIKE 'RO%'`);
    const unizUsers = unizUsersRes.rows;
    console.log(`Found ${unizUsers.length} in uniz-user`);

    let userMigrations = 0;
    for (const u of unizUsers) {
      const newUsername = "O" + u.username.slice(2);
      const newEmail = u.email.toLowerCase().startsWith("ro") ? newUsername.toLowerCase() + "@rguktong.ac.in" : u.email;
      try {
        await userPool.query(
          `UPDATE "StudentProfile" SET username = $1, email = $2 WHERE id = $3`,
          [newUsername, newEmail, u.id]
        );
        userMigrations++;
      } catch (e) {
        console.warn(`Failed uniz-user update for ${u.username}`, e.message);
      }
    }
    console.log(`uniz-user updated: ${userMigrations}`);
  }

  // 2. UPDATE AUTH
  console.log("\n[2/3] Updating uniz-auth (AuthCredential)...");
  if (authPool) {
    const authRecordsRes = await authPool.query(`SELECT id, username FROM "AuthCredential" WHERE username LIKE 'RO%'`);
    const authRecords = authRecordsRes.rows;
    console.log(`Found ${authRecords.length} in uniz-auth`);
    
    let authMigrations = 0;
    for (const a of authRecords) {
      const newUsername = "O" + a.username.slice(2);
      try {
        await authPool.query(`UPDATE "AuthCredential" SET username = $1 WHERE id = $2`, [newUsername, a.id]);
        authMigrations++;
      } catch (e) {
        console.warn(`Failed uniz-auth update for ${a.username}`, e.message);
      }
    }
    console.log(`uniz-auth updated: ${authMigrations}`);
  }

  // 3. UPDATE ACADEMICS
  console.log("\n[3/3] Updating uniz-academics (Grades, Attendance, Registration, SeatingArrangement)...");
  if (acadPool) {
    const tables = ["Grade", "Attendance", "Registration", "SeatingArrangement"];

    for (const t of tables) {
      let acadMigrations = 0;
      try {
        const recordsRes = await acadPool.query(`SELECT id, "studentId" FROM "${t}" WHERE "studentId" LIKE 'RO%'`);
        const records = recordsRes.rows;
        console.log(`Found ${records.length} in ${t}`);

        for (const r of records) {
          const newStudentId = "O" + r.studentId.slice(2);
          try {
            await acadPool.query(`UPDATE "${t}" SET "studentId" = $1 WHERE id = $2`, [newStudentId, r.id]);
            acadMigrations++;
          } catch (e) {
            console.warn(`Failed ${t} update for ${r.studentId}`, e.message);
          }
        }
      } catch (e) {
        console.warn(`Error querying/updating ${t}:`, e.message);
      }
      console.log(`${t} updated: ${acadMigrations}`);
    }
  }

  console.log("\nMigration completed successfully.");
}

run()
  .catch(console.error)
  .finally(async () => {
    if (userPool) await userPool.end();
    if (authPool) await authPool.end();
    if (acadPool) await acadPool.end();
  });
