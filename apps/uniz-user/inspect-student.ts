import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.studentProfile.findUnique({
    where: { username: "O210007" },
  });
  console.log(`[Inspector] Student O210007 details:`, student);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
