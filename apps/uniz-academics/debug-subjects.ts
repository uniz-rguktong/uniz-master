
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany({
    select: { department: true, semester: true, code: true, name: true },
  });
  console.log(JSON.stringify(subjects, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
