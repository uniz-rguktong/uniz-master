import { PrismaClient } from "./apps/uniz-auth/node_modules/@prisma/client/index.js";

const prisma = new PrismaClient();
async function main() {
  const users = await prisma.authCredential.findMany({
    select: { username: true, role: true },
  });
  console.log("USERS:", users);
}
main().finally(() => prisma.$disconnect());
