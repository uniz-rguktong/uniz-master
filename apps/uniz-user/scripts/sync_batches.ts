import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.studentProfile.findMany({
    where: { batch: "" },
  });

  console.log(`Found ${students.length} students with empty batch.`);

  let count = 0;
  for (const student of students) {
    const prefix = student.username.substring(0, 3).toUpperCase();
    if (/^[A-Z]\d{2}$/.test(prefix)) {
      await prisma.studentProfile.update({
        where: { id: student.id },
        data: { batch: prefix },
      });
      count++;
    }
  }

  console.log(`Updated ${count} students with inferred batch.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
