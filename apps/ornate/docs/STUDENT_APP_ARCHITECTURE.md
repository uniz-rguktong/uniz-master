# Student App Architecture Overview

> **Ornate '26 — A Fest Beyond Earth**
> Frontend documentation for the Student-facing application of the RGUKT IIIT Ongole Event Management System (EMS).

---

## 1. Application Purpose

Ornate '26 is the **student-facing frontend** for the annual tech-cultural fest **"Ornate"** organized by RGUKT IIIT Ongole. This is the 10th edition of the fest, running across **3 days** (March 27–29, 2026).

The application serves as the primary interface through which students:

- **Browse and discover events** (missions) across branches, clubs, and the HHO department
- **View detailed event information** including venue, date, difficulty, team requirements, and registration slots
- **Access branch and club pages** — each represented as a planet in a sci-fi solar system metaphor
- **View the event schedule/roadmap** as a horizontal timeline with spaceship navigation
- **Explore stalls** (food, lifestyle, dessert, cafe) with ratings, pricing, and menus
- **View sports fixtures, cultural events, and results** via dedicated fest sub-pages
- **Check live announcements and updates** (sports scores, registration deadlines, system notifications)
- **Access their profile** with avatar, stats, XP progress, QR code, and ship customization
- **Browse a photo gallery** organized by branches, sports, and cultural categories
- **Play fun games** (Ms/Mr RGUKT pageant, AI mini-games, voice challenges)
- **View sponsors** through an animated fractal-tree + energy-beam showcase

The frontend communicates with an **Admin EMS backend** (PostgreSQL via Prisma ORM), though the current implementation primarily uses **hardcoded/static data** for events, stalls, and updates, with the database schema ready for full integration.

---

## 2. UI / Theme Design

### Visual Theme: **Deep-Space Sci-Fi HUD**

The entire application is designed around an immersive **science-fiction starship cockpit / mission-control** aesthetic. Every page simulates a spacecraft interface with HUD (Heads-Up Display) elements, neon glow effects, scanline overlays, and space backgrounds.

### Color System

| Token | Value | Purpose |
|---|---|---|
| `--color-neon` | `#39FF14` (default) | Primary accent — neon green. Dynamically changeable via ThemeContext |
| `--color-neon-dark` | `#1F8A0B` | Darker variant of the accent for borders/shadows |
| `--color-neon-rgb` | `57, 255, 20` | RGB triplet for Tailwind opacity combinations |
| `--color-panel` | `rgba(10, 15, 10, 0.75)` | Semi-transparent panel backgrounds |
| `--color-border` | `#808080` | Default border color |
| Background | `#000` / `#030308` / `#0a0a0a` | Deep black/near-black backgrounds |
| Text | `#fff` / gray scale | White primary text with gray secondary text |

**Dynamic Accent Colors** (user-selectable via Ship Customization):
| Name | Hex |
|---|---|
| Neon Green | `#39FF14` |
| Cyber Cyan | `#00F0FF` |
| Deep Purple | `#7000FF` |
| Pure White | `#FFFFFF` |
| Solar Orange | `#FF9900` |

Page-specific accents also include:
- **Magenta** (`#FF00E5`) — Clubs explorer, Fun Planet
- **Amber** (`#fbbf24`) — Sports, HHO events
- **Cyan** (`#22d3ee`) — Cultural events, live updates
- **Orange** (`#f97316`) — Sports results

### Typography System

| Font | Usage | Source |
|---|---|---|
| **Orbitron** | Primary UI font — all navigation, headings, labels, HUD text | Google Fonts (400, 500, 700, 900) |
| **Rajdhani** | Secondary body text — stall cards, descriptions | Google Fonts (400, 500, 600, 700) |
| **Apex Mk2** | Display/hero font — used for large "ORNATE" titles | Custom local OTF (`/fonts/apex-mk2/`) |

CSS variables: `--font-orbitron`, `--font-rajdhani`, `--font-apex`.

### Design System & Styling Approach

- **Tailwind CSS v4** — primary styling via utility classes
- **shadcn/ui (New York style)** — component primitives, CSS variables for theming
- **tw-animate-css** — animation utilities
- **Framer Motion** — page transitions, scroll-driven animations, spring physics, layout animations
- **Custom CSS** — `globals.css` contains HUD clip-paths, scrollbar styles, panel shapes, keyframe animations
- **CSS Modules** — `branches.css` and `clubs.css` for the solar-system planet navigation pages
- **Inline SVG** — extensive use of hand-crafted SVG for HUD frames, navigation bars, panel borders

### Key Visual Patterns

- **Clip-path polygons** — almost every card, button, and panel uses CSS `clip-path` for angled/cut-corner shapes
- **Scanline overlays** — repeating gradient lines simulating CRT/holographic displays
- **HUD corner marks** — L-shaped border accents at card corners
- **Neon glow effects** — `text-shadow`, `box-shadow`, and `drop-shadow` with the accent color
- **Glassmorphism** — `backdrop-blur`, semi-transparent backgrounds (`bg-black/40`)
- **Space backgrounds** — starfield canvas animations, nebula blur gradients, Unsplash deep-space imagery
- **Animated elements** — radar sweeps, pulsing status indicators, floating particles

### Responsive Behavior

- **Desktop-first design** with mobile adaptations
- The home page uses `isDesktop` state (breakpoint at 640px) to toggle between:
  - Desktop: full HUD with side panels, bottom nav bar, hologram console
  - Mobile: hamburger sidebar, simplified nav, toggle buttons for panels
- All pages use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- The branches/clubs solar system pages attempt to **lock landscape orientation** on mobile
- Scroll containers use custom thin scrollbars styled per-page

