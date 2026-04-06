const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.USER_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

async function run() {
  console.log("Searching for students with 'RO' IDs...");
  
  const students = await prisma.studentProfile.findMany({
    where: {
      username: {
        startsWith: "RO",
      },
    },
  });

  console.log(`Found ${students.length} students to migrate.`);

  let successCount = 0;
  let failCount = 0;

  for (const student of students) {
    const newUsername = "O" + student.username.slice(2);
    const newEmail = newUsername.toLowerCase() + "@rguktong.ac.in";
    try {
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          username: newUsername,
          email: student.email.toLowerCase().startsWith("ro") ? newEmail : student.email,
        },
      });
      console.log(`Migrated ${student.username} -> ${newUsername}`);
      successCount++;
    } catch (e) {
      console.error(`Failed to migrate ${student.username}:`, e.message);
      failCount++;
    }
  }

  console.log(`\nMigration complete for uniz-user: ${successCount} successes, ${failCount} failures.`);
}

run()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
