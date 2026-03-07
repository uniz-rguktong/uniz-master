# 🚀 ORNATE

> A cinematic, scroll-driven landing page for **ORNATE**, the annual college festival of RGUKT Ong.

---

## ✨ Features

- **Cinematic Intro** — Three.js particle animation morphing into the header logo
- **6-Scene Scroll Story** — 720 WebP frames played via canvas with GSAP ScrollTrigger
- **Scroll-Driven Narrative** — 10 animated text overlays timed to specific frame thresholds
- **Warp Drive Navigation** — Hyperdrive flash effect for auth form reveal
- **Smooth Scroll** — Lenis-powered ultra-smooth scrolling
- **Auto-Scroll** — rAF-based cinematic auto-scroll after intro

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Animation | GSAP 3 + ScrollTrigger + SplitText |
| 3D / Intro | Three.js + three-stdlib SVGLoader |
| Smooth Scroll | Lenis |
| Styling | Tailwind CSS v4 |
| Fonts | Inter (Google Fonts via next/font) |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Lenis smooth scroll
│   ├── page.tsx            # Main landing page
│   ├── globals.css         # Global styles + cinematic scrollbar
│   └── home/
│       └── page.tsx        # Post-login placeholder dashboard
│
├── components/
│   ├── Layout/
│   │   ├── Header.tsx      # Fixed nav with warp-drive auth trigger
│   │   └── SmoothScroll.tsx # Lenis provider wrapper
│   ├── Scene/
│   │   ├── SceneOne.tsx       # Canvas renderer + ScrollTrigger logic
│   │   ├── SceneTextOverlays.tsx # All 10 narrative text overlays
│   │   └── IntroAnimation.tsx    # Three.js particle intro
│   └── UI/
│       ├── AuthForm.tsx    # Login/Register mission form
│       └── SplitText.tsx   # GSAP SplitText wrapper component
│
├── hooks/
│   └── useAutoScroll.ts    # rAF-based cinematic auto-scroll hook
│
├── lib/
│   └── sceneConstants.ts   # Frame counts, asset paths, thresholds
│
└── types/
    └── scene.ts            # Shared TypeScript interfaces

public/
├── assets/
│   ├── scene-1a/  (120 WebP frames)
│   ├── scene-1b/  (120 WebP frames)
│   ├── scene-1c/  (120 WebP frames)
│   ├── scene-1d/  (120 WebP frames)
│   ├── scene-1e/  (120 WebP frames)
│   ├── scene-1f/  (120 WebP frames)
│   ├── logo.svg
│   ├── Ornate_LOGO.svg
│   ├── RguktLogo.svg
│   ├── wormhole.webm

scripts/
├── compress-assets.mjs   # WebP batch compression (Q70)
└── analyze-webp.mjs      # Analyze current compression levels
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🖼️ Asset Management

All 720 scene frames (`~77 MB`) are stored in `public/assets/`. For production deployment, consider migrating to a CDN:

- **Cloudinary** — auto-optimises format/size per device
- **Vercel Blob** — native integration with Vercel deployment
- **AWS S3 + CloudFront** — enterprise scale

To recompress assets locally:
```bash
node scripts/compress-assets.mjs
```

---

## 🌐 Deployment

Deployed on **Vercel**. All asset folder names use consistent **lowercase** naming to ensure compatibility with Linux (case-sensitive) file systems.

---

*ORNATE — Rajiv Gandhi University of Knowledge Technologies, Ong*