---

## 3. Routing Structure

The application uses **Next.js 16 App Router** with file-system based routing.

| Route | Page Name | Purpose |
|---|---|---|
| `/` | Home / Dashboard | Main HUD — solar system, missions panel, scanner, navigation hub |
| `/about` | About Us | Institution info, team, Ornate history, leadership |
| `/sponsors` | Sponsors | Sponsor showcase with fractal tree + energy beam |
| `/gallery` | Gallery | Photo gallery organized by branches, sports, culturals |
| `/profile` | Profile | User profile, ship customization, missions, QR code |
| `/missions` | Missions Hub | All events listed with filtering, search, multi-view layouts |
| `/roadmap` | Event Roadmap | Horizontal timeline (schedule) of all 3 days |
| `/stalls` | Stalls Listing | Grid of all 25 fest food/lifestyle stalls |
| `/stalls/[id]` | Stall Detail | Individual stall page — menu, reviews, contact |
| `/fest` | Fest Overview | Gateway to Sports and Culturals fest sections |
| `/fest/sports` | Sports Events | Sports categories, fixtures, results, standings |
| `/fest/culturals` | Cultural Events | Cultural event categories, galleries, highlights |
| `/fun` | Fun Planet | Mini-games hub — social, ML, voice games |
| `/fun/ms-mr-rgukt` | Ms/Mr RGUKT | Pageant competition — voting, leaderboard, participant cards |
| `/planet-view` | System Explorer | Navigation hub linking to Branches and Clubs explorers |
| `/branches` | Branches Explorer | Solar system CSS animation — 6 branches as planets |
| `/branches/[slug]` | Branch Detail | Full branch page — events, gallery, video, standings |
| `/clubs` | Clubs Explorer | Solar system CSS animation — 7 clubs as planets |
| `/clubs/[slug]` | Club Detail | Full club page — events, gallery, video, standings |
| `/updates` | Updates / Announcements | Live updates feed — sports, cultural, system notifications |
| `/branch` | Branch Redirect | Redirects to `/branches` |
| `/demo/cards` | Demo Page | Development showcase for DisplayCards component |
| `/space/index.html` | 3D Space Experience | Static HTML page — immersive 3D universe (standalone JS) |

---

## 4. Page Breakdown

### Home Page (`/`)

