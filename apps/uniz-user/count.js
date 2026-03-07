const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.studentProfile.count();
  console.log("REAL COUNT:", count);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
