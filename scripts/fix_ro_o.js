const { PrismaClient: UserClient } = require("../apps/uniz-user/node_modules/@prisma/client");
const { PrismaClient: AuthClient } = require("../apps/uniz-auth/node_modules/@prisma/client");
const { PrismaClient: AcadClient } = require("../apps/uniz-academics/node_modules/@prisma/client");

// Note: Ensure USER_DATABASE_URL, AUTH_DATABASE_URL, ACADEMICS_DATABASE_URL are set.
// On VPS, they are usually exported in the environment.

const userDbUrl = process.env.USER_DATABASE_URL || process.env.DATABASE_URL;
const authDbUrl = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;
const acadDbUrl = process.env.ACADEMICS_DATABASE_URL || process.env.DATABASE_URL;

console.log("Using DB URLs:");
console.log("USER:", userDbUrl ? "Set" : "Not Set");
console.log("AUTH:", authDbUrl ? "Set" : "Not Set");
console.log("ACAD:", acadDbUrl ? "Set" : "Not Set");

const userPrisma = new UserClient({ datasources: { db: { url: userDbUrl } } });
const authPrisma = new AuthClient({ datasources: { db: { url: authDbUrl } } });
const acadPrisma = new AcadClient({ datasources: { db: { url: acadDbUrl } } });

async function run() {
  console.log("Starting RO -> O Migration...");

  // 1. UPDATE USER PROFILE
  console.log("\n[1/3] Updating uniz-user (StudentProfile)...");
  const unizUsers = await userPrisma.studentProfile.findMany({
    where: { username: { startsWith: "RO" } },
  });
  console.log(`Found ${unizUsers.length} in uniz-user`);

  let userMigrations = 0;
  for (const u of unizUsers) {
    const newUsername = "O" + u.username.slice(2);
    const newEmail = u.email.toLowerCase().startsWith("ro") ? newUsername.toLowerCase() + "@rguktong.ac.in" : u.email;
    try {
      await userPrisma.studentProfile.update({
        where: { id: u.id },
        data: { username: newUsername, email: newEmail },
      });
      userMigrations++;
    } catch (e) {
      console.warn(`Failed uniz-user update for ${u.username}`, e.message);
    }
  }
  console.log(`uniz-user updated: ${userMigrations}`);

  // 2. UPDATE AUTH
  console.log("\n[2/3] Updating uniz-auth (AuthCredential)...");
  const authRecords = await authPrisma.authCredential.findMany({
    where: { username: { startsWith: "RO" } },
  });
  console.log(`Found ${authRecords.length} in uniz-auth`);
  
  let authMigrations = 0;
  for (const a of authRecords) {
    const newUsername = "O" + a.username.slice(2);
    try {
      await authPrisma.authCredential.update({
        where: { id: a.id },
        data: { username: newUsername },
      });
      authMigrations++;
    } catch (e) {
      console.warn(`Failed uniz-auth update for ${a.username}`, e.message);
    }
  }
  console.log(`uniz-auth updated: ${authMigrations}`);

  // 3. UPDATE ACADEMICS
  console.log("\n[3/3] Updating uniz-academics (Grades, Attendance, Registration, Seating)...");
  
  const tables = [
    { name: "Grade", model: acadPrisma.grade },
    { name: "Attendance", model: acadPrisma.attendance },
    { name: "Registration", model: acadPrisma.registration },
    { name: "SeatingArrangement", model: acadPrisma.seatingArrangement },
  ];

  for (const t of tables) {
    const records = await t.model.findMany({
      where: { studentId: { startsWith: "RO" } },
    });
    console.log(`Found ${records.length} in ${t.name}`);

    let acadMigrations = 0;
    for (const r of records) {
      const newStudentId = "O" + r.studentId.slice(2);
      try {
        await t.model.update({
          where: { id: r.id },
          data: { studentId: newStudentId },
        });
        acadMigrations++;
      } catch (e) {
        console.warn(`Failed ${t.name} update for ${r.studentId}`, e.message);
      }
    }
    console.log(`${t.name} updated: ${acadMigrations}`);
  }

  console.log("\nMigration completed successfully.");
}

run()
  .catch(console.error)
  .finally(async () => {
    await userPrisma.$disconnect();
    await authPrisma.$disconnect();
    await acadPrisma.$disconnect();
  });
