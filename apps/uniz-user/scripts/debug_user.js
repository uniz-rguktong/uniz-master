const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Checking Student O210008 in Users DB...");
  const s = await prisma.studentProfile.findUnique({
    where: { username: "O210008" },
  });
  console.log("Result:", JSON.stringify(s, null, 2));
  await prisma.$disconnect();
}

main();
