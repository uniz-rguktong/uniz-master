const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting bulk registration...");

  // 1. Find the Cricket Event (assuming it exists and is related to Sports)
  const cricketEvent = await prisma.event.findFirst({
    where: {
      OR: [
        { title: { contains: "Cricket", mode: "insensitive" } },
        { description: { contains: "Cricket", mode: "insensitive" } },
      ],
      // Relax category check slightly to find *any* cricket event
    },
  });

  if (!cricketEvent) {
    console.error("❌ Cricket event not found!");
    return;
  }

  console.log(
    `✅ Found Cricket Event: ${cricketEvent.title} (${cricketEvent.id})`,
  );

  // 2. Define Teams and Members based on user request
  const teams = [
    { branch: "EEE", mainId: "900", count: 10 },
    { branch: "ECE", mainId: "193", count: 10 },
    { branch: "CSE", mainId: "250", count: 10 },
    { branch: "MECH", mainName: "SWAG RAJA", count: 10 },
    { branch: "CIVIL", mainName: "mayifsk", count: 10 },
  ];

  for (const team of teams) {
    console.log(`Processing team ${team.branch}...`);

    // Register Main Student
    let mainStudentName = team.mainName || `${team.branch} Captain`;
    let mainStudentId = team.mainId || `${team.branch}-CAP`;

    if (team.branch === "MECH") mainStudentId = "MECH-001";
    if (team.branch === "CIVIL") mainStudentId = "CIVIL-001";

    await registerStudent(
      cricketEvent.id,
      mainStudentName,
      mainStudentId,
      team.branch,
    );

    // Register "10 more"
    for (let i = 1; i <= team.count; i++) {
      await registerStudent(
        cricketEvent.id,
        `${team.branch} Player ${i}`,
        `${team.branch}-00${i}`,
        team.branch,
      );
    }
  }

  console.log("✅ Bulk registration complete!");
}

async function registerStudent(eventId, name, studentId, branch) {
  // Check if already registered
  const existing = await prisma.registration.findFirst({
    where: {
      eventId: eventId,
      studentId: studentId,
    },
  });

  if (existing) {
    console.log(`  - Skipping ${name} (${studentId}): Already registered.`);
    return;
  }

  try {
    await prisma.registration.create({
      data: {
        eventId: eventId,
        studentName: name,
        studentId: studentId.toString(), // Ensure string
        status: "ATTENDED", // Mark as ATTENDED so they get Participation Certs automatically
        paymentStatus: "PAID",
        amount: 0,
      },
    });
    console.log(`  + Registered: ${name} (${studentId})`);
  } catch (err) {
    console.error(`  ❌ Failed to register ${name}:`, err.message);
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
