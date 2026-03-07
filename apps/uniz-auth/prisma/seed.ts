import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const getDeterministicID = (username: string) => {
  // Production-grade deterministic UUID generation from username
  return crypto
    .createHash("sha256")
    .update(username)
    .digest("hex")
    .substring(0, 32)
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
};

async function main() {
  console.log("Start seeding Auth Service...");

  // 1. Clean old data
  try {
    await prisma.authCredential.deleteMany();
    await prisma.otpLog.deleteMany();
    console.log("Deleted old auth data.");
  } catch (e) {
    console.warn("Could not clean old data, proceeding...");
  }

  // 2. Seed Admin Credentials
  const adminUsers = [
    { username: "webmaster", role: "webmaster", pass: "webmaster@uniz" },
    { username: "security", role: "security", pass: "security@uniz" },
    { username: "dean", role: "dean", pass: "dean@uniz" },
    { username: "warden_male", role: "warden_male", pass: "warden_male@uniz" },
    {
      username: "warden_female",
      role: "warden_female",
      pass: "warden_female@uniz",
    },
    {
      username: "caretaker_male",
      role: "caretaker_male",
      pass: "caretaker_male@uniz",
    },
    {
      username: "caretaker_female",
      role: "caretaker_female",
      pass: "caretaker_female@uniz",
    },
    { username: "swo", role: "swo", pass: "swo@uniz" },
    { username: "director", role: "director", pass: "director@uniz" },
    { username: "librarian", role: "librarian", pass: "librarian@uniz" },
  ];

  for (const admin of adminUsers) {
    const hash = await bcrypt.hash(admin.pass, 10);
    const id = getDeterministicID(admin.username);
    await prisma.authCredential.upsert({
      where: { username: admin.username },
      update: { passwordHash: hash, role: admin.role },
      create: {
        id,
        username: admin.username,
        passwordHash: hash,
        role: admin.role,
      },
    });
  }

  // 3. Seed Students
  const defaultPass = await bcrypt.hash("password123", 10);
  const students = ["O210008", "O210329"];

  for (const studentId of students) {
    const id = getDeterministicID(studentId);
    await prisma.authCredential.upsert({
      where: { username: studentId },
      update: { passwordHash: defaultPass, role: "student" },
      create: {
        id,
        username: studentId,
        passwordHash: defaultPass,
        role: "student",
      },
    });
  }

  // 4. Seed Faculty Credentials
  let faculty: any[] = [];
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "faculty_data.json"),
      "utf8",
    );
    faculty = JSON.parse(data);
  } catch (err) {
    console.warn(
      "⚠️ faculty_data.json not found in auth seed, using fallback.",
    );
    faculty = [{ username: "HOD_CSE", role: "hod" }];
  }

  const facultyPass = await bcrypt.hash("faculty@uniz", 10);

  for (const f of faculty) {
    const id = getDeterministicID(f.username);
    await prisma.authCredential.upsert({
      where: { username: f.username },
      update: { passwordHash: facultyPass, role: f.role || "teacher" },
      create: {
        id,
        username: f.username,
        passwordHash: facultyPass,
        role: f.role || "teacher",
      },
    });
  }

  console.log(" Seeded Auth data with deterministic identities.");
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
