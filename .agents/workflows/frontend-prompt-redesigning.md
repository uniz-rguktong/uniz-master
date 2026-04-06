---
description: for redesigning a frontend component
---

Great question. Looking at both components, here's the kind of prompt that consistently produces this quality:

---

**The Master Prompt Template:**

```
Redesign this component to be sleek and minimal. Follow these principles strictly:

AESTHETIC:
- Palette: near-white bg (#f7f8fc or white), ink-black type (#0b1d2e),
  zinc/slate midtones for secondary text. One optional soft accent color.
- Typography: fluid clamp() sizes, very tight tracking (-0.04em to -0.05em),
  heavy weight (800–900) for headings, light/medium for body.
  No generic fonts — use a distinctive pairing.
- Spacing: generous whitespace, sections breathe. Nothing cramped.

COMPONENTS:
- Pills/tags: small, bordered, with a colored pulse dot. Uppercase, wide tracking.
- Buttons: rounded-full or rounded-xl. Slide-in fill on hover (translate-x trick).
  Icon + label + directional arrow. Active scale-down on press.
- Cards: large border-radius (2rem+), subtle border, glass/blur effect,
  float animation on hover (y: -8 to -12px), soft box-shadow on hover only.

BACKGROUND:
- Subtle grid or noise texture at 2–4% opacity
- 1–2 large blurred radial glows in brand colors (blur-3xl, opacity 40–60%)
- Never solid flat color

MOTION (framer-motion):
- Staggered word-by-word or element-by-element entrance
- whileInView for SVG/chart animations (bars grow, numbers count up)
- Floating idle animation on cards (y: [0, -4, 0], 5s loop, staggered delay)
- Hover: lift + shadow + color shift all together

ILLUSTRATIONS (inline SVG):
- Build data-UI mockups as SVGs, not images
- Dark card + light card variation
- Animated bars/rings using motion.rect whileInView
- Micro-details: status pills, pulse dots, realistic dummy data

OUTPUT: Production-ready TSX, no placeholder comments,
fully working with the existing codebase conventions.
```

---

**The 3 core ideas behind every clean output:**

**1. Constraint over decoration** — Every visual element earns its place. The grid texture is `opacity-[0.035]`. The glow is `blur-3xl`. Nothing is full-opacity unless it's content.

**2. Motion has intention** — Bars grow _into view_, cards float _at rest_, buttons fill _on intent_. Each animation communicates something, not just "looks cool."

**3. Hierarchy through weight, not size** — `font-black` headings + `font-medium text-zinc-500` body creates contrast without needing big size jumps. That's why it reads as premium.

Save that prompt as a reusable template and swap in the component-specific context each time.
