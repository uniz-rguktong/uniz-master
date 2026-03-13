const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.admin.findFirst({
        where: { role: 'HHO' }
    }) || await prisma.admin.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
        console.error("No HHO or SUPER_ADMIN found to own the gallery.");
        return;
    }

    console.log(`Found admin: ${admin.email} (${admin.role})`);

    // 1. Create an Album
    const album = await prisma.galleryAlbum.create({
        data: {
            title: "HHO Annual Fest 2025",
            description: "Moments from the biggest event of the year.",
            coverImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
            creatorId: admin.id,
            tags: ["fest", "2025", "events"],
            isArchived: false,
        }
    });

    console.log(`Created album: ${album.title}`);

    // 2. Add Photos
    const photos = [
        {
            url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
            caption: "Main Stage Decoration",
            albumId: album.id
        },
        {
            url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
            caption: "Crowd Cheers",
            albumId: album.id
        },
        {
            url: "https://images.unsplash.com/photo-1514525253361-bee8a487409e?w=800&q=80",
            caption: "Performance Highlight",
            albumId: album.id
        }
    ];

    await prisma.galleryImage.createMany({
        data: photos
    });

    console.log(`Added ${photos.length} photos to the album.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
