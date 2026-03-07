require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Hardcoded data from GalleryPage.jsx
const INITIAL_CATEGORIES = [
  {
    name: "Previous Year Highlights",
    photoCount: 124,
    description: "Highlights from last year",
    coverImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
    tags: ["Highlights", "Yearly"],
  },
  {
    name: "Technical Events",
    photoCount: 89,
    description: "Tech events photos",
    coverImage:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=450&fit=crop",
    tags: ["Technical", "Events"],
  },
  {
    name: "Fun Games",
    photoCount: 67,
    description: "Fun games and activities",
    coverImage:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop",
    tags: ["Fun", "Games"],
  },
  {
    name: "Workshops",
    photoCount: 52,
    description: "Workshop sessions",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
    tags: ["Workshops"],
  },
  {
    name: "Cultural Programs",
    photoCount: 145,
    description: "Cultural program photos",
    coverImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop",
    tags: ["Cultural"],
  },
  {
    name: "Team Photos",
    photoCount: 34,
    description: "Team group photos",
    coverImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
    tags: ["Team"],
  },
  {
    name: "Behind the Scenes",
    photoCount: 78,
    description: "Behind the scenes shots",
    coverImage:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop",
    tags: ["BTS"],
  },
  {
    name: "Awards & Celebrations",
    photoCount: 95,
    description: "Awards ceremony",
    coverImage:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=450&fit=crop",
    tags: ["Awards"],
  },
];

const baseUrls = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
];

async function main() {
  console.log("🖼️ Seeding Gallery Albums & Photos...");

  // Find a default creator (Super Admin or CSE Admin) to assign these to
  // In real app, each admin would seed their own, but for this demo we assign to one.
  const creator = await prisma.admin.findUnique({
    where: { email: "cse@admin.com" }, // Using CSE Admin as default owner for these seeded galleries.
  });

  if (!creator) {
    console.error(
      "❌ Creator 'cse@admin.com' not found. Please run main seed first.",
    );
    return;
  }

  for (const cat of INITIAL_CATEGORIES) {
    // Check if album exists
    let album = await prisma.galleryAlbum.findFirst({
      where: { title: cat.name, creatorId: creator.id },
    });

    if (!album) {
      console.log(`Creating album: ${cat.name}`);
      album = await prisma.galleryAlbum.create({
        data: {
          title: cat.name,
          description: cat.description,
          coverImage: cat.coverImage,
          tags: cat.tags,
          creatorId: creator.id,
        },
      });

      // Seed 3-5 photos for this album
      const photosToCreate = [];
      for (let i = 0; i < 5; i++) {
        photosToCreate.push({
          url: baseUrls[i % baseUrls.length],
          caption: `Photo ${i + 1} for ${cat.name}`,
          albumId: album.id,
        });
      }

      await prisma.galleryImage.createMany({
        data: photosToCreate,
      });
      console.log(`  - Added 5 photos to ${cat.name}`);
    } else {
      console.log(`Album ${cat.name} already exists.`);
    }
  }

  console.log("✅ Gallery seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
