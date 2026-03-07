/**
 * Certificate Template Themes Seed Data
 *
 * This file contains the default certificate template themes for the Ornate Core.
 * Run this script to populate the database with the default themes.
 *
 * Usage: node prisma/seeds/certificateThemes.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const certificateTemplateThemes = [
  {
    id: "theme-classic-elegant",
    name: "Classic Elegant",
    style: "Serif Typography, Gold Accents",
    preview:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=250&fit=crop",
    colors: ["#1A1A1A", "#D4AF37"],
    updatedAt: new Date(),
  },
  {
    id: "theme-modern-tech",
    name: "Modern Tech",
    style: "Minimalist, Geometric Patterns",
    preview:
      "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&h=250&fit=crop",
    colors: ["#3B82F6", "#10B981"],
    updatedAt: new Date(),
  },
  {
    id: "theme-vibrant-sport",
    name: "Vibrant Sport",
    style: "Bold Typography, Dynamic Lines",
    preview:
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=250&fit=crop",
    colors: ["#EF4444", "#F59E0B"],
    updatedAt: new Date(),
  },
];

async function seedCertificateThemes() {
  try {
    console.log("🌱 Seeding certificate template themes...\n");

    // Check if themes already exist
    const existingCount = await prisma.certificateTheme.count();

    if (existingCount > 0) {
      console.log(`✅ Found ${existingCount} existing template themes.`);
      console.log("   Database is already seeded!\n");

      // Display existing themes
      const existing = await prisma.certificateTheme.findMany();
      console.log("📋 Current Template Themes:");
      existing.forEach((theme, i) => {
        console.log(`   ${i + 1}. ${theme.name} - ${theme.style}`);
        console.log(`      Colors: ${theme.colors.join(" → ")}`);
      });

      return;
    }

    // Create themes
    console.log("📦 Creating template themes...\n");

    for (const theme of certificateTemplateThemes) {
      await prisma.certificateTheme.create({
        data: theme,
      });
      console.log(`   ✅ Created: ${theme.name}`);
      console.log(`      Colors: ${theme.colors.join(" → ")}`);
    }

    console.log("\n✅ Successfully seeded certificate template themes!");

    // Display summary
    const themes = await prisma.certificateTheme.findMany();
    console.log("\n" + "=".repeat(60));
    console.log("📋 CERTIFICATE TEMPLATE THEMES");
    console.log("=".repeat(60));
    themes.forEach((theme, index) => {
      console.log(`\n${index + 1}. ${theme.name.toUpperCase()}`);
      console.log(`   Style:  ${theme.style}`);
      console.log(`   Colors: ${theme.colors.join(" → ")}`);
    });
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error seeding certificate themes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedCertificateThemes();
}

// Export for use in other scripts
module.exports = { certificateTemplateThemes, seedCertificateThemes };
