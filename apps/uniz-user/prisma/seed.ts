import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const getDeterministicID = (username: string) => {
  return crypto
    .createHash("sha256")
    .update(username)
    .digest("hex")
    .substring(0, 32)
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
};

async function main() {
  console.log("Start seeding User Service...");

  // 1. Clean up old data
  try {
    await prisma.studentProfile.deleteMany();
    await prisma.facultyProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.banner.deleteMany();
    console.log("✅ Deleted old user data.");
  } catch (e) {
    console.warn("⚠️  Could not clean old data, proceeding...");
  }

  // 2. Seed Admin Profiles
  const admins = [
    { username: "webmaster", role: "webmaster" },
    { username: "security", role: "security" },
    { username: "dean", role: "dean" },
    { username: "warden_male", role: "warden_male" },
    { username: "warden_female", role: "warden_female" },
    { username: "caretaker_male", role: "caretaker_male" },
    { username: "caretaker_female", role: "caretaker_female" },
    { username: "director", role: "director" },
    { username: "swo", role: "swo" },
    { username: "librarian", role: "librarian" },
  ];

  for (const admin of admins) {
    const id = getDeterministicID(admin.username);
    await prisma.adminProfile.upsert({
      where: { username: admin.username },
      update: { role: admin.role },
      create: {
        id,
        username: admin.username,
        email: `${admin.username}@uniz.com`,
        role: admin.role,
      },
    });
  }
  console.log("✅ Seeded Admin profiles with deterministic IDs.");

  // 3. Seed Student Profiles
  const students = [
    {
      username: "O210008",
      name: "Desu SABER",
      email: "o210008@rguktong.ac.in",
      gender: "Male",
      branch: "CSE",
      year: "E4",
      section: "A",
      roomno: "302",
      fatherName: "D. Venkateswarlu",
      phone: "9876543210",
    },
    {
      username: "O210329",
      name: "Alahari Bhanu Prakash",
      branch: "CSE",
      year: "E2",
      section: "C",
      email: "o210329@rguktong.ac.in",
      gender: "Male",
    },
  ];

  for (const s of students) {
    const id = getDeterministicID(s.username);
    await prisma.studentProfile.upsert({
      where: { username: s.username },
      update: s,
      create: {
        ...s,
        id,
      },
    });
  }
  console.log(`✅ Seeded student profiles with deterministic IDs.`);

  console.log("✅ User Service Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
