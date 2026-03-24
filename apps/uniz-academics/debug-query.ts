
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const semester = 'SEM-1';
  const where: any = {
    semester: { contains: semester, mode: 'insensitive' }
  };
  const subjects = await prisma.subject.findMany({ where });
  console.log('Count:', subjects.length);
  if (subjects.length > 0) {
    console.log('Sample:', JSON.stringify(subjects[0], null, 2));
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
