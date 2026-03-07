require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("📹 Seeding Promo Videos & Logos only...");

  const creator = await prisma.admin.findUnique({
    where: { email: "cse@admin.com" },
  });

  if (!creator) {
    console.error(
      "❌ Creator 'cse@admin.com' not found. Please run main seed first.",
    );
    return;
  }

  // Promo Videos
  const existingPromo = await prisma.promoVideo.findFirst({
    where: { title: "CSE Fest 2025 - Official Promo" },
  });
  if (!existingPromo) {
    await prisma.promoVideo.create({
      data: {
        title: "CSE Fest 2025 - Official Promo",
        thumbnail:
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
        duration: "2:45",
        uploadDate: new Date("2025-11-01T10:00:00"),
        status: "active",
        views: 12450,
        platform: "YouTube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        creatorId: creator.id,
      },
    });
    console.log("Created Promo Video: CSE Fest 2025");
  } else {
    console.log("Promo Video: CSE Fest 2025 already exists");
  }

  const existingPromo2 = await prisma.promoVideo.findFirst({
    where: { title: "Event Highlights 2024" },
  });
  if (!existingPromo2) {
    await prisma.promoVideo.create({
      data: {
        title: "Event Highlights 2024",
        thumbnail:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
        duration: "3:20",
        uploadDate: new Date("2025-10-25T14:30:00"),
        status: "inactive",
        views: 8920,
        platform: "Vimeo",
        url: "https://vimeo.com/76979871",
        creatorId: creator.id,
      },
    });
    console.log("Created Promo Video: Event Highlights 2024");
  } else {
    console.log("Promo Video: Event Highlights 2024 already exists");
  }

  // Brand Logos
  const existingLogo = await prisma.brandLogo.findFirst({
    where: { name: "CSE Fest Main Logo" },
  });
  if (!existingLogo) {
    await prisma.brandLogo.create({
      data: {
        name: "CSE Fest Main Logo",
        type: "Primary Logo",
        format: "PNG",
        size: "245 KB",
        dimensions: "1200x800",
        uploadDate: new Date("2025-11-01T10:00:00"),
        status: "active",
        url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop",
        thumbnail:
          "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop",
        creatorId: creator.id,
      },
    });
    console.log("Created Brand Logo: CSE Fest Main Logo");
  } else {
    console.log("Brand Logo: CSE Fest Main Logo already exists");
  }

  // Add other initial logos to match the hardcoded data
  const existingLogo2 = await prisma.brandLogo.findFirst({
    where: { name: "CSE Department Logo" },
  });
  if (!existingLogo2) {
    await prisma.brandLogo.create({
      data: {
        name: "CSE Department Logo",
        type: "Department",
        format: "SVG",
        size: "48 KB",
        dimensions: "800x800",
        uploadDate: new Date("2025-10-28T12:00:00"),
        status: "active",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
        thumbnail:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=300&fit=crop",
        creatorId: creator.id,
      },
    });
    console.log("Created Brand Logo: CSE Department Logo");
  }

  const existingLogo3 = await prisma.brandLogo.findFirst({
    where: { name: "University Logo" },
  });
  if (!existingLogo3) {
    await prisma.brandLogo.create({
      data: {
        name: "University Logo",
        type: "University",
        format: "PNG",
        size: "180 KB",
        dimensions: "1000x1000",
        uploadDate: new Date("2025-10-20T09:00:00"),
        status: "active",
        url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&h=300&fit=crop",
        thumbnail:
          "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&h=300&fit=crop",
        creatorId: creator.id,
      },
    });
    console.log("Created Brand Logo: University Logo");
  }

  console.log("✅ Promo data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
