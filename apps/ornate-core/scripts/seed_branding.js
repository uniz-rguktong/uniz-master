const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error("No admin found. Please create an admin first.");
    return;
  }

  console.log(`Seeding data for admin: ${admin.email}`);

  // Seed Promo Videos
  const videos = [
    {
      title: "HHO Grand Marathon 2025 Promo",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platform: "YouTube",
      thumbnail:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
      status: "active",
      views: 1250,
      duration: "2:45",
      creatorId: admin.id,
    },
    {
      title: "Science Exhibition Highlights 2024",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platform: "YouTube",
      thumbnail:
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop",
      status: "active",
      views: 840,
      duration: "1:30",
      creatorId: admin.id,
    },
  ];

  for (const video of videos) {
    await prisma.promoVideo.create({ data: video });
  }

  // Seed Brand Logos
  const logos = [
    {
      name: "Main University Logo",
      type: "Primary Logo",
      format: "SVG",
      size: "45 KB",
      dimensions: "512x512",
      url: "https://images.unsplash.com/photo-1599305090598-fe179d501c27?w=200&h=200&fit=crop",
      thumbnail:
        "https://images.unsplash.com/photo-1599305090598-fe179d501c27?w=200&h=200&fit=crop",
      status: "active",
      creatorId: admin.id,
    },
    {
      name: "Sports Department",
      type: "Department",
      format: "PNG",
      size: "120 KB",
      dimensions: "1024x1024",
      url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
      thumbnail:
        "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
      status: "active",
      creatorId: admin.id,
    },
  ];

  for (const logo of logos) {
    await prisma.brandLogo.create({ data: logo });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
