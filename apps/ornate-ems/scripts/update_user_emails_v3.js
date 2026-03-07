const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating user emails (Round 3)...");

  const map = [
    { regId: "900", email: "o210900@rguktong.ac.in", name: "EEE Captain" },
    { regId: "193", email: "o10193@rguktong.ac.in", name: "ECE Captain" }, // Adjusted from previous failure
    { regId: "250", email: "o210250@rguktong.ac.in", name: "CSE Captain" },
    { regId: "MECH-KING", email: "bhuchiki12@gmail.com", name: "SWAG RAJA" },
  ];

  for (const m of map) {
    let user = await prisma.user.findUnique({ where: { email: m.email } });

    if (!user) {
      console.log(`Creating user for ${m.email}...`);
      // Add dummy password hash for valid creation
      user = await prisma.user.create({
        data: {
          email: m.email,
          name: m.name,
          role: "STUDENT",
          password: "$2b$10$YourDummyHashHereForRegistrationPurposes",
        },
      });
    }

    const regs = await prisma.registration.findMany({
      where: { studentId: m.regId },
    });

    for (const reg of regs) {
      await prisma.registration.update({
        where: { id: reg.id },
        data: { userId: user.id },
      });
      console.log(
        `Linked ${reg.studentName} (${reg.studentId}) to ${user.email}`,
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
