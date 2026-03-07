import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.adminProfile.findMany();
  const faculties = await prisma.facultyProfile.findMany();
  const students = await prisma.studentProfile.count();

  console.log("Admins:", admins);
  console.log("Faculties:", faculties);
  console.log("Total Students:", students);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
