const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding certificate themes...');

    const themes = [
        {
            name: "Classic Elegant",
            preview: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=250&fit=crop",
            colors: ["#1A1A1A", "#D4AF37"],
            style: "Serif Typography, Gold Accents"
        },
        {
            name: "Modern Tech",
            preview: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&h=250&fit=crop",
            colors: ["#3B82F6", "#10B981"],
            style: "Minimalist, Geometric Patterns"
        },
        {
            name: "Vibrant Sport",
            preview: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=250&fit=crop",
            colors: ["#EF4444", "#F59E0B"],
            style: "Bold Typography, Dynamic Lines"
        }
    ];

    for (const theme of themes) {
        await prisma.certificateTheme.upsert({
            where: { id: theme.id || 'placeholder' }, // Upsert needs a unique field, but since we don't have static IDs yet, we'll just create them
            update: theme,
            create: theme,
        }).catch(async (e) => {
            // Since id might not match, just create if not exists by name
            const existing = await prisma.certificateTheme.findFirst({ where: { name: theme.name } });
            if (!existing) {
                await prisma.certificateTheme.create({ data: theme });
            } else {
                await prisma.certificateTheme.update({ where: { id: existing.id }, data: theme });
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
