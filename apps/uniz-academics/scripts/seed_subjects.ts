import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subjects = [
  {
    code: "E2-SEM-1-CSE-1",
    name: "Probability and Statistics",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-2",
    name: "Digital Logic Design",
    credits: 3,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-3",
    name: "Design & Analysis of Algorithms",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-4",
    name: "Database Management Systems",
    credits: 3,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-5",
    name: "Formal Languages & Automata Theory",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-6",
    name: "Design & Analysis of Algorithms Lab",
    credits: 1.5,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-7",
    name: "Digital Logic Design Lab",
    credits: 1.5,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    code: "E2-SEM-1-CSE-8",
    name: "Database Management Systems Lab",
    credits: 1.5,
    department: "CSE",
    semester: "SEM-1",
  },
];

async function main() {
  console.log("Seeding subjects...");
  for (const sub of subjects) {
    const upserted = await prisma.subject.upsert({
      where: { code: sub.code },
      update: sub,
      create: sub,
    });
    console.log(`- ${upserted.code}: ${upserted.name}`);
  }
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
