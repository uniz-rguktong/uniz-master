const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

function getPgPool(connString) {
  if (!connString) return null;
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
  pool.on("connect", client => {
    client.query(`SET search_path TO "${schema}", public`);
  });
  return pool;
}

const authDbUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
const authPool = getPgPool(authDbUrl);

async function run() {
  console.log("Starting Password Migration for O-IDs...");

  if (!authPool) {
    console.log("No AUTH_DATABASE_URL found.");
    return;
  }

  // Fetch only the ones that match 'O%' with numeric tail (O followed by numbers)
  // Or just fetch the 946 ones. To be precise, our previous script updated all RO to O.
  // Wait, some other 'O' users might already exist. We only want to update if we are sure.
  // We can just update all 'O...' users who have the role 'student'.
  const authRecordsRes = await authPool.query(`SELECT id, username FROM "AuthCredential" WHERE username LIKE 'O%' AND role = 'student'`);
  const authRecords = authRecordsRes.rows;
  console.log(`Found ${authRecords.length} 'O' students in uniz-auth`);
  
  let updated = 0;
  for (let i = 0; i < authRecords.length; i++) {
    const a = authRecords[i];
    // Hash new password: username@rguktong
    const newPassword = `${a.username}@rguktong`;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    try {
      await authPool.query(`UPDATE "AuthCredential" SET "passwordHash" = $1 WHERE id = $2`, [hashedPassword, a.id]);
      updated++;
      if (updated % 50 === 0) console.log(`Processed ${updated}/${authRecords.length}`);
    } catch (e) {
      console.warn(`Failed password update for ${a.username}`, e.message);
    }
  }
  
  console.log(`Password migration complete. Updated: ${updated} users.`);
}

run()
  .catch(console.error)
  .finally(async () => {
    if (authPool) await authPool.end();
  });
