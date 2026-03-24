
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const students = await prisma.studentProfile.findMany({
    select: { batch: true },
    distinct: ["batch"],
    where: { batch: { not: "" } },
  });
  console.log('Students in DB:', JSON.stringify(students, null, 2));

  const batches = students
    .map((s) => s.batch.toUpperCase())
    .filter((b) => b.length >= 3)
    .sort();
  const uniqueBatches = Array.from(new Set(batches));
  console.log('Calculated Unique Batches:', uniqueBatches);
}
test().catch(console.error).finally(() => prisma.$disconnect());
