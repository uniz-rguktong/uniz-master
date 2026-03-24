
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const students = await prisma.studentProfile.findMany({
    select: { batch: true },
  });
  console.log('Students:', JSON.stringify(students, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
