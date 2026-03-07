const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const o = await prisma.outpass.findMany();
  const ou = await prisma.outing.findMany();
  console.log("Outpasses:", JSON.stringify(o, null, 2));
  console.log("Outings:", JSON.stringify(ou, null, 2));
  await prisma.$disconnect();
}

main();
