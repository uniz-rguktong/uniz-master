import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=auth_v2",
    },
  },
});

async function main() {
  const username = "warden_female";
  const password = "warden_female@uniz";
  const role = "warden_female";

  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`Checking user ${username} in Auth DB...`);
  const user = await prisma.authCredential.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });

  if (user) {
    await prisma.authCredential.update({
      where: { id: user.id },
      data: { passwordHash, role },
    });
    console.log(`User ${username} updated successfully.`);
  } else {
    await prisma.authCredential.create({
      data: { username, passwordHash, role },
    });
    console.log(`User ${username} created successfully.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
