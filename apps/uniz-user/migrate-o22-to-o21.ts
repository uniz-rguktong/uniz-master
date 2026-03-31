import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.studentProfile.count({
    where: { batch: { equals: "O22", mode: "insensitive" } },
  });
  console.log(`[Migrator] Found ${count} students currently in batch O22.`);

  if (count > 0) {
    const updated = await prisma.studentProfile.updateMany({
      where: { batch: { equals: "O22", mode: "insensitive" } },
      data: { batch: "O21" },
    });
    console.log(
      `[Migrator] Successfully moved ${updated.count} students from O22 to O21.`,
    );
  } else {
    console.log("[Migrator] No O22 students found to migrate.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
