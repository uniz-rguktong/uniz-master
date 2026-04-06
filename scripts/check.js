const { Pool } = require("pg");

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

const userDbUrl = process.env.USER_DATABASE_URL || process.env.DATABASE_URL;
const authDbUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

const userPool = getPgPool(userDbUrl);
const authPool = getPgPool(authDbUrl);

async function run() {
  const targetId = "O200822";
  const oldId = "RO200822";
  
  if (userPool) {
    console.log(`Checking uniz-user StudentProfile for ${targetId} and ${oldId}...`);
    const resNew = await userPool.query(`SELECT id, username, name, email FROM "StudentProfile" WHERE username = $1`, [targetId]);
    const resOld = await userPool.query(`SELECT id, username, name, email FROM "StudentProfile" WHERE username = $1`, [oldId]);
    console.log(`Found ${resNew.rows.length} records for ${targetId} in uniz-user:`, resNew.rows);
    console.log(`Found ${resOld.rows.length} records for ${oldId} in uniz-user:`, resOld.rows);
  }

  if (authPool) {
    console.log(`\nChecking uniz-auth AuthCredential for ${targetId} and ${oldId}...`);
    const resNew = await authPool.query(`SELECT id, username, role FROM "AuthCredential" WHERE username = $1`, [targetId]);
    const resOld = await authPool.query(`SELECT id, username, role FROM "AuthCredential" WHERE username = $1`, [oldId]);
    console.log(`Found ${resNew.rows.length} records for ${targetId} in uniz-auth:`, resNew.rows);
    console.log(`Found ${resOld.rows.length} records for ${oldId} in uniz-auth:`, resOld.rows);
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    if (userPool) await userPool.end();
    if (authPool) await authPool.end();
  });