- **Route:** `/`
- **Purpose:** The central mission-control dashboard. Acts as the main hub from which students navigate the entire fest.
- **Key Components:** `SolarSystem3D`, `CentralConsole`, `PlanetaryScanner`, `HeaderSVG`, `PanelSVG`, `RightPanelSVG`
- **Key UI Sections:**
  - **Top Navigation** — HUD-framed SVG header with desktop nav links (HOME, ABOUT US, SPONSORS, GALLERY, PROFILE), mobile hamburger menu
  - **Center Title** — Large "ORNATE '26" heading with neon glow and Apex font
  - **3D Solar System** — Background Three.js scene with textured Sun and orbiting planets
  - **Left Panel** — Tabbed panel (TODAY'S MISSIONS / UPDATES) with event schedule and news feed
  - **Right Panel** — PLANETARY SCANNER with radar animation showing branches, clubs, and special planet dots
  - **Central Hologram** — Interactive planet projection with hover tooltips and "ENTER" button
  - **Bottom Navigation** — HUD-framed SVG footer with links to FUN, MISSIONS, SCHEDULE, STALLS, FEST, FULL PLANETS VIEW (with sub-menus for Fest → Sports/Culturals and Planets → Clubs/Branches)
  - **Mobile Sidebar** — Full slide-out drawer with search, Core Protocols links, External Nodes links, user identity footer
- **User Actions:** Navigate to any section, select planets on scanner/hologram, toggle panel visibility, open sidebar
- **Data Displayed:** Today's mission schedule (hardcoded), live updates feed (hardcoded), planet data

### About Page (`/about`)

- **Route:** `/about`
- **Purpose:** Showcase the institution (RGUKT IIIT Ongole), Ornate's 10th anniversary, leadership, and development team.
- **Key Components:** `MissionsFooter`, `LeadershipCard`, `TeamMemberCard`
- **Key UI Sections:**
  - **Hero** — Fixed background with parallax zoom RGUKT building image, massive "ORNATE" text, scroll indicator
  - **Legacy Section** — Institution description, "The Legacy Continues" text, infinite horizontal image carousel
  - **About Institution** — Split layout: campus image with sci-fi corners, statistics list (10,000+ Students, 800+ Faculty, etc.)
  - **How to Learn with Ornate** — 3-step timeline with scroll-driven vertical progress bar, mutual-exclusive step opacity
  - **Leadership Cards** — Photo cards of fest leadership with grayscale-to-color hover effect
  - **Development Team** — Grid of developer cards with social icons
  - **Footer** — `MissionsFooter` with global links
- **User Actions:** Scroll through sections, hover cards
- **Data Displayed:** Institutional stats, team member profiles (hardcoded)

### Sponsors Page (`/sponsors`)

- **Route:** `/sponsors`
- **Purpose:** Showcase fest sponsors through artistic visual presentations.
- **Key Components:** `FractalBloomHero`, `EnergyBeam`
- **Key UI Sections:**
  - **Hero** — Canvas-drawn fractal tree animation that grows from the bottom, mouse-reactive branch angles, "Our Sponsors" text overlay
  - **Energy Beam** — Full-screen Unicorn Studio WebGL animation seamlessly connected below the hero
- **User Actions:** Move mouse to influence fractal tree, scroll between sections
- **Data Displayed:** Sponsor branding (via external WebGL project)

### Gallery Page (`/gallery`)

- **Route:** `/gallery`
- **Purpose:** Photo gallery browsing organized by department branches, sports events, and cultural events.
- **Key Components:** `ScrollMorphHero`, `DomeGallery`, `BranchCard`, `AlbumCard`
- **Key UI Sections:**
  - **Scroll Morph Hero** — Interactive intro animation: images scatter → line → circle → gallery strip via mouse wheel
  - **Filter Tabs** — ALL / BRANCHES / SPORTS / CULTURALS filter pills
  - **Branch Gallery** — Grid of department cards (CSE, ECE, EEE, Mechanical, Civil, HHO), clicking opens branch-specific photo grid with DomeGallery overlay
  - **Sports Albums** — Cards for Cricket Finals, Football Arena, Athletics, Basketball, Kabaddi, Badminton
  - **Cultural Albums** — Cards for Opening Ceremony, Dance, Music, Drama, Art, Closing Celebration
  - **Dome Gallery Overlay** — Immersive CSS 3D spherical gallery for viewing individual album photos with drag-to-rotate
- **User Actions:** Filter by category, click branch/album to view photos, drag to rotate dome, close overlays
- **Data Displayed:** Photo albums with Unsplash images per branch, sport, and cultural event (hardcoded)

### Profile Page (`/profile`)

- **Route:** `/profile`
- **Purpose:** User identity dashboard — view/edit profile, customize ship theme, track missions.
- **Key Components:** `ProfileCard`, `ProfileFooter`, `SpaceshipNav`, `ShipInterface`, `MissionSection`
- **Key UI Sections:**
  - **Scroll Progress Bar** — `SpaceshipNav` with animated spaceship tracking scroll position
  - **Top Nav** — Back to Dashboard, Share, Settings, Logout buttons
  - **Profile Card** — Military dossier layout:
    - Avatar with camera upload
    - Name, callsign, branch, XP bar, clearance level badge
    - Stats grid: missions completed, achievements, skills, followers, following
    - QR code for digital identity
    - Tabbed content: Profile info | Ship (3D customization) | Missions
  - **Ship Interface** — Three.js 3D ship viewer with GLB models (Falcon/Phoenix), accent color picker (changes global theme)
  - **Mission Section** — Active/completed mission list
  - **Footer Status** — Connection status, biometric scan indicators
  - **Profile Footer** — Dramatic full-page footer with curved SVG, "ALWAYS EXPLORING THE UNKNOWN" headline, astronaut image, navigation links, brand marquee
- **User Actions:** Edit profile fields, upload avatar, switch accent color, change ship model, view QR code, navigate tabs
- **Data Displayed:** User profile data, mission stats, ship models (all client-side/mock)

### Missions Hub (`/missions`)

- **Route:** `/missions`
- **Purpose:** Central event discovery page where students browse, filter, and search all fest events.
- **Key Components:** `MissionCard`, `MissionsFooter`, `MorphingCardStack`, `TerminalDataNodes`
- **Key UI Sections:**
  - **Header** — Back link, "MISSIONS COMMAND CENTER" title, animated background
  - **Filter System** — 3-step cascading filter:
    - Step 1: Event type (ALL / BRANCHES / CLUBS / HHO)
    - Step 2: Sub-category (department for Branches, club name for Clubs, category for HHO)
    - Step 3: Event category (Technical, Cultural, Sports, Fun, Workshops, Hackathons, Gaming)
  - **Search Bar** — Real-time text search across mission titles and descriptions
  - **View Mode Toggle** — Grid / List / Stack layouts
  - **My Missions Toggle** — Filter to bookmarked missions only
  - **Mission Cards** — HUD-styled cards showing: title, category, difficulty (color-coded), venue, date, team/solo, free/paid, registration progress bar, XP reward
  - **Stack View** — Swipeable card stack using drag gestures
  - **Mission Detail Modal** — Expanded view on card click
  - **Footer** — `MissionsFooter`
- **User Actions:** Filter by category/sub-category, search events, toggle view modes, view bookmarks, click to expand mission details, navigate to registration
- **Data Displayed:** 20 hardcoded missions across 6 branches and 7 clubs with full metadata

### Event Roadmap (`/roadmap`)

- **Route:** `/roadmap`
- **Purpose:** Visual timeline schedule of all events across the 3-day fest.
- **Key Components:** Custom ship-on-curve timeline
- **Key UI Sections:**
  - **Header** — Title, filter buttons (Overall/Branches/Clubs), sub-filters per branch
  - **Day Tabs** — Day 1 / Day 2 / Day 3 selector with hexagonal indicators
  - **Desktop Timeline** — Horizontal SVG curve with animated spaceship tracking progress, events positioned as nodes along the path, current time indicator
  - **Mobile Timeline** — Vertical snake-like curve with the same logic
  - **Event Nodes** — Each node on the timeline shows: time, title, type badge, venue, origin; "Planet" nodes link between days
  - **Live Clock** — Real-time clock display in the header
- **User Actions:** Switch between days, filter by category/branch, scroll timeline horizontally (desktop) or vertically (mobile), click event nodes
- **Data Displayed:** All missions mapped to timeline positions by day and time

### Stalls Listing (`/stalls`)

- **Route:** `/stalls`
- **Purpose:** Browse all 25 fest stalls (food, dessert, cafe, lifestyle).
- **Key Components:** `StallCard`, `StallsFooter`
- **Key UI Sections:**
  - **Atmospheric Backdrop** — Nebula blur gradients, floating bubbles
  - **Hero Header** — "EVENT STALLS" title with neon accent
  - **Stall Grid** — 3-column responsive grid of stall cards, each showing: image banner, stall type badge, rating dots, stall name/number, squad/budget/rating readouts, description, view details CTA
  - **Footer** — `StallsFooter` with 12-column HUD grid
- **User Actions:** Browse stalls, click to view details
- **Data Displayed:** 25 stalls from `constants.ts` with name, team, price, rating, description, color, type

### Stall Detail (`/stalls/[id]`)

- **Route:** `/stalls/[id]` (dynamic)
- **Purpose:** Detailed view of a single stall with menu, reviews, and contact info.
- **Key Components:** Custom stall detail layout
- **Key UI Sections:**
  - **Stall Header** — Name, number, rating, hours, location
  - **Quick Items** — Featured menu items with prices
  - **Full Menu Modal** — Categorized menu (Main Menu, Beverages, Side Items)
  - **Reviews Section** — User reviews with submit functionality
  - **Contact Info** — Manager team, contact link
- **User Actions:** View menu, read/write reviews, contact stall manager
- **Data Displayed:** Stall details from `constants.ts`, mock menu items, mock reviews

### Fest Overview (`/fest`)

- **Route:** `/fest`
- **Purpose:** Gateway page introducing the two main fest categories — Sports and Culturals.
- **Key Components:** `FestCard`, `StarField`, `Particles`, `HudLabel`
- **Key UI Sections:**
  - **Starfield Background** — Canvas-rendered twinkling stars at 30 FPS
  - **Hero** — "THE FEST" title with scan-glow gradient, live signal indicator
  - **Two Category Cards** — Side-by-side cards for CULTURALS and SPORTS, each with: hero image, title, tagline, description, stats (Duration, Events count, Prizes), "EXPLORE" CTA
  - **HUD Details** — Sector label, status indicator, live signal
- **User Actions:** Click to enter Sports or Culturals section
- **Data Displayed:** Fest category overview (hardcoded)

### Sports Events (`/fest/sports`)

- **Route:** `/fest/sports`
- **Purpose:** Comprehensive sports section with event categories, fixtures, results, and standings.
- **Key Components:** `StarField`, `UpdatesTicker`, `DisplayCards`, `CircularGallery`, `DomeGallery`, `ScrollMorphHero`, `SportsFooter`, `StandingsTable`
- **Key UI Sections:**
  - **Hero** — Sports title, description
  - **Updates Ticker** — Live scrolling sports news
  - **Display Cards** — Visual event category cards
  - **Gallery sections** — CircularGallery, DomeGallery, ScrollMorphHero for photos
  - **Standings Table** — Department leaderboard across 8 sports
- **User Actions:** Browse events, view fixtures, check standings, explore galleries
- **Data Displayed:** Sports events, match fixtures/results, standings (hardcoded)

### Cultural Events (`/fest/culturals`)

- **Route:** `/fest/culturals`
- **Purpose:** Cultural events showcase with category browsing and photo galleries.
- **Key Components:** `StarField`, `DomeGallery`, `CircularGallery`, `ScrollMorphHero`, `CulturalsFooter`
- **Key UI Sections:**
  - **Hero** — Culturals title, description
  - **Event Categories** — Music, Art, Drama, Dance, etc.
  - **Gallery Sections** — Multiple gallery components for cultural event photos
- **User Actions:** Browse cultural categories, explore photo galleries
- **Data Displayed:** Cultural events and photos (hardcoded)

### Fun Planet (`/fun`)

- **Route:** `/fun`
- **Purpose:** Entertainment and games hub featuring casual campus-friendly games.
- **Key Components:** `MissionsFooter`
- **Key UI Sections:**
  - **Hero** — "Fun Planet" title with gradient text, "CLICK TO EXPERIENCE THE REAL UNIVERSE" CTA linking to 3D space experience
  - **Featured Games Carousel** — Horizontal auto-scrolling showcase of 4 featured games (Ms/Mr RGUKT, Neon Puzzle Room, Galaxy Racer, Sound Wave)
  - **Game Categories** — Tabbed section: Social / ML Bots / Voice games with game cards
  - **Footer** — `MissionsFooter`
- **User Actions:** Scroll carousel, switch game category tabs, click to play games, access 3D universe
- **Data Displayed:** Game listings with player counts and ratings (hardcoded)

### Ms/Mr RGUKT (`/fun/ms-mr-rgukt`)

- **Route:** `/fun/ms-mr-rgukt`
- **Purpose:** Pageant competition page — browse participants, vote, view leaderboard.
- **Key Components:** Custom participant grid and leaderboard
- **Key UI Sections:**
  - **Participant Grid** — Searchable grid of contestant cards with avatars
  - **Leaderboard** — Paginated rankings with vote counts
  - **Participant Detail Modal** — Expanded view on selection
- **User Actions:** Search participants, vote, view leaderboard, page through results
- **Data Displayed:** Mock participants with avatars (pravatar.cc), vote counts

### Planet View (`/planet-view`)

- **Route:** `/planet-view`
- **Purpose:** Navigation hub — a simple two-card gateway to Branches Explorer and Clubs Explorer.
- **Key Components:** `ExplorerCard`, `AtmosphericBackdrop`
- **Key UI Sections:**
  - **Atmospheric Background** — Moving cosmic glow gradients
  - **Title** — "System Explorer" with subtitle
  - **Two Cards** — Branches (green, Orbit icon) and Clubs (magenta, Users icon), each with sci-fi cut-corner frames, rotating icon on hover, "Initialize Scan" button
  - **Bottom HUD** — Coordinate readout and spinning globe
- **User Actions:** Click to navigate to Branches or Clubs explorer
- **Data Displayed:** N/A — navigation only

### Branches Explorer (`/branches`)

- **Route:** `/branches`
- **Purpose:** Solar system visualization where each branch department is a planet that users scroll through.
- **Key Components:** `LiquidButton`, CSS solar system animation
- **Key UI Sections:**
  - **Full-screen solar system** — 6 planets (HHO, CSE, ECE, EEE, Civil, Mech) rendered via pure CSS with radio-button state management
  - **Planet descriptions** — Each planet shows branch name, description text
  - **Radio navigation** — Side menu with planet labels and AU distances
  - **Header** — "ORNATE 2K26" branding, Branches/Clubs toggle links
  - **Explore Button** — `LiquidButton` CTA to enter selected branch
- **User Actions:** Scroll/swipe to navigate planets, click planet or explore button to enter detail page
- **Data Displayed:** 6 branch names with descriptive text

### Clubs Explorer (`/clubs`)

- **Route:** `/clubs`
- **Purpose:** Identical solar system visualization for 7 student clubs.
- **Key Components:** `LiquidButton`, CSS solar system animation
- **Key UI Sections:** Same as Branches Explorer but with 7 clubs: ICRO, Khelsaathi, PixelRo, TechXcel, Artix, Kaladharani, Sarvasrijana
- **User Actions:** Same as Branches Explorer
- **Data Displayed:** 7 club names

### Branch/Club Detail (`/branches/[slug]` and `/clubs/[slug]`)

- **Route:** `/branches/[slug]` or `/clubs/[slug]`
- **Purpose:** Comprehensive detail page for a specific branch or club — events, gallery, video, standings.
- **Key Components:** `SpaceshipNav`, `MissionCard`, `CircularGallery`, `DomeGallery`, `ScrollMorphHero`, `StandingsTable`, `Award`, `BranchFooter`
- **Key UI Sections:**
  - **Scroll Progress** — `SpaceshipNav` tracking vertical scroll
  - **Updates Panel** — Collapsible live updates sidebar
  - **Hero** — Branch/club name, description, member count
  - **Events Section** — Grid of `MissionCard` components filtered by this branch/club
  - **Hall of Fame** — Award components for notable achievements
  - **Video Carousel** — Slanted card layout for promotional videos
  - **Circular Gallery** — OGL WebGL circular image carousel
  - **Dome Gallery** — CSS 3D dome gallery for photos
  - **Scroll Morph Hero** — Interactive image morph animation
  - **Standings Table** — Sports leaderboard table
  - **Branch Footer** — Rotating planet background with links
- **User Actions:** Browse events, view photos in multiple gallery formats, watch videos, check standings
- **Data Displayed:** Branch/club data from `getBranchData()` map (hardcoded), filtered missions, gallery images

### Updates Page (`/updates`)

- **Route:** `/updates`
- **Purpose:** Full announcements/news feed with categorized updates.
- **Key Components:** `UpdateCard`, `FilterPill`, `LiveTicker`, `StarField`, `SignalBars`
- **Key UI Sections:**
  - **Header** — "TRANSMISSION LOG" title with signal bars
  - **Live Ticker** — Scrolling breaking-news marquee
  - **Filter Pills** — ALL / SPORTS / CULTURAL / SYSTEM category filters
  - **Update Cards** — Expandable cards with: category label, priority tag, timestamp, title, description
  - **Right column** — Quick stats, transmission status
- **User Actions:** Filter by category, expand/collapse update cards
- **Data Displayed:** 6 hardcoded updates (sports scores, cultural events, system notices)

---

## 5. Navigation Structure

### Primary Navigation (Desktop)

The application uses a **dual-navigation HUD layout** on the home page:

**Top Navigation Bar** (custom SVG frame):
- HOME → `/`
- ABOUT US → `/about`
- SPONSORS → `/sponsors`
- GALLERY → `/gallery`
- PROFILE → `/profile`

**Bottom Navigation Bar** (custom SVG frame):
- FUN → `/fun`
- MISSIONS → `/missions`
- SCHEDULE → `/roadmap`
- STALLS → `/stalls`
- FEST → `/fest` (with sub-menu: SPORTS, CULTURALS)
- FULL PLANETS VIEW → `/planet-view` (with sub-menu: CLUBS EXPLORER, BRANCHES EXPLORER)

### Mobile Navigation

- **Hamburger Sidebar** — Left-sliding drawer containing:
  - Core Protocols: HOME, FUN, MISSIONS, SCHEDULE
  - External Nodes: STALLS, FEST, PLANETARY VIEW
  - User identity footer
- **Top Bar** — Condensed links (ABOUT US, SPONSORS, GALLERY) + profile shortcut
- **Bottom Toggle Buttons** — UPDATES (left panel) and SCANNER (right panel)

### Inner Page Navigation

Every inner page includes a **back navigation link** (styled as a HUD button) that returns to the home page. Back links use varied sci-fi labels:
- "Abort Mission" (About)
- "Back to Base" (Fest)
- "Back to Dome" (Sponsors, Fun)
- "Back to Home" (Stalls)
- "Return to Dashboard" (Profile)

### Route Hierarchy

```
/ (Home Dashboard)
├── /about
├── /sponsors
├── /gallery
├── /profile
├── /missions
├── /roadmap (Schedule)
├── /stalls
│   └── /stalls/[id]
├── /fest
│   ├── /fest/sports
│   └── /fest/culturals
├── /fun
│   └── /fun/ms-mr-rgukt
├── /planet-view
├── /branches
│   └── /branches/[slug]
├── /clubs
│   └── /clubs/[slug]
├── /updates
└── /branch (→ redirects to /branches)
```

### Protected vs Public Routes

**All routes are currently public.** There is no authentication guard or protected route implementation in the frontend. The profile page shows mock user data. The Prisma schema includes an `Admin` model suggesting the backend has auth, but the student app does not implement login/logout flows.

---

## 6. Component Architecture

### Component Organization

```
src/components/
├── CentralConsole.tsx       # Holographic planet projection on home page
├── CircularGallery.tsx      # OGL WebGL circular image carousel
├── PlanetaryScanner.tsx     # Radar/scanner with planet dots + PLANETS data
├── SolarSystem3D.tsx        # Three.js 3D solar system background
├── UpdatesTicker.tsx        # Auto-cycling news ticker
├── branches/
│   └── BranchFooter.tsx     # Rotating planet footer for branch/club pages
├── culturals/
│   └── CulturalsFooter.tsx  # Footer for culturals page
├── fun/
│   └── FunFooter.tsx        # Footer for fun page
├── missions/
│   ├── MissionCard.tsx      # Event/mission HUD card (exports Mission type)
│   └── MissionsFooter.tsx   # Footer wrapper → GlobalFooterLinks
├── profile/
│   ├── MissionSection.tsx   # Active/completed missions list
│   ├── ProfileCard.tsx      # Full profile dossier card
│   ├── ProfileFooter.tsx    # Dramatic full-page profile footer
│   ├── ProfileHologram.tsx  # Holographic profile effect
│   ├── ShipCustomization.tsx
│   ├── ShipInterface.tsx    # Three.js ship viewer + theme selector
│   └── ShipMissions.tsx
├── sports/
│   └── SportsFooter.tsx     # Footer for sports page
├── stalls/
│   └── StallsFooter.tsx     # HUD grid footer for stalls
└── ui/
    ├── 3d-animation.tsx
    ├── award.tsx             # Award/achievement display
    ├── CircularGallery.tsx   # (alias/re-export)
    ├── display-cards-demo.tsx
    ├── display-cards.tsx     # Skewed tactical cards with scanlines
    ├── DomeGallery.tsx       # CSS 3D sphere gallery with drag
    ├── energy-beam.tsx       # Unicorn Studio WebGL wrapper
    ├── fractal-bloom-tree.tsx # Canvas fractal tree animation
    ├── GlobalFooterLinks.tsx  # Shared 6-column footer navigation
    ├── hybrid-liquid-button.tsx
    ├── liquid-glass-button.tsx # Button library (Button, LiquidButton, MetalButton)
    ├── morphing-card-stack.tsx # Multi-layout card collection (stack/grid/list)
    ├── moving-border.tsx      # Animated border orb button
    ├── scroll-morph-hero.tsx  # Phase-based image morph animation
    ├── SpaceshipNav.tsx       # Scroll progress bar with spaceship
    ├── StandingsTable.tsx     # Sports standings leaderboard
    └── zoom-parallax.tsx
```

### Reusable UI Components

| Component | Used In | Purpose |
|---|---|---|
| `GlobalFooterLinks` | MissionsFooter, BranchFooter, and others | Shared site-wide footer navigation grid |
| `MissionCard` | Missions page, Branch/Club detail pages | Event/mission card with full metadata display |
| `SpaceshipNav` | Profile, Branch/Club detail pages | Scroll progress bar with animated spaceship |
| `LiquidButton` | Branches, Clubs, Profile footer | Glassmorphism button with SVG filter effects |
| `CircularGallery` | Branch/Club detail, Sports, Culturals | OGL WebGL circular image carousel |
| `DomeGallery` | Gallery, Branch/Club detail, Sports, Culturals | CSS 3D sphere gallery |
| `ScrollMorphHero` | Gallery, Branch/Club detail, Sports, Culturals | Phase-based image morph intro animation |
| `StandingsTable` | Branch/Club detail, Sports | Sports leaderboard table |
| `MorphingCardStack` | Missions page | Multi-layout card display (stack/grid/list) |
| `DisplayCards` | Sports page | Skewed tactical cards |
| `UpdatesTicker` | Sports page, Branch/Club pages | Auto-cycling news ticker |
| `StarField` | Fest, Culturals, Sports, Updates, Profile | Canvas-based twinkling starfield background |

### Heavy/3D Components (Dynamically Imported)

These components use `next/dynamic` with `{ ssr: false }` to avoid server-side rendering:
- `SolarSystem3D` — Three.js solar system
- `CentralConsole` — Holographic planet display
- `PlanetaryScanner` — Radar scanner
- `ScrollMorphHero` — Phase morph animation
- `DomeGallery` — CSS 3D gallery
- `CircularGallery` — OGL WebGL gallery
- `ShipInterface` (within ProfileCard) — Three.js ship viewer

### Component Patterns

- **Memoization** — Extensive use of `React.memo()` for list items, SVG components, and sub-components to prevent unnecessary re-renders
- **Display names** — All memoized components have `displayName` set for debugging
- **Inline sub-components** — Many pages define page-specific components (StarField, Particles, cards) within the same file rather than extracting them
- **Footer per section** — Each major section has its own footer component, most delegating to `GlobalFooterLinks`

---

## 7. State Management

### Approach: Local State + Context

The application uses a **lightweight state management approach** without external state libraries (no Redux, Zustand, or React Query).

### React Context

**ThemeContext** (`src/context/ThemeContext.tsx`):
- **Purpose:** Global accent color management
- **State:** `accentIndex` (number), `accentColor` (hex string)
- **Persistence:** `localStorage` key `ornate-accent-index`
- **Effect:** On accent change, updates CSS custom properties on `<html>`:
  - `--color-neon` (hex)
  - `--color-neon-dark` (darker variant)
  - `--color-neon-rgb` (RGB triplet)
- **Usage:** Consumed by `ShipInterface` for ship color selection, affects entire app theme

### Local Component State

Each page manages its own state via `useState`:

| Page | Key State Variables |
|---|---|
| Home | `activeMissionTab`, `activeScannerTab`, `showLeftPanel`, `showRightPanel`, `showPlanetsMenu`, `showFestMenu`, `selectedPlanet`, `isSidebarOpen`, `isDesktop`, `isHoloVisibleMobile/Desktop` |
| Missions | `selectedEvent`, `selectedSub`, `selectedCat`, `searchQuery`, `filterOpen`, `filterStep`, `viewMode`, `myMissionsActive`, `selectedMission` |
| Gallery | `filter`, `exploreOpen`, `selectedBranch`, `domeAlbum` |
| Roadmap | `activeDay`, `mainFilter`, `subFilter`, `isMobileFilterOpen` |
| Profile | N/A (delegated to ProfileCard sub-component) |
| Updates | `filter` (category) |

### Animation State

Framer Motion provides declarative animation state via:
- `useMotionValue` / `useTransform` — for scroll-linked animations (Roadmap ship position, About page parallax)
- `useSpring` — for smooth interpolation
- `useScroll` / `scrollYProgress` — for scroll-driven effects
- `AnimatePresence` — for enter/exit transitions

### Data Flow

```
ThemeContext (accent color)
    ↓ CSS variables on <html>
    ↓ All components read via var(--color-neon)

Page State (useState)
    ↓ Props to child components
    ↓ Callback handlers

Static Data (in-file constants / imported arrays)
    ↓ MISSIONS array → filtered/searched → MissionCard
    ↓ STALLS array → StallCard grid
    ↓ PLANETS array → PlanetaryScanner / CentralConsole
    ↓ UPDATES array → UpdateCard list
```

---

## 8. API Communication

### Current State: Primarily Static / Client-Side

The frontend **does not actively fetch data from any API endpoints** in its current implementation. All event data, stall data, updates, and user profiles are **hardcoded as constants** within the source files.

### Database Infrastructure (Ready but Unused in Frontend)

**Prisma ORM Setup:**
- `prisma/schema.prisma` — 626-line schema defining 17+ models for a full EMS backend
- `src/lib/prisma.ts` — Singleton PrismaClient with PostgreSQL adapter
- Models include: `Admin`, `Event`, `Registration`, `Team`, `Sport`, `BranchPoints`, `Announcement`, `GalleryAlbum`, `BestOutgoingStudent`, `CertificateTheme`, `WinnerAnnouncement`, `PromoVideo`, `BrandLogo`, `AuditLog`, `AnalyticsSnapshot`, `Task`

**Key Schema Entities:**
- `Event` — Full event management (title, description, venue, date, maxParticipants, registrationDeadline, status, prizeDetails, etc.)
- `Registration` — Student event registrations with payment tracking
- `Team` — Team formation with member lists and leader
- `Sport` — Sports fixtures with scores, venues, dates
- `BranchPoints` — Department point tracking across categories
- `Announcement` — Admin-published news items
- `GalleryAlbum` — Photo albums with image arrays

**Image Optimization:**
- `next.config.ts` configures remote image patterns for:
  - `images.unsplash.com` — Gallery and background images
  - `i.pravatar.cc` — Avatar placeholders
- AVIF/WebP auto-conversion enabled
- 30-day cache TTL

### External Resources

| Resource | Usage |
|---|---|
| Unsplash | Gallery images, background photos, event/sport imagery |
| pravatar.cc | Placeholder user avatars |
| Unicorn Studio CDN | WebGL animation for sponsors energy beam |
| Google Fonts | Orbitron and Rajdhani typefaces |
| GLB 3D Models | Ship models loaded by ShipInterface (`/assets/*.glb`) |
| Planet Textures | Three.js textures from `/public/textures/` |

### Rewrites

`next.config.ts` defines two rewrites:
- `/clubs` → `/clubs.html`
- `/branches` → `/branches.html`

These suggest possible pre-rendered static HTML versions, though the App Router pages take precedence.

---

## 9. Folder Structure Overview

```
Ornate-Main/
├── prisma/
│   └── schema.prisma            # Full EMS database schema (626 lines, 17+ models)
├── public/
│   ├── assets/                  # Static images, logos, HUD graphics, GLB models
│   ├── fonts/
│   │   ├── apex-mk2/            # Custom Apex Mk2 display font
│   │   └── astra-font/          # Additional custom font
│   ├── images/
│   │   ├── events/              # Event-related images
│   │   └── fest/                # Fest branding images
│   ├── space/                   # Standalone 3D space experience (HTML + JS)
│   │   ├── index.html
│   │   ├── assets/index-*.js
│   │   └── textures/            # Planet textures for Three.js
│   └── textures/                # Additional textures
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── globals.css          # Global styles, CSS variables, HUD clip-paths, scrollbars
│   │   ├── layout.tsx           # Root layout — fonts, metadata, ThemeProvider
│   │   ├── page.tsx             # Home dashboard (684 lines)
│   │   ├── about/               # About page
│   │   ├── branch/              # Redirect to /branches
│   │   ├── branches/            # Branches explorer + CSS + [slug] detail
│   │   ├── clubs/               # Clubs explorer + CSS + [slug] detail
│   │   ├── demo/cards/          # Dev showcase page
│   │   ├── fest/                # Fest hub + culturals + sports
│   │   ├── fun/                 # Fun planet + ms-mr-rgukt
│   │   ├── gallery/             # Photo gallery
│   │   ├── missions/            # Events/missions hub (1,350 lines)
│   │   ├── planet-view/         # System explorer gateway
│   │   ├── profile/             # User profile
│   │   ├── roadmap/             # Event timeline (891 lines)
│   │   ├── sponsors/            # Sponsors showcase
│   │   ├── stalls/              # Stalls listing + [id] detail + constants
│   │   └── updates/             # Announcements feed
│   ├── components/              # Reusable React components
│   │   ├── branches/            # Branch-specific (BranchFooter)
│   │   ├── culturals/           # Cultural-specific (CulturalsFooter)
│   │   ├── fun/                 # Fun-specific (FunFooter)
│   │   ├── missions/            # Mission components (MissionCard, MissionsFooter)
│   │   ├── profile/             # Profile components (ProfileCard, ShipInterface, etc.)
│   │   ├── sports/              # Sports-specific (SportsFooter)
│   │   ├── stalls/              # Stalls-specific (StallsFooter)
│   │   └── ui/                  # Shared UI primitives and visual components
│   ├── context/
│   │   └── ThemeContext.tsx      # Global accent color context + provider
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── utils.ts             # cn() utility (clsx + tailwind-merge)
│   ├── Space/                   # Standalone 3D space project source (Vite + Three.js)
│   │   ├── src/
│   │   │   ├── main.js
│   │   │   ├── core/
│   │   │   ├── objects/
│   │   │   ├── physics/
│   │   │   └── ui/
│   │   └── public/textures/
│   └── types/
│       └── css.d.ts             # CSS module type declarations
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js config (images, rewrites, optimization)
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind config with color variable plugin
└── tsconfig.json                # TypeScript configuration
```

---

## 10. Overall UX Flow

### Typical Student Journey

```
1. LAND ON HOME DASHBOARD
   ├── See ORNATE '26 title with 3D solar system background
   ├── Explore left panel: Today's Missions / Updates
   ├── Explore right panel: Planetary Scanner (branches/clubs)
   └── Interact with central hologram → hover planets, enter pages

2. BROWSE EVENTS
   ├── Click MISSIONS in bottom nav → Full missions hub
   ├── Filter by: Branches (CSE, ECE...) / Clubs (ICRO, Artix...) / HHO
   ├── Search by title/description
   ├── Switch view: Grid / List / Stack
   └── Click mission card → View full details (venue, date, team size, XP)

3. CHECK SCHEDULE
   ├── Click SCHEDULE in bottom nav → Event Roadmap
   ├── Switch between Day 1 / Day 2 / Day 3
   ├── Filter by category or branch
   └── Scroll timeline → see events chronologically with animated spaceship

4. EXPLORE BRANCHES & CLUBS
   ├── Click FULL PLANETS VIEW → Planet View gateway
   ├── Choose Branches or Clubs
   ├── Solar system scroll/swipe to select planet
   ├── Enter branch/club detail page
   └── View: events, gallery (circular/dome/morph), video carousel, standings

5. ENJOY THE FEST
   ├── Visit STALLS → Browse 25 food/lifestyle stalls → View details/menu
   ├── Visit FEST → Choose Sports or Culturals
   ├── Visit FUN → Featured games carousel → Ms/Mr RGUKT pageant
   └── Visit GALLERY → Filter by branch/sport/cultural → Dome gallery viewer

6. STAY UPDATED
   ├── Home dashboard Updates tab → Latest news
   └── UPDATES page → Full feed filtered by Sports/Cultural/System

7. MANAGE PROFILE
   ├── Visit PROFILE → View/edit operative identity
   ├── Customize Ship → Select 3D model, change accent color (global theme)
   └── View QR code, stats, missions

8. SHARE THE EXPERIENCE
   ├── Fun Planet → "CLICK TO EXPERIENCE THE REAL UNIVERSE" → 3D space sim
   └── About → Learn about RGUKT, Ornate history, team
```

### Key UX Design Decisions

1. **Metaphor: Space Mission Control** — Every interaction is framed as a space mission. Events are "missions," departments are "planets," categories are "sectors," and navigation is "scanning/exploring."

2. **Dual-panel home screen** — The home page functions as a command center with glanceable information on both sides and 3D immersion in the center.

3. **Multiple gallery formats** — The same photo content is viewable through multiple novel interfaces (circular OGL gallery, CSS 3D dome, scroll-morph hero) providing visual variety.

4. **Progressive disclosure** — Mission filters use a stepped wizard (Type → Department/Club → Category), updates use expand-on-click, and menus use sub-menus on hover.

5. **Theme personalization** — The accent color system lets users make the entire app feel personal through 5 color options, persisted in localStorage.

---

## Appendix: Technology Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (New York) | via shadcn CLI |
| Animation | Framer Motion | 12.34.3 |
| 3D Graphics | Three.js + React Three Fiber + Drei | 0.183.x |
| WebGL Gallery | OGL | 1.0.11 |
| Icons | Lucide React | 0.575.0 |
| ORM | Prisma | 7.4.2 |
| Database | PostgreSQL (via @prisma/adapter-pg) | — |
| QR Code | react-qr-code | 2.0.18 |
| Gestures | @use-gesture/react | 10.3.1 |
| Utilities | clsx, tailwind-merge, class-variance-authority | — |
| External | Unicorn Studio (sponsors WebGL) | CDN |
