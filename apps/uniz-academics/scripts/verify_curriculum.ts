import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.subject.count();
  console.log(`Total Subjects: ${count}`);

  const byYear = await prisma.subject.groupBy({
    by: ["code"],
  });

  // Just a quick summary
  const subjects = await prisma.subject.findMany();
  const summary: any = {};

  subjects.forEach((s) => {
    const year = s.code.split("-")[0];
    const dept = s.department;
    const key = `${year}-${dept}`;
    summary[key] = (summary[key] || 0) + 1;
  });

  console.log("Summary by Year-Dept:");
  console.table(summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
