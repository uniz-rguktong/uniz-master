import { PrismaClient } from "@prisma/client/index-browser";

const prisma = new PrismaClient();
async function main() {
  const users = await prisma.authCredential.findMany({
    select: { username: true, role: true },
  });
  console.log("USERS:", users);
}
main().finally(() => prisma.$disconnect());
