const { PrismaClient } = require("../src/generated/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing Roles in Auth DB...");
  const users = [
    "warden_male",
    "warden_female",
    "caretaker_male",
    "caretaker_female",
  ];

  for (const u of users) {
    try {
      await prisma.authCredential.update({
        where: { username: u.toUpperCase() },
        data: { role: u },
      });
      console.log(` Fixed role for ${u}`);
    } catch (e) {
      // Try lowercase if uppercase fails
      try {
        await prisma.authCredential.update({
          where: { username: u },
          data: { role: u },
        });
        console.log(` Fixed role for ${u} (lowercase)`);
      } catch (e2) {
        console.log(`❌ Could not fix ${u}: ${e2.message}`);
      }
    }
  }
  await prisma.$disconnect();
}

main();
