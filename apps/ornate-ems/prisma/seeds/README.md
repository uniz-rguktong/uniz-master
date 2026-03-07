# Certificate Template Themes

This directory contains seed data for the certificate template themes used in the Ornate Event Management System.

## System Overview

The certificate system has **two distinct sections**:

### 1. **Template Themes** (Section 2 in UI)

These are the overall design themes that determine the visual style of certificates.

### 2. **Certificate Templates** (Section 3 in UI - "Theme Templates")

These are the actual certificate background images for each prize category.

---

## Template Themes (3 themes)

The system includes **3 certificate template themes** that define the overall design aesthetic:

### 1. **Classic Elegant**

- **Style:** Serif Typography, Gold Accents
- **Colors:** Black → Gold
  - `#1A1A1A` (Black)
  - `#D4AF37` (Gold)
- **Preview:** Unsplash image with elegant design
- **Use Case:** Formal events, academic ceremonies, traditional competitions

### 2. **Modern Tech**

- **Style:** Minimalist, Geometric Patterns
- **Colors:** Blue → Green
  - `#3B82F6` (Blue)
  - `#10B981` (Green)
- **Preview:** Unsplash image with modern tech aesthetic
- **Use Case:** Tech events, hackathons, innovation competitions

### 3. **Vibrant Sport**

- **Style:** Bold Typography, Dynamic Lines
- **Colors:** Red → Orange
  - `#EF4444` (Red)
  - `#F59E0B` (Orange)
- **Preview:** Unsplash image with dynamic sports theme
- **Use Case:** Sports events, athletic competitions, energetic activities

---

## Certificate Templates (4 prize categories)

The actual certificate background images are stored in `/public/certificates/themes/`:

1. **Gold** (`gold_bg.png`) - 1st Prize
2. **Silver** (`silver_bg.jpeg`) - 2nd Prize
3. **Bronze** (`bronze_bg.jpeg`) - 3rd Prize
4. **Participation** (`participation_bg.png`) - Participation certificates

These images are displayed in **Section 3: Theme Templates** of the Certificates page.

---

## Database Schema

```prisma
model CertificateTheme {
  id        String   @id
  name      String
  preview   String
  colors    String[]
  style     String
  createdAt DateTime @default(now())
  updatedAt DateTime
}
```

## Seeding the Database

To populate the database with the template themes:

```bash
node prisma/seeds/certificateThemes.js
```

This will create all 3 template themes if they don't already exist.

## Usage in Application

The certificate configuration workflow in **HHO Dashboard → Content Management → Certificates**:

1. **Select Event** - Choose which event to configure certificates for
2. **Select Template Theme** - Choose from 3 design themes (Classic Elegant, Modern Tech, Vibrant Sport)
3. **Theme Templates** - View the 4 certificate backgrounds (Gold, Silver, Bronze, Participation) with preview images
4. **Configure & Distribute** - Confirm settings and distribute certificates

## File Locations

- **Template Theme Seed Data:** `/prisma/seeds/certificateThemes.js`
- **Certificate Background Images:** Served from Cloud Storage (R2)
  - `https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/gold_bg.png`
  - `https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/silver_bg.jpeg`
  - `https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/bronze_bg.jpeg`
  - `https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/certificates/themes/participation_bg.png`

## Color Palette Reference

### Template Themes

| Template        | Primary         | Secondary        |
| --------------- | --------------- | ---------------- |
| Classic Elegant | #1A1A1A (Black) | #D4AF37 (Gold)   |
| Modern Tech     | #3B82F6 (Blue)  | #10B981 (Green)  |
| Vibrant Sport   | #EF4444 (Red)   | #F59E0B (Orange) |

### Certificate Backgrounds

| Certificate   | Color   |
| ------------- | ------- |
| Gold          | #D4AF37 |
| Silver        | #C0C0C0 |
| Bronze        | #CD7F32 |
| Participation | #3B82F6 |

---

**Last Updated:** February 13, 2026  
**Version:** 1.0.0
