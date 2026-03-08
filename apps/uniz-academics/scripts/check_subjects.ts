import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Subjects Sample ---");
  const subjects = await prisma.subject.findMany({
    take: 10,
  });
  console.log(JSON.stringify(subjects, null, 2));

  console.log("\n--- Unique Departments ---");
  const depts = await prisma.subject.findMany({
    select: { department: true },
    distinct: ["department"],
  });
  console.log(JSON.stringify(depts, null, 2));

  console.log("\n--- Unique Semesters ---");
  const sems = await prisma.subject.findMany({
    select: { semester: true },
    distinct: ["semester"],
  });
  console.log(JSON.stringify(sems, null, 2));

  console.log("\n--- CSE E3 Subjects count ---");
  const count = await prisma.subject.count({
    where: {
      department: "CSE",
      code: { contains: "-E3-" },
    },
  });
  console.log(`Count: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
