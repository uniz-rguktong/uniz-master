import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sem = await prisma.academicSemester.findFirst({
    orderBy: { createdAt: "desc" },
  });
  console.log("Latest Semester:", JSON.stringify(sem, null, 2));

  if (sem) {
    const allocations = await prisma.branchAllocation.count({
      where: { semesterId: sem.id },
    });
    console.log("Allocations for this semester:", allocations);

    const registrations = await prisma.registration.count({
      where: { semesterId: sem.id },
    });
    console.log("Registrations for this semester:", registrations);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
