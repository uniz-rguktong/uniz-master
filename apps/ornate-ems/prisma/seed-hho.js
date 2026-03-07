const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HHO data...");

  // 1. Load data from backups
  const backupDir = path.join(__dirname, "backups", "latest");
  const admins = JSON.parse(
    fs.readFileSync(path.join(backupDir, "admins.json"), "utf8"),
  );
  const users = JSON.parse(
    fs.readFileSync(path.join(backupDir, "users.json"), "utf8"),
  );

  // 2. Find HHO Admin
  const hhoAdmin = admins.find((a) => a.role === "HHO");
  if (!hhoAdmin) {
    console.error("❌ HHO Admin not found in backup!");
    return;
  }
  console.log(`✅ Found HHO Admin: ${hhoAdmin.name} (${hhoAdmin.id})`);

  // 3. Define HHO Events
  const hhoEvents = [
    {
      title: "Annual Charity Marathon 2026",
      description:
        "Run for a cause! All proceeds from this marathon will go towards the student emergency fund.",
      date: new Date("2026-04-15"),
      venue: "Main Sports Ground",
      category: "Fundraiser",
      fee: "100",
      price: 100,
      maxCapacity: 500,
      posterUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3",
    },
    {
      title: "Mega Blood Donation Camp",
      description:
        "Your blood can save a life. Join us for the campus-wide blood donation drive.",
      date: new Date("2026-03-20"),
      venue: "College Auditorium",
      category: "Health",
      fee: "Free",
      price: 0,
      maxCapacity: 1000,
      posterUrl: "https://images.unsplash.com/photo-1615461066870-40b124f293db",
    },
    {
      title: "Medical Emergency Response Workshop",
      description:
        "Learn basic life support and emergency first aid from professionals.",
      date: new Date("2026-03-10"),
      venue: "Seminar Hall 1",
      category: "Workshop",
      fee: "50",
      price: 50,
      maxCapacity: 100,
      posterUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514",
    },
    {
      title: "Charity Food Fest",
      description:
        "Delicious food for a great cause. Support our local community initiatives.",
      date: new Date("2026-02-28"),
      venue: "OAT Precincts",
      category: "Fundraiser",
      fee: "Free",
      price: 0,
      maxCapacity: 300,
      posterUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    },
    {
      title: "Old Clothes & Books Collection Drive",
      description: "Donate your gently used items to those in need.",
      date: new Date("2026-02-20"),
      venue: "Campus Main Gate",
      category: "Community",
      fee: "Free",
      price: 0,
      maxCapacity: 200,
      posterUrl: "https://images.unsplash.com/photo-1489066604574-2334b0784347",
    },
  ];

  // 4. Create Events and Registrations
  for (const eventData of hhoEvents) {
    console.log(`Creating event: ${eventData.title}`);

    const event = await prisma.event.create({
      data: {
        ...eventData,
        creatorId: hhoAdmin.id,
      },
    });

    // Register some random students
    const numRegs = Math.floor(Math.random() * 40) + 20; // 20-60 registrations
    const selectedUsers = users
      .sort(() => 0.5 - Math.random())
      .slice(0, numRegs);

    console.log(`  Adding ${numRegs} registrations...`);

    for (const user of selectedUsers) {
      await prisma.registration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          studentName: user.name || "Student",
          studentId: user.email.split("@")[0].toUpperCase(),
          status: "CONFIRMED",
          paymentStatus: event.price > 0 ? "PAID" : "PENDING",
          amount: event.price,
        },
      });
    }
  }

  console.log("✨ HHO Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
