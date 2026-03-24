import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.studentProfile.count({
    where: { batch: { equals: "O22", mode: "insensitive" } }
  });
  console.log(`[Cleaner] Found ${count} students in batch O22.`);

  if (count > 0) {
    const deleted = await prisma.studentProfile.deleteMany({
      where: { batch: { equals: "O22", mode: "insensitive" } }
    });
    console.log(`[Cleaner] Successfully deleted ${deleted.count} students.`);
  }
}

main().catch(console.error);
