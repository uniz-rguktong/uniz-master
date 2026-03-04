import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.authCredential.findFirst({
    where: { username: { equals: "HOD_CSE", mode: "insensitive" } },
  });
  console.log("User in Auth DB:", JSON.stringify(user, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
