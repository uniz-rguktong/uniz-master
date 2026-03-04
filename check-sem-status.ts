import { PrismaClient } from "./apps/uniz-academics/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();
async function main() {
  const semesters = await prisma.academicSemester.findMany({
    select: { id: true, name: true, status: true },
  });
  console.log("SEMESTERS:", semesters);
}
main().finally(() => prisma.$disconnect());
