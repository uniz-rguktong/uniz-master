import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany();
  console.log(JSON.stringify(subjects, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
