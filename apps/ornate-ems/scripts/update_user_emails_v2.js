const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// User request specifically: "o210900@rguktong.ac.in, o10193, o210250 and bhuchiki12@gmail.com"
// My previous script guessed "o210193" but user said "o10193".
// And "o210250".
// I should update users to match exactly what they listed if I can deduce the ID.
// "o10193" -> ID 193? Yes.
// "o210250" -> ID 250? Yes.
// "o210900@rguktong.ac.in" -> ID 900? Yes.
// "bhuchiki12@gmail.com" -> ID MECH-KING? Yes.

// I will re-run but ensure these specific EMAIL addresses are used.
// "o10193" is not an email. It's likely `o10193@rguktong.ac.in` in their shorthand.
// But just in case, I will create users with `o10193@rguktong.ac.in` if not exists.

async function main() {
  console.log("Updating user emails (Round 2)...");

  const map = [
    { regId: "900", email: "o210900@rguktong.ac.in", name: "EEE Captain" },
    { regId: "250", email: "o210250@rguktong.ac.in", name: "CSE Captain" }, // Assuming user meant full email if not typed
    { regId: "MECH-KING", email: "bhuchiki12@gmail.com", name: "SWAG RAJA" },

    // Handling the "o10193" input. Assuming standard domain.
    { regId: "193", email: "o10193@rguktong.ac.in", name: "ECE Captain" },
  ];

  for (const m of map) {
    // Try to find user
    let user = await prisma.user.findUnique({ where: { email: m.email } });

    if (!user) {
      console.log(`Creating user for ${m.email}...`);
      user = await prisma.user.create({
        data: {
          email: m.email,
          name: m.name,
          role: "STUDENT",
        },
      });
    }

    // Link Registration
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
