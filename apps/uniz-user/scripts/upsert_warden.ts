import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=users_v2",
    },
  },
});

async function main() {
  const username = "warden_female";
  const role = "warden_female";

  console.log(`Checking profile ${username} in User DB...`);
  const profile = await prisma.adminProfile.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });

  if (profile) {
    await prisma.adminProfile.update({
      where: { id: profile.id },
      data: { role },
    });
    console.log(`Profile ${username} updated successfully.`);
  } else {
    await prisma.adminProfile.create({
      data: { username, role, email: `${username}@uniz.in` },
    });
    console.log(`Profile ${username} created successfully.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
