const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SUBJECTS = [
  {
    id: "SUB-1",
    code: "SUB-1",
    name: "Mathematics",
    credits: 4,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    id: "SUB-2",
    code: "SUB-2",
    name: "Physics",
    credits: 3,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    id: "SUB-3",
    code: "SUB-3",
    name: "Computer Programming",
    credits: 5,
    department: "CSE",
    semester: "SEM-1",
  },
  {
    id: "SUB-ALL",
    code: "SUB-ALL",
    name: "General Attendance",
    credits: 0,
    department: "CSE",
    semester: "SEM-1",
  },
];

async function main() {
  console.log("Seeding Subjects to DB directly...");
  for (const sub of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: sub.code },
      update: sub,
      create: sub,
    });
    console.log(`Upserted Subject: ${sub.code}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
