# Ornate '26 Student App — Production Implementation Plan

> **Objective:** Convert the Student App from 100% static/hardcoded data to a fully functional, production-ready application connected to the shared PostgreSQL database, with student authentication, event registration, team management, and real-time updates.

---

## Table of Contents

1. [Pre-Implementation Setup](#pre-implementation-setup)
2. [Phase 1: Foundation](#phase-1-foundation-auth--db--env--redis--rate-limiting)
3. [Phase 2: Read Layer](#phase-2-read-layer-replace-all-hardcoded-data)
4. [Phase 3: Write Layer](#phase-3-write-layer-student-interactions)
5. [Phase 4: Real-Time & Polish](#phase-4-real-time-and-polish)
6. [Deployment Configuration](#deployment-configuration)
7. [Migration & Integration Checklist](#migration--integration-checklist)

---

## Pre-Implementation Setup

### Dependencies Installation

```bash
npm install next-auth@4 ioredis zod sonner @aws-sdk/client-s3 @aws-sdk/s3-request-presigner bcryptjs
npm install -D @types/bcryptjs
```

**What each dependency does:**
| Package | Purpose |
|---|---|
| `next-auth@4` | Student authentication (Credentials + JWT) |
| `ioredis` | Redis client for caching + rate limiting |
| `zod` | Runtime validation for env vars, Server Actions, API inputs |
| `sonner` | Toast notifications for action feedback |
| `@aws-sdk/client-s3` | Cloudflare R2 uploads (avatar, screenshots) |
| `@aws-sdk/s3-request-presigner` | Presigned URLs for certificate downloads |
| `bcryptjs` | Password hashing for auth |

### Environment Variables

Create `.env.local`:

```env
# ─── Database ───────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/ornate_ems?connection_limit=5&pool_timeout=10"

# ─── NextAuth ───────────────────────────────────────────────
NEXTAUTH_SECRET="generate-a-64-char-random-secret-here"
NEXTAUTH_URL="https://student.ornate26.in"

# ─── Redis ──────────────────────────────────────────────────
REDIS_URL="redis://127.0.0.1:6379"

# ─── Cloudflare R2 ──────────────────────────────────────────
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="ornate-uploads"
R2_PUBLIC_URL="https://assets.ornate26.in"

# ─── App ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://student.ornate26.in"
```

### `next.config.ts` Changes Required

The existing config needs two modifications: add the R2 image domain and remove the rewrites that conflict with App Router pages.

**File:** `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        // Cloudflare R2 public bucket
        protocol: 'https',
        hostname: 'assets.ornate26.in',
      },
      {
        // R2 dev domain fallback
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Remove the rewrites — App Router pages take precedence
};

export default nextConfig;
```

---

## Phase 1: Foundation (Auth + DB + Env + Redis + Rate Limiting)

**Goal:** Establish authentication, validated environment, Redis connectivity, rate limiting, and a health check. Every subsequent phase depends on this.

### 1.1 — Environment Validation

**Create:** `src/lib/env.ts`

```ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().includes('connection_limit'),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  REDIS_URL: z.string().startsWith('redis://'),
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Check server logs.');
  }
  return parsed.data;
}

export const env = validateEnv();
```

**Data flow:**
```
process.env → Zod parse → typed `env` object
                ↓ (fail)
         throw Error → PM2 restarts process → visible in logs
```

---

### 1.2 — Redis Client

**Create:** `src/lib/redis.ts`

```ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null; // stop retrying
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
```

---

### 1.3 — Rate Limiting Utility

**Create:** `src/lib/rate-limit.ts`

```ts
import { redis } from './redis';

interface RateLimitConfig {
  /** Unique key prefix (e.g., 'login', 'register', 'action') */
  prefix: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding-window rate limiter backed by Redis.
 * Uses a sorted set with timestamps as scores.
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rl:${config.prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  const pipeline = redis.pipeline();
  // Remove expired entries
  pipeline.zremrangebyscore(key, 0, windowStart);
  // Count current entries
  pipeline.zcard(key);
  // Add current request
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  // Set TTL
  pipeline.expire(key, config.windowSeconds);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) ?? 0;

  const success = currentCount < config.limit;
  const remaining = Math.max(0, config.limit - currentCount - 1);
  const resetAt = now + config.windowSeconds * 1000;

  // If over limit, remove the entry we just added
  if (!success) {
    await redis.zremrangebyscore(key, now, now);
  }

  return { success, remaining, resetAt };
}

/** Pre-configured rate limiters */
export const rateLimiters = {
  /** General API: 100 req/min per IP */
  general: (ip: string) =>
    rateLimit(ip, { prefix: 'general', limit: 100, windowSeconds: 60 }),

  /** Login attempts: 5 req/5min per IP */
  login: (ip: string) =>
    rateLimit(ip, { prefix: 'login', limit: 5, windowSeconds: 300 }),

  /** Write actions: 10 req/min per user */
  action: (userId: string) =>
    rateLimit(userId, { prefix: 'action', limit: 10, windowSeconds: 60 }),
};
```

---

### 1.4 — Student Authentication (next-auth)

**Create:** `src/app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimiters } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Student Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit login attempts by IP
        const ip = req?.headers?.["x-forwarded-for"] ?? "unknown";
        const rl = await rateLimiters.login(typeof ip === 'string' ? ip : ip[0]);
        if (!rl.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || user.role !== "STUDENT") return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          branch: user.branch,
          currentYear: user.currentYear,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.branch = (user as any).branch;
        token.currentYear = (user as any).currentYear;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).branch = token.branch;
        (session.user as any).currentYear = token.currentYear;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Create:** `src/types/next-auth.d.ts`

```ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    branch?: string | null;
    currentYear?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      branch?: string | null;
      currentYear?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    branch?: string | null;
    currentYear?: string | null;
  }
}
```

**Create:** `src/lib/auth.ts` (helper)

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
```

**Create:** `src/components/providers/AuthProvider.tsx`

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Modify:** `src/app/layout.tsx` — wrap with AuthProvider and Toaster

```tsx
import type { Metadata } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import AuthProvider from '@/components/providers/AuthProvider';
import { Toaster } from 'sonner';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '700', '900']
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "Ornate '26 - A Fest Beyond Earth",
  description: 'A sci-fi themed fest dashboard',
  icons: {
    icon: '/assets/Ornate_LOGO.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${rajdhani.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'rgba(10, 15, 10, 0.9)',
                  border: '1px solid var(--color-neon)',
                  color: '#fff',
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.75rem',
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### 1.5 — Login Page

**Create:** `src/app/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Loader2, Shield, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid credentials or too many attempts. Try again.');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Starfield / ambient background — reuse existing pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--color-neon-rgb),0.05)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[var(--color-neon)] mb-6 font-[family-name:var(--font-orbitron)]"
        >
          <ArrowLeft className="w-3 h-3" /> RETURN TO BASE
        </Link>

        <div
          className="border border-gray-800 bg-black/80 backdrop-blur-xl p-8"
          style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-[var(--color-neon)]" />
            <h1 className="text-lg font-bold text-white font-[family-name:var(--font-orbitron)] tracking-wider">
              OPERATIVE LOGIN
            </h1>
          </div>

          <p className="text-xs text-gray-500 mb-6 font-[family-name:var(--font-rajdhani)]">
            Enter your credentials to access the Student Command Interface.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/30 p-3 mb-4 rounded">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-[family-name:var(--font-orbitron)] mb-1 block">
                Email Identifier
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/60 border border-gray-700 focus:border-[var(--color-neon)] text-white text-sm px-4 py-2.5 outline-none font-[family-name:var(--font-rajdhani)] transition-colors"
                placeholder="operative@rgukt.ac.in"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-[family-name:var(--font-orbitron)] mb-1 block">
                Access Code
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/60 border border-gray-700 focus:border-[var(--color-neon)] text-white text-sm px-4 py-2.5 outline-none font-[family-name:var(--font-rajdhani)] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/40 text-[var(--color-neon)] text-xs font-bold uppercase tracking-widest font-[family-name:var(--font-orbitron)] hover:bg-[var(--color-neon)]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'AUTHENTICATE'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
```

---

### 1.6 — Auth Middleware

**Create:** `src/middleware.ts`

```ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const protectedPaths = ['/profile', '/api/register', '/api/team'];
        const path = req.nextUrl.pathname;

        // Only require auth for protected paths
        const isProtected = protectedPaths.some(p => path.startsWith(p));
        if (isProtected && !token) return false;

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Match all routes except static files, _next, api/auth, and public assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|fonts|images|space|textures|api/auth|api/health).*)',
  ],
};
```

---

### 1.7 — Health Endpoint

**Create:** `src/app/api/health/route.ts`

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {
    database: 'error',
    redis: 'error',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (e) {
    console.error('[Health] DB check failed:', e);
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    console.error('[Health] Redis check failed:', e);
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok');

  return NextResponse.json(
    { status: allHealthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allHealthy ? 200 : 503 }
  );
}
```

---

### 1.8 — R2 Storage Client

**Create:** `src/lib/r2.ts`

```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const globalForR2 = globalThis as unknown as { r2: S3Client | undefined };

function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export const r2 = globalForR2.r2 ?? createR2Client();

if (process.env.NODE_ENV !== 'production') globalForR2.r2 = r2;

const BUCKET = process.env.R2_BUCKET_NAME ?? 'ornate-uploads';

/** Upload a file to R2, returns the public URL */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

/** Generate a presigned download URL (1 hour expiry) */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 }
  );
}
```

---

### Phase 1 — File Summary

| Action | File Path |
|---|---|
| **Create** | `src/lib/env.ts` |
| **Create** | `src/lib/redis.ts` |
| **Create** | `src/lib/rate-limit.ts` |
| **Create** | `src/lib/auth.ts` |
| **Create** | `src/lib/r2.ts` |
| **Create** | `src/app/api/auth/[...nextauth]/route.ts` |
| **Create** | `src/app/api/health/route.ts` |
| **Create** | `src/app/login/page.tsx` |
| **Create** | `src/types/next-auth.d.ts` |
| **Create** | `src/components/providers/AuthProvider.tsx` |
| **Create** | `src/middleware.ts` |
| **Modify** | `src/app/layout.tsx` (add AuthProvider + Toaster) |
| **Modify** | `next.config.ts` (add R2 domain, remove rewrites) |

---

## Phase 2: Read Layer (Replace All Hardcoded Data)

**Goal:** Replace every hardcoded constant with live database reads via Server Components and `unstable_cache()`. The UI components remain client-side — we split pages into a Server Component wrapper (data fetching) and a Client Component (rendering).

### Architecture Pattern: Server → Client Split

The existing pages are all `'use client'`. We refactor each page into:

```
src/app/missions/
  ├── page.tsx          ← Server Component (fetches data, passes as props)
  └── MissionsClient.tsx ← Client Component (existing UI, receives data as props)
```

**Data flow for every read:**
```
Browser Request
    ↓
Next.js Server Component (page.tsx)
    ↓
unstable_cache(fetchFn, [cacheKey], { tags: ['events'], revalidate: 60 })
    ↓ (cache miss)
Prisma query → PostgreSQL
    ↓ (cache hit)
Return cached data
    ↓
Props → Client Component → UI renders
```

### 2.0 — Shared Data Fetching Layer

**Create:** `src/lib/data/events.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type MissionData = {
  id: string;
  title: string;
  description: string;
  category: string;       // mapped from Event.category (e.g., "CSE" → "BRANCHES")
  subCategory: string;    // the actual category/branch/club name
  eventCategory: string;  // mapped from Event.eventType
  difficulty: string;     // derived from Event.customFields or mapped
  exp: number;            // derived from prizes or customFields
  deadline: string;
  slots: string;
  status: string;
  isPaid: boolean;
  eventDate: string;
  eventDay: string;
  venue: string;
  registered: number;
  totalSlots: number;
  isTeam: boolean;
  teamSize: number | null;
};

/**
 * Maps an Event row + its registration count to the MissionData shape
 * consumed by MissionCard component.
 */
function mapEventToMission(event: any, registrationCount: number): MissionData {
  // Determine category bucket: BRANCHES / CLUBS / HHO
  const branchSlugs = ['CSE', 'ECE', 'MECH', 'MECHANICAL', 'CIVIL', 'EE', 'EEE', 'HHO'];
  const clubSlugs = ['PIXLERO', 'SARVASRIJANA', 'ICRO', 'TECHXEL', 'ARTIX', 'KALADHARANI', 'KALADHARINI', 'KHELSAATHI', 'KHELSATHI'];

  const cat = (event.category ?? '').toUpperCase();
  let bucket: 'BRANCHES' | 'CLUBS' | 'HHO' = 'HHO';
  if (branchSlugs.includes(cat)) bucket = cat === 'HHO' ? 'HHO' : 'BRANCHES';
  else if (clubSlugs.includes(cat)) bucket = 'CLUBS';

  const festStart = new Date('2026-03-27');
  const eventDate = new Date(event.date);
  const dayDiff = Math.floor((eventDate.getTime() - festStart.getTime()) / 86400000) + 1;
  const dayLabel = `Day ${Math.max(1, Math.min(3, dayDiff))}`;

  // Deadline: either registration closes or "Open"
  const now = new Date();
  const endDate = event.endDate ? new Date(event.endDate) : eventDate;
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 3600000));
  const deadline = hoursLeft > 0 ? `${hoursLeft}H` : 'CLOSED';

  // Difficulty from customFields JSON (admin sets this), fallback to 'MEDIUM'
  const custom = event.customFields as Record<string, any> | null;
  const difficulty = custom?.difficulty ?? 'MEDIUM';
  const exp = custom?.xp ?? custom?.exp ?? 1000;

  return {
    id: event.id,
    title: event.title,
    description: event.shortDescription ?? event.description,
    category: bucket,
    subCategory: cat,
    eventCategory: (event.eventType ?? 'TECHNICAL').toUpperCase(),
    difficulty: difficulty.toUpperCase(),
    exp,
    deadline,
    slots: `${registrationCount}/${event.maxCapacity}`,
    status: registrationCount >= event.maxCapacity ? 'COMPLETED' : (event.registrationOpen ? 'OPEN' : 'IN_PROGRESS'),
    isPaid: event.price > 0,
    eventDate: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    eventDay: dayLabel,
    venue: event.venue,
    registered: registrationCount,
    totalSlots: event.maxCapacity,
    isTeam: (event.teamSizeMin ?? 0) > 1,
    teamSize: event.teamSizeMax,
  };
}

export const getPublishedEvents = unstable_cache(
  async (): Promise<MissionData[]> => {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        _count: { select: { Registration: true } },
      },
      orderBy: { date: 'asc' },
    });

    return events.map((e) => mapEventToMission(e, e._count.Registration));
  },
  ['published-events'],
  { tags: ['events'], revalidate: 60 }
);
```

**Create:** `src/lib/data/stalls.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type StallData = {
  id: string;
  name: string;
  no: string;
  team: string;
  price: string;
  rating: string;
  description: string;
  color: string;
  type: string;
};

export const getStalls = unstable_cache(
  async (): Promise<StallData[]> => {
    const stalls = await prisma.stall.findMany({
      where: { status: { not: 'Vacant' } },
      orderBy: { name: 'asc' },
    });

    return stalls.map((s) => ({
      id: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: s.name,
      no: String(s.id).padStart(2, '0'),
      team: s.owner,
      price: s.bidAmount,
      rating: '4.5',   // Stall model has no rating field — use default
      description: `${s.type} stall by ${s.owner}`,
      color: 'var(--color-neon)',
      type: s.type.toLowerCase(),
    }));
  },
  ['stalls-list'],
  { tags: ['stalls'], revalidate: 60 }
);
```

**Create:** `src/lib/data/announcements.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type AnnouncementData = {
  id: string;
  category: string;
  priority: string;
  title: string;
  time: string;
  desc: string;
  tag: string;
};

export const getActiveAnnouncements = unstable_cache(
  async (): Promise<AnnouncementData[]> => {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'active',
        expiryDate: { gt: now },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return announcements.map((a) => {
      const createdAt = new Date(a.createdAt);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const timeLabel = diffHrs < 1 ? 'Just now' :
                       diffHrs < 24 ? `${diffHrs}h ago` :
                       `${Math.floor(diffHrs / 24)}d ago`;

      return {
        id: a.id,
        category: a.category.toUpperCase(),
        priority: a.isPinned ? 'CRITICAL' : 'NORMAL',
        title: a.title,
        time: timeLabel,
        desc: a.content,
        tag: a.targetAudience,
      };
    });
  },
  ['active-announcements'],
  { tags: ['announcements'], revalidate: 30 }
);
```

**Create:** `src/lib/data/sports.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type SportData = {
  id: string;
  name: string;
  gender: string;
  category: string;
  format: string;
  status: string;
  description: string;
  icon: string | null;
  bannerUrl: string | null;
  matches: MatchData[];
  branchPoints: BranchPointData[];
};

export type MatchData = {
  id: string;
  round: string;
  team1Name: string;
  team2Name: string;
  score1: string | null;
  score2: string | null;
  venue: string | null;
  date: string | null;
  time: string | null;
  status: string;
  winner: string | null;
};

export type BranchPointData = {
  branch: string;
  points: number;
};

export const getSportsData = unstable_cache(
  async (): Promise<SportData[]> => {
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      include: {
        Match: {
          orderBy: [{ date: 'asc' }, { matchOrder: 'asc' }],
        },
        BranchPoints: {
          orderBy: { points: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sports.map((s) => ({
      id: s.id,
      name: s.name,
      gender: s.gender,
      category: s.category,
      format: s.format,
      status: s.status,
      description: s.description ?? '',
      icon: s.icon,
      bannerUrl: s.bannerUrl,
      matches: s.Match.map((m) => ({
        id: m.id,
        round: m.round,
        team1Name: m.team1Name ?? 'TBD',
        team2Name: m.team2Name ?? 'TBD',
        score1: m.score1,
        score2: m.score2,
        venue: m.venue,
        date: m.date?.toISOString() ?? null,
        time: m.time,
        status: m.status,
        winner: m.winner,
      })),
      branchPoints: s.BranchPoints.map((bp) => ({
        branch: bp.branch,
        points: bp.points + bp.manualAdjustment,
      })),
    }));
  },
  ['sports-data'],
  { tags: ['sports', 'branch-points'], revalidate: 60 }
);
```

**Create:** `src/lib/data/gallery.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type AlbumData = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  tags: string[];
  images: { id: string; url: string; caption: string | null }[];
};

export const getGalleryAlbums = unstable_cache(
  async (): Promise<AlbumData[]> => {
    const albums = await prisma.galleryAlbum.findMany({
      where: { isArchived: false },
      include: {
        GalleryImage: { orderBy: { uploadedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return albums.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      coverImage: a.coverImage ?? a.GalleryImage[0]?.url ?? null,
      tags: a.tags,
      images: a.GalleryImage.map((img) => ({
        id: img.id,
        url: img.url,
        caption: img.caption,
      })),
    }));
  },
  ['gallery-albums'],
  { tags: ['gallery'], revalidate: 120 }
);
```

**Create:** `src/lib/data/fest-settings.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type FestSettingsData = {
  festName: string;
  tagline: string | null;
  logoUrl: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  supportEmail: string | null;
};

export const getFestSettings = unstable_cache(
  async (): Promise<FestSettingsData> => {
    const settings = await prisma.festSettings.findFirst({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return {
        festName: 'ORNATE 2K26',
        tagline: 'Innovation Meets Culture',
        logoUrl: null,
        description: 'The biggest technical and cultural fest of RGUKT Ongole',
        startDate: '2026-03-27',
        endDate: '2026-03-29',
        venue: 'RGUKT Ongole Campus',
        registrationOpen: true,
        maintenanceMode: false,
        instagramUrl: null,
        youtubeUrl: null,
        supportEmail: null,
      };
    }

    return {
      festName: settings.festName,
      tagline: settings.tagline,
      logoUrl: settings.logoUrl,
      description: settings.description,
      startDate: settings.startDate?.toISOString() ?? null,
      endDate: settings.endDate?.toISOString() ?? null,
      venue: settings.venue,
      registrationOpen: settings.registrationOpen,
      maintenanceMode: settings.maintenanceMode,
      instagramUrl: settings.instagramUrl,
      youtubeUrl: settings.youtubeUrl,
      supportEmail: settings.supportEmail,
    };
  },
  ['fest-settings'],
  { tags: ['fest-settings'], revalidate: 120 }
);
```

**Create:** `src/lib/data/winners.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type WinnerData = {
  eventId: string;
  eventTitle: string;
  positions: any; // JSON: { first: {...}, second: {...}, third: {...} }
  publishedAt: string | null;
};

export type SportWinnerData = {
  sportId: string;
  sportName: string;
  positions: any;
  publishedAt: string | null;
};

export const getEventWinners = unstable_cache(
  async (): Promise<WinnerData[]> => {
    const winners = await prisma.winnerAnnouncement.findMany({
      where: { isPublished: true },
      include: { Event: { select: { title: true } } },
      orderBy: { publishedAt: 'desc' },
    });

    return winners.map((w) => ({
      eventId: w.eventId,
      eventTitle: w.Event.title,
      positions: w.positions,
      publishedAt: w.publishedAt?.toISOString() ?? null,
    }));
  },
  ['event-winners'],
  { tags: ['event-winners'], revalidate: 120 }
);

export const getSportWinners = unstable_cache(
  async (): Promise<SportWinnerData[]> => {
    const winners = await prisma.sportWinnerAnnouncement.findMany({
      where: { isPublished: true },
      include: { Sport: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' },
    });

    return winners.map((w) => ({
      sportId: w.sportId,
      sportName: w.Sport.name,
      positions: w.positions,
      publishedAt: w.publishedAt?.toISOString() ?? null,
    }));
  },
  ['sport-winners'],
  { tags: ['sport-winners'], revalidate: 120 }
);
```

**Create:** `src/lib/data/videos.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type VideoData = {
  id: string;
  title: string;
  url: string;
  platform: string;
  thumbnail: string | null;
  duration: string | null;
};

export const getPromoVideos = unstable_cache(
  async (): Promise<VideoData[]> => {
    const videos = await prisma.promoVideo.findMany({
      where: { status: 'active' },
      orderBy: { uploadDate: 'desc' },
    });

    return videos.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      platform: v.platform,
      thumbnail: v.thumbnail,
      duration: v.duration,
    }));
  },
  ['promo-videos'],
  { tags: ['promo-videos'], revalidate: 300 }
);
```

**Create:** `src/lib/data/best-outgoing.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type BestOutgoingData = {
  id: string;
  name: string;
  rollNumber: string;
  photo: string | null;
  branch: string;
  year: string;
  cgpa: number;
  achievements: string[];
  company: string | null;
  gender: string;
  awardYear: number;
  isOverall: boolean;
};

export const getBestOutgoingStudents = unstable_cache(
  async (): Promise<BestOutgoingData[]> => {
    const students = await prisma.bestOutgoingStudent.findMany({
      where: { isPublished: true },
      orderBy: [{ isOverall: 'desc' }, { cgpa: 'desc' }],
    });

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      photo: s.photo,
      branch: s.branch,
      year: s.year,
      cgpa: s.cgpa,
      achievements: s.achievements,
      company: s.company,
      gender: s.gender,
      awardYear: s.awardYear,
      isOverall: s.isOverall,
    }));
  },
  ['best-outgoing'],
  { tags: ['best-outgoing'], revalidate: 300 }
);
```

---

### 2.1 — Missions Page Refactor (Item 6)

**Current state:** `src/app/missions/page.tsx` is a 1350-line `'use client'` component with `MISSIONS` exported at the top.

**Strategy:** Extract the Client Component, make the page a Server Component.

**Rename:** `src/app/missions/page.tsx` → `src/app/missions/MissionsClient.tsx`

**Changes to `MissionsClient.tsx`:**
1. Remove `export const MISSIONS: Mission[] = [...]` (the entire hardcoded array)
2. Keep `'use client'` directive
3. Accept `missions` as a prop
4. Export as default `MissionsClient`

```tsx
// src/app/missions/MissionsClient.tsx
'use client';

import { useState, useRef, useEffect, memo, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ... all existing imports ...
import MissionCard, { Mission } from '@/components/missions/MissionCard';
// ... rest of imports ...

// ─── Filter Config (keep — these are static UI config, not data) ─────
const BRANCH_SUBS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EE'];
const CLUB_SUBS = ['PIXLERO', 'SARVASRIJANA', 'ICRO', 'TECHXEL', 'ARTIX', 'KALADHARINI', 'KHELSATHI'];
const HHO_SUBS = ['TECHNICAL', 'CULTURAL', 'SPORTS', 'FUN', 'WORKSHOPS', 'HACKATHONS', 'GAMING'];
const EVENT_CATS = ['TECHNICAL', 'CULTURAL', 'SPORTS', 'FUN', 'WORKSHOPS', 'HACKATHONS', 'GAMING'];
// ... (keep all filter config, EVENT_META, DISPLAY, etc.) ...

interface MissionsClientProps {
  missions: Mission[];
}

export default function MissionsClient({ missions }: MissionsClientProps) {
  // Replace every reference to MISSIONS with the `missions` prop
  // The rest of the component stays identical
  // ...
}
```

**Create new:** `src/app/missions/page.tsx` (Server Component)

```tsx
import { getPublishedEvents } from '@/lib/data/events';
import MissionsClient from './MissionsClient';
import type { Mission } from '@/components/missions/MissionCard';

export default async function MissionsPage() {
  const events = await getPublishedEvents();

  // Map to the Mission type expected by MissionCard
  const missions: Mission[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category as Mission['category'],
    subCategory: e.subCategory,
    eventCategory: e.eventCategory,
    difficulty: e.difficulty as Mission['difficulty'],
    exp: e.exp,
    deadline: e.deadline,
    slots: e.slots,
    status: e.status as Mission['status'],
    isPaid: e.isPaid,
    eventDate: e.eventDate,
    eventDay: e.eventDay,
    venue: e.venue,
    registered: e.registered,
    totalSlots: e.totalSlots,
    isTeam: e.isTeam,
    teamSize: e.teamSize ?? undefined,
  }));

  return <MissionsClient missions={missions} />;
}
```

**Create:** `src/app/missions/loading.tsx` (skeleton)

```tsx
export default function MissionsLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--color-neon)]/60 font-[family-name:var(--font-orbitron)] tracking-widest animate-pulse">
          LOADING MISSIONS DATABASE...
        </p>
      </div>
    </div>
  );
}
```

---

### 2.2 — Roadmap Page Refactor (Item 16)

**Current state:** `src/app/roadmap/page.tsx` imports `MISSIONS` from `../missions/page` and transforms it.

**Strategy:** Same split. Server Component fetches events, transforms to roadmap format, passes to Client Component.

**Rename:** `src/app/roadmap/page.tsx` → `src/app/roadmap/RoadmapClient.tsx`

**Changes to `RoadmapClient.tsx`:**
1. Remove the `import { MISSIONS } from '../missions/page'` line
2. Remove the `const EVENTS = MISSIONS.map(...)` derivation
3. Accept `events` as a prop

```tsx
// Top of RoadmapClient.tsx
'use client';

// ... existing imports MINUS the MISSIONS import ...

interface RoadmapEvent {
  id: string;
  title: string;
  timeStr: string;
  type: string | undefined;
  description: string;
  venue: string;
  origin: string;
  category: string;
  subCategory: string;
  day: number;
}

interface RoadmapClientProps {
  events: RoadmapEvent[];
}

export default function RoadmapClient({ events }: RoadmapClientProps) {
  // Replace EVENTS references with the `events` prop
  // ...
}
```

**Create new:** `src/app/roadmap/page.tsx`

```tsx
import { getPublishedEvents } from '@/lib/data/events';
import RoadmapClient from './RoadmapClient';

export default async function RoadmapPage() {
  const missions = await getPublishedEvents();

  const events = missions.map((mission) => {
    const dayMatch = mission.eventDay?.match(/Day (\d)/i);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;

    // Use actual start time from event if available, fallback to ID-based spread
    const hour = 9 + (parseInt(mission.id.replace(/\D/g, '') || '0', 10) % 12);
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;

    return {
      id: mission.id,
      title: mission.title,
      timeStr,
      type: mission.eventCategory,
      description: mission.description,
      venue: mission.venue || 'Unknown Location',
      origin: mission.subCategory || mission.category,
      category: mission.category.toLowerCase(),
      subCategory: mission.subCategory?.toLowerCase() || 'all',
      day,
    };
  });

  return <RoadmapClient events={events} />;
}
```

**Create:** `src/app/roadmap/loading.tsx`

```tsx
export default function RoadmapLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--color-neon)]/60 font-[family-name:var(--font-orbitron)] tracking-widest animate-pulse">
          PLOTTING NAVIGATION COURSE...
        </p>
      </div>
    </div>
  );
}
```

---

### 2.3 — Stalls Page Refactor (Item 7)

**Rename:** `src/app/stalls/page.tsx` → `src/app/stalls/StallsClient.tsx`

**Changes to `StallsClient.tsx`:**
1. Remove `import { STALLS } from './constants'`
2. Accept `stalls` as a prop

**Create new:** `src/app/stalls/page.tsx`

```tsx
import { getStalls } from '@/lib/data/stalls';
import StallsClient from './StallsClient';

export default async function StallsPage() {
  const stalls = await getStalls();
  return <StallsClient stalls={stalls} />;
}
```

**Modify:** `src/app/stalls/[id]/page.tsx` — Make Server Component wrapper

**Rename:** `src/app/stalls/[id]/page.tsx` → `src/app/stalls/[id]/StallDetailClient.tsx`

**Create new:** `src/app/stalls/[id]/page.tsx`

```tsx
import { getStalls } from '@/lib/data/stalls';
import StallDetailClient from './StallDetailClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StallDetailPage({ params }: Props) {
  const { id } = await params;
  const stalls = await getStalls();
  const stall = stalls.find((s) => s.id === id);

  if (!stall) notFound();

  return <StallDetailClient stall={stall} />;
}
```

**Note:** `src/app/stalls/constants.ts` will be kept temporarily as a fallback but no longer imported by any page. Remove it after verification.

**Create:** `src/app/stalls/loading.tsx`

```tsx
export default function StallsLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--color-neon)]/60 font-[family-name:var(--font-orbitron)] tracking-widest animate-pulse">
          SCANNING SECTOR STALLS...
        </p>
      </div>
    </div>
  );
}
```

---

### 2.4 — Updates/Announcements Page Refactor (Item 8)

**Rename:** `src/app/updates/page.tsx` → `src/app/updates/UpdatesClient.tsx`

**Changes to `UpdatesClient.tsx`:**
1. Remove the hardcoded `UPDATES` array
2. Accept `updates` as a prop
3. Replace icon references — since DB announcements don't have React icon components, map category to icon in the client

```tsx
// In UpdatesClient.tsx, add icon mapping:
const CATEGORY_ICONS: Record<string, ElementType> = {
  SPORTS: Trophy,
  CULTURAL: Music,
  SYSTEM: Shield,
  // add more as needed
};
```

**Create new:** `src/app/updates/page.tsx`

```tsx
import { getActiveAnnouncements } from '@/lib/data/announcements';
import UpdatesClient from './UpdatesClient';

export default async function UpdatesPage() {
  const updates = await getActiveAnnouncements();
  return <UpdatesClient updates={updates} />;
}
```

**Create:** `src/app/updates/loading.tsx`

```tsx
export default function UpdatesLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--color-neon)]/60 font-[family-name:var(--font-orbitron)] tracking-widest animate-pulse">
          RECEIVING TRANSMISSIONS...
        </p>
      </div>
    </div>
  );
}
```

---

### 2.5 — Sports Page Refactor (Item 9)

**Rename:** `src/app/fest/sports/page.tsx` → `src/app/fest/sports/SportsClient.tsx`

**Changes to `SportsClient.tsx`:**
1. Remove all hardcoded arrays: `highlightsData`, `SPORTS_GALLERY_IMAGES`, `sportsCards`, `STANDINGS_CATEGORIES`
2. Accept `sports`, `galleryImages`, `winners`, `announcements` as props

**Create new:** `src/app/fest/sports/page.tsx`

```tsx
import { getSportsData } from '@/lib/data/sports';
import { getSportWinners } from '@/lib/data/winners';
import { getGalleryAlbums } from '@/lib/data/gallery';
import { getActiveAnnouncements } from '@/lib/data/announcements';
import SportsClient from './SportsClient';

export default async function SportsPage() {
  const [sports, winners, albums, announcements] = await Promise.all([
    getSportsData(),
    getSportWinners(),
    getGalleryAlbums(),
    getActiveAnnouncements(),
  ]);

  // Filter gallery for sports-tagged albums
  const sportsAlbums = albums.filter((a) =>
    a.tags.some((t) => t.toLowerCase().includes('sport'))
  );

  const sportsAnnouncements = announcements.filter(
    (a) => a.category === 'SPORTS'
  );

  return (
    <SportsClient
      sports={sports}
      winners={winners}
      galleryAlbums={sportsAlbums}
      announcements={sportsAnnouncements}
    />
  );
}
```

---

### 2.6 — Gallery Page Refactor (Item 10)

**Rename:** `src/app/gallery/page.tsx` → `src/app/gallery/GalleryClient.tsx`

**Changes to `GalleryClient.tsx`:**
1. Remove hardcoded `BRANCHES`, `SPORTS_ALBUMS`, `CULTURAL_ALBUMS`
2. Accept `albums` prop — categorized by tags

**Create new:** `src/app/gallery/page.tsx`

```tsx
import { getGalleryAlbums } from '@/lib/data/gallery';
import GalleryClient from './GalleryClient';

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();

  // Categorize albums by tags for the filter UI
  const categorized = {
    all: albums,
    branches: albums.filter((a) =>
      a.tags.some((t) => ['cse', 'ece', 'eee', 'mechanical', 'civil', 'hho'].includes(t.toLowerCase()))
    ),
    sports: albums.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes('sport'))
    ),
    culturals: albums.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes('cultural'))
    ),
  };

  return <GalleryClient categorizedAlbums={categorized} />;
}
```

---

### 2.7 — Branch/Club Detail Page Refactor (Item 11)

**Current state:** `src/app/branches/[slug]/page.tsx` has a `getBranchData(slug)` function returning fully hardcoded data.

**Create:** `src/lib/data/branch-detail.ts`

```ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { MissionData } from './events';

export type BranchDetailData = {
  slug: string;
  name: string;
  description: string;
  updates: string[];
  events: MissionData[];
  hallOfFame: any[];
  winners: any[];
  videos: { title: string; url: string; thumbnail: string | null }[];
  gallery: string[];
  standings: { sport: string; branch: string; points: number }[];
};

export const getBranchDetail = unstable_cache(
  async (slug: string): Promise<BranchDetailData | null> => {
    // Normalize slug to category name
    const slugToCategory: Record<string, string> = {
      cse: 'CSE', ece: 'ECE', eee: 'EEE', mechanical: 'MECH',
      civil: 'CIVIL', hho: 'HHO',
      artix: 'ARTIX', kaladharani: 'KALADHARANI', icro: 'ICRO',
      khelsaathi: 'KHELSAATHI', pixelro: 'PIXLERO',
      sarvasrijana: 'SARVASRIJANA', techxcel: 'TECHXEL',
    };

    const category = slugToCategory[slug.toLowerCase()];
    if (!category) return null;

    const [events, albums, videos, branchPoints, announcements, eventWinners] =
      await Promise.all([
        prisma.event.findMany({
          where: { status: 'PUBLISHED', category },
          include: { _count: { select: { Registration: true } } },
          orderBy: { date: 'asc' },
          take: 20,
        }),
        prisma.galleryAlbum.findMany({
          where: { tags: { has: slug.toLowerCase() }, isArchived: false },
          include: { GalleryImage: { take: 20 } },
        }),
        prisma.promoVideo.findMany({
          where: { status: 'active' },
          take: 10,
        }),
        prisma.branchPoints.findMany({
          where: { branch: category },
          include: { Sport: { select: { name: true } } },
        }),
        prisma.announcement.findMany({
          where: { category, status: 'active', expiryDate: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.winnerAnnouncement.findMany({
          where: {
            isPublished: true,
            Event: { category },
          },
          include: { Event: { select: { title: true } } },
        }),
      ]);

    const galleryUrls = albums.flatMap((a) => a.GalleryImage.map((img) => img.url));

    return {
      slug,
      name: category,
      description: `Events and activities for ${category}`,
      updates: announcements.map((a) => a.title),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.shortDescription ?? e.description,
        category: 'BRANCHES',
        subCategory: category,
        eventCategory: (e.eventType ?? 'TECHNICAL').toUpperCase(),
        difficulty: ((e.customFields as any)?.difficulty ?? 'MEDIUM').toUpperCase(),
        exp: (e.customFields as any)?.xp ?? 1000,
        deadline: 'OPEN',
        slots: `${e._count.Registration}/${e.maxCapacity}`,
        status: e.registrationOpen ? 'OPEN' : 'IN_PROGRESS',
        isPaid: e.price > 0,
        eventDate: e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        eventDay: 'Day 1',
        venue: e.venue,
        registered: e._count.Registration,
        totalSlots: e.maxCapacity,
        isTeam: (e.teamSizeMin ?? 0) > 1,
        teamSize: e.teamSizeMax,
      })),
      hallOfFame: eventWinners.map((w) => ({
        eventTitle: w.Event.title,
        positions: w.positions,
      })),
      winners: [],
      videos: videos.map((v) => ({
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail,
      })),
      gallery: galleryUrls,
      standings: branchPoints.map((bp) => ({
        sport: bp.Sport.name,
        branch: bp.branch,
        points: bp.points + bp.manualAdjustment,
      })),
    };
  },
  ['branch-detail'],
  { tags: ['events', 'gallery', 'promo-videos', 'branch-points', 'announcements', 'event-winners'], revalidate: 60 }
);
```

**Rename:** `src/app/branches/[slug]/page.tsx` → `src/app/branches/[slug]/BranchDetailClient.tsx`
- Remove `getBranchData()` function
- Accept all data as props

**Create new:** `src/app/branches/[slug]/page.tsx`

```tsx
import { getBranchDetail } from '@/lib/data/branch-detail';
import BranchDetailClient from './BranchDetailClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BranchDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getBranchDetail(slug);

  if (!data) notFound();

  return <BranchDetailClient data={data} />;
}
```

**Repeat identically for:** `src/app/clubs/[slug]/page.tsx` — use the same `getBranchDetail` function (it handles both branch and club slugs via the mapping).

---

### 2.8 — Culturals Page Refactor

Same pattern as Sports. Rename existing to `CulturalsClient.tsx`, create Server Component wrapper that fetches from DB.

---

### 2.9 — Fest Settings Integration (Item 14)

**Modify:** `src/app/page.tsx` (Home page)

The home page is a `'use client'` component. Since it mainly handles navigation and UI, the fest settings data can be injected via a wrapper:

**Rename:** `src/app/page.tsx` → `src/app/HomeClient.tsx`

**Create new:** `src/app/page.tsx`

```tsx
import { getFestSettings } from '@/lib/data/fest-settings';
import { getActiveAnnouncements } from '@/lib/data/announcements';
import { getPublishedEvents } from '@/lib/data/events';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const [settings, announcements, events] = await Promise.all([
    getFestSettings(),
    getActiveAnnouncements(),
    getPublishedEvents(),
  ]);

  // Today's events
  const today = new Date().toISOString().split('T')[0];
  const todaysMissions = events.filter((e) =>
    e.eventDate.includes(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  ).slice(0, 5);

  return (
    <HomeClient
      festSettings={settings}
      announcements={announcements.slice(0, 5)}
      todaysMissions={todaysMissions}
    />
  );
}
```

---

### 2.10 — Best Outgoing Students (Item 15)

Used in branch detail Hall of Fame sections. Already included in `getBranchDetail`. For a dedicated display:

```tsx
// In any page that shows Hall of Fame:
import { getBestOutgoingStudents } from '@/lib/data/best-outgoing';

const students = await getBestOutgoingStudents();
// Pass as prop to client component
```

---

### Phase 2 — File Summary

| Action | File Path |
|---|---|
| **Create** | `src/lib/data/events.ts` |
| **Create** | `src/lib/data/stalls.ts` |
| **Create** | `src/lib/data/announcements.ts` |
| **Create** | `src/lib/data/sports.ts` |
| **Create** | `src/lib/data/gallery.ts` |
| **Create** | `src/lib/data/fest-settings.ts` |
| **Create** | `src/lib/data/winners.ts` |
| **Create** | `src/lib/data/videos.ts` |
| **Create** | `src/lib/data/best-outgoing.ts` |
| **Create** | `src/lib/data/branch-detail.ts` |
| **Rename + Modify** | `src/app/missions/page.tsx` → `MissionsClient.tsx` |
| **Create** | `src/app/missions/page.tsx` (Server Component) |
| **Create** | `src/app/missions/loading.tsx` |
| **Rename + Modify** | `src/app/roadmap/page.tsx` → `RoadmapClient.tsx` |
| **Create** | `src/app/roadmap/page.tsx` (Server Component) |
| **Create** | `src/app/roadmap/loading.tsx` |
| **Rename + Modify** | `src/app/stalls/page.tsx` → `StallsClient.tsx` |
| **Create** | `src/app/stalls/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/stalls/[id]/page.tsx` → `StallDetailClient.tsx` |
| **Create** | `src/app/stalls/[id]/page.tsx` (Server Component) |
| **Create** | `src/app/stalls/loading.tsx` |
| **Rename + Modify** | `src/app/updates/page.tsx` → `UpdatesClient.tsx` |
| **Create** | `src/app/updates/page.tsx` (Server Component) |
| **Create** | `src/app/updates/loading.tsx` |
| **Rename + Modify** | `src/app/fest/sports/page.tsx` → `SportsClient.tsx` |
| **Create** | `src/app/fest/sports/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/fest/culturals/page.tsx` → `CulturalsClient.tsx` |
| **Create** | `src/app/fest/culturals/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/gallery/page.tsx` → `GalleryClient.tsx` |
| **Create** | `src/app/gallery/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/branches/[slug]/page.tsx` → `BranchDetailClient.tsx` |
| **Create** | `src/app/branches/[slug]/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/clubs/[slug]/page.tsx` → `ClubDetailClient.tsx` |
| **Create** | `src/app/clubs/[slug]/page.tsx` (Server Component) |
| **Rename + Modify** | `src/app/page.tsx` → `HomeClient.tsx` |
| **Create** | `src/app/page.tsx` (Server Component) |

---

## Phase 3: Write Layer (Student Interactions)

**Goal:** Enable students to register for events, create/join teams, manage profiles, and download certificates.

### Architecture Pattern: Server Actions

All mutations use Next.js Server Actions. Each action:
1. Validates input with Zod
2. Checks auth via `requireAuth()`
3. Rate limits via `rateLimiters.action(userId)`
4. Performs DB operation in transaction where needed
5. Returns `{ success: boolean, error?: string, data?: any }`

### 3.1 — Event Registration (Item 17)

**Create:** `src/lib/actions/register-event.ts`

```ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

const RegisterEventSchema = z.object({
  eventId: z.string().min(1),
});

export async function registerForEvent(input: z.infer<typeof RegisterEventSchema>) {
  try {
    const user = await requireAuth();

    // Rate limit
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests. Slow down, operative.' };

    const parsed = RegisterEventSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input.' };

    const { eventId } = parsed.data;

    // Fetch event with capacity check
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { Registration: true } } },
    });

    if (!event) return { success: false, error: 'Event not found.' };
    if (event.status !== 'PUBLISHED') return { success: false, error: 'Event is not open for registration.' };
    if (!event.registrationOpen) return { success: false, error: 'Registration is closed.' };
    if (event._count.Registration >= event.maxCapacity) return { success: false, error: 'Event is full.' };

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: { eventId_studentId: { eventId, studentId: user.id } },
    });
    if (existing) return { success: false, error: 'Already registered for this event.' };

    // Get user details
    const userData = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userData) return { success: false, error: 'User not found.' };

    // Create registration
    await prisma.registration.create({
      data: {
        id: crypto.randomUUID(),
        eventId,
        userId: user.id,
        studentName: userData.name ?? 'Unknown',
        studentId: user.id,
        status: event.price > 0 ? 'PENDING' : 'CONFIRMED',
        paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
        amount: event.price,
        email: userData.email,
        phone: userData.phone,
        branch: userData.branch,
        year: userData.currentYear,
      },
    });

    revalidateTag('events');
    revalidateTag('registrations');

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in first.' };
    console.error('[registerForEvent]', error);
    return { success: false, error: 'Registration failed. Try again.' };
  }
}
```

### 3.2 — Team Creation (Item 18)

**Create:** `src/lib/actions/team.ts`

```ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

const CreateTeamSchema = z.object({
  eventId: z.string().min(1),
  teamName: z.string().min(2).max(50),
});

const JoinTeamSchema = z.object({
  teamCode: z.string().min(1).max(20),
});

function generateTeamCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., "A3F2B1"
}

export async function createTeam(input: z.infer<typeof CreateTeamSchema>) {
  try {
    const user = await requireAuth();
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests.' };

    const parsed = CreateTeamSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input.' };

    const { eventId, teamName } = parsed.data;

    // Validate event is team-based
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found.' };
    if ((event.teamSizeMin ?? 0) < 2) return { success: false, error: 'This event is not team-based.' };

    // Get user data
    const userData = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userData) return { success: false, error: 'User not found.' };

    const teamCode = generateTeamCode();

    // Transaction: create Registration + Team + TeamMember (leader)
    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          id: crypto.randomUUID(),
          eventId,
          userId: user.id,
          studentName: userData.name ?? 'Unknown',
          studentId: user.id,
          status: 'PENDING',
          paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
          amount: event.price,
          email: userData.email,
          phone: userData.phone,
          branch: userData.branch,
          year: userData.currentYear,
        },
      });

      const team = await tx.team.create({
        data: {
          id: crypto.randomUUID(),
          teamName,
          teamCode,
          eventId,
          leaderId: user.id,
          leaderName: userData.name ?? 'Unknown',
          leaderEmail: userData.email,
          leaderPhone: userData.phone,
          registrationId: registration.id,
          status: 'PENDING',
          paymentStatus: event.price > 0 ? 'PENDING' : 'PAID',
          amount: event.price,
          updatedAt: new Date(),
        },
      });

      await tx.teamMember.create({
        data: {
          id: crypto.randomUUID(),
          teamId: team.id,
          userId: user.id,
          name: userData.name ?? 'Unknown',
          email: userData.email,
          phone: userData.phone,
          rollNumber: user.id,
          department: userData.branch,
          year: userData.currentYear,
          role: 'LEADER',
          status: 'ACCEPTED',
        },
      });

      return { teamCode: team.teamCode, teamId: team.id };
    });

    revalidateTag('events');
    revalidateTag('registrations');

    return { success: true, data: result };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in first.' };
    console.error('[createTeam]', error);
    return { success: false, error: 'Team creation failed.' };
  }
}

export async function joinTeam(input: z.infer<typeof JoinTeamSchema>) {
  try {
    const user = await requireAuth();
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests.' };

    const parsed = JoinTeamSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid team code.' };

    const { teamCode } = parsed.data;

    const team = await prisma.team.findUnique({
      where: { teamCode },
      include: {
        Event: true,
        TeamMember: true,
      },
    });

    if (!team) return { success: false, error: 'Team not found. Check the code.' };
    if (team.isLocked) return { success: false, error: 'Team is locked.' };

    // Check team size
    const maxSize = team.Event?.teamSizeMax ?? 10;
    if (team.TeamMember.length >= maxSize) return { success: false, error: 'Team is full.' };

    // Check not already a member
    const isMember = team.TeamMember.some((m) => m.userId === user.id);
    if (isMember) return { success: false, error: 'Already in this team.' };

    const userData = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userData) return { success: false, error: 'User not found.' };

    await prisma.teamMember.create({
      data: {
        id: crypto.randomUUID(),
        teamId: team.id,
        userId: user.id,
        name: userData.name ?? 'Unknown',
        email: userData.email,
        phone: userData.phone,
        rollNumber: user.id,
        department: userData.branch,
        year: userData.currentYear,
        role: 'MEMBER',
        status: 'ACCEPTED',
      },
    });

    revalidateTag('registrations');

    return { success: true, data: { teamName: team.teamName } };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in first.' };
    console.error('[joinTeam]', error);
    return { success: false, error: 'Failed to join team.' };
  }
}
```

### 3.3 — Sport Registration (Item 20)

**Create:** `src/lib/actions/register-sport.ts`

```ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { revalidateTag } from 'next/cache';
import crypto from 'crypto';

const RegisterSportSchema = z.object({
  sportId: z.string().min(1),
});

export async function registerForSport(input: z.infer<typeof RegisterSportSchema>) {
  try {
    const user = await requireAuth();
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests.' };

    const parsed = RegisterSportSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input.' };

    const { sportId } = parsed.data;

    const sport = await prisma.sport.findUnique({ where: { id: sportId } });
    if (!sport) return { success: false, error: 'Sport not found.' };
    if (sport.status !== 'REGISTRATION_OPEN') return { success: false, error: 'Registration is not open for this sport.' };

    // Check already registered
    const existing = await prisma.sportRegistration.findUnique({
      where: { sportId_studentId: { sportId, studentId: user.id } },
    });
    if (existing) return { success: false, error: 'Already registered.' };

    const userData = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userData) return { success: false, error: 'User not found.' };

    await prisma.sportRegistration.create({
      data: {
        id: crypto.randomUUID(),
        sportId,
        studentName: userData.name ?? 'Unknown',
        studentId: user.id,
        email: userData.email,
        phone: userData.phone,
        branch: userData.branch,
        year: userData.currentYear,
        status: 'CONFIRMED',
      },
    });

    revalidateTag('sports');

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in.' };
    console.error('[registerForSport]', error);
    return { success: false, error: 'Sport registration failed.' };
  }
}
```

### 3.4 — Profile Management (Item 21)

**Create:** `src/lib/actions/profile.ts`

```ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { uploadToR2 } from '@/lib/r2';
import crypto from 'crypto';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  branch: z.string().optional(),
  currentYear: z.string().optional(),
});

export async function updateProfile(input: z.infer<typeof UpdateProfileSchema>) {
  try {
    const user = await requireAuth();
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests.' };

    const parsed = UpdateProfileSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input.' };

    const data: Record<string, string> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.phone) data.phone = parsed.data.phone;
    if (parsed.data.branch) data.branch = parsed.data.branch;
    if (parsed.data.currentYear) data.currentYear = parsed.data.currentYear;

    if (Object.keys(data).length === 0) return { success: false, error: 'Nothing to update.' };

    await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in.' };
    console.error('[updateProfile]', error);
    return { success: false, error: 'Profile update failed.' };
  }
}

export async function uploadAvatar(formData: FormData) {
  try {
    const user = await requireAuth();
    const rl = await rateLimiters.action(user.id);
    if (!rl.success) return { success: false, error: 'Too many requests.' };

    const file = formData.get('avatar') as File | null;
    if (!file) return { success: false, error: 'No file provided.' };
    if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File too large (max 5MB).' };

    const ext = file.name.split('.').pop() ?? 'jpg';
    const key = `avatars/${user.id}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(key, buffer, file.type);

    // Note: The User model doesn't have an avatar field.
    // Store in a localStorage-based approach on the client for now,
    // or the team can add a migration to add `avatarUrl String?` to the User model.
    // For now, return the URL for client-side storage.

    return { success: true, data: { avatarUrl: url } };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in.' };
    console.error('[uploadAvatar]', error);
    return { success: false, error: 'Upload failed.' };
  }
}

export async function getMyProfile() {
  try {
    const user = await requireAuth();

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Registration: {
          include: { Event: { select: { title: true, date: true, venue: true } } },
          orderBy: { createdAt: 'desc' },
        },
        Team: {
          include: {
            Event: { select: { title: true } },
            TeamMember: { select: { name: true, role: true, status: true } },
          },
        },
      },
    });

    if (!userData) return null;

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      branch: userData.branch,
      currentYear: userData.currentYear,
      phone: userData.phone,
      registrations: userData.Registration.map((r) => ({
        id: r.id,
        eventTitle: r.Event.title,
        eventDate: r.Event.date.toISOString(),
        venue: r.Event.venue,
        status: r.status,
        paymentStatus: r.paymentStatus,
        certificateUrl: r.certificateUrl,
        certificateIssuedAt: r.certificateIssuedAt?.toISOString() ?? null,
        rank: r.rank,
      })),
      teams: userData.Team.map((t) => ({
        id: t.id,
        teamName: t.teamName,
        teamCode: t.teamCode,
        eventTitle: t.Event?.title ?? 'Unknown',
        status: t.status,
        members: t.TeamMember.map((m) => ({
          name: m.name,
          role: m.role,
          status: m.status,
        })),
      })),
    };
  } catch {
    return null;
  }
}
```

### 3.5 — Certificate Download (Item 22)

**Create:** `src/lib/actions/certificate.ts`

```ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/r2';

export async function getCertificateDownloadUrl(registrationId: string) {
  try {
    const user = await requireAuth();

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, userId: user.id },
    });

    if (!registration) return { success: false, error: 'Registration not found.' };
    if (!registration.certificateUrl || !registration.certificateIssuedAt) {
      return { success: false, error: 'Certificate not yet issued.' };
    }

    // The certificateUrl stored in DB is the R2 key
    const downloadUrl = await getPresignedDownloadUrl(registration.certificateUrl);

    return { success: true, data: { url: downloadUrl } };
  } catch (error: any) {
    if (error.message === 'Unauthorized') return { success: false, error: 'Please log in.' };
    return { success: false, error: 'Failed to generate download link.' };
  }
}
```

### 3.6 — QR Code from Real Data (Item 23)

**Modify:** `src/components/profile/ProfileCard.tsx`

Instead of generating QR from mock data, use the real user ID:

```tsx
// In ProfileCard.tsx, where QR is rendered:
import QRCode from 'react-qr-code';

// Replace mock QR data with:
<QRCode
  value={JSON.stringify({
    type: 'ORNATE_STUDENT',
    id: user.id,
    name: user.name,
    branch: user.branch,
    email: user.email,
  })}
  size={160}
  bgColor="transparent"
  fgColor="var(--color-neon)"
/>
```

### 3.7 — Registration UI in MissionCard

**Modify:** `src/components/missions/MissionCard.tsx`

Add a registration button that calls the Server Action:

```tsx
// Add to MissionCard props:
interface MissionCardProps {
  mission: Mission;
  isLoggedIn?: boolean;
  isRegistered?: boolean;
  onRegister?: (eventId: string) => void;
}

// Inside the card, add a CTA button:
{isLoggedIn && !isRegistered && (
  <button
    onClick={() => onRegister?.(mission.id)}
    className="w-full py-2 mt-2 bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/40 
               text-[var(--color-neon)] text-[10px] font-bold uppercase tracking-widest 
               font-[family-name:var(--font-orbitron)] hover:bg-[var(--color-neon)]/20 transition-all"
    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
  >
    ENLIST FOR MISSION
  </button>
)}
{isRegistered && (
  <div className="w-full py-2 mt-2 text-center text-[10px] text-[var(--color-neon)]/60 
                  font-[family-name:var(--font-orbitron)] border border-[var(--color-neon)]/20">
    ✓ ENLISTED
  </div>
)}
```

Then in `MissionsClient.tsx`, wire up the action:

```tsx
'use client';

import { useSession } from 'next-auth/react';
import { registerForEvent } from '@/lib/actions/register-event';
import { toast } from 'sonner';

// Inside component:
const { data: session } = useSession();

async function handleRegister(eventId: string) {
  const result = await registerForEvent({ eventId });
  if (result.success) {
    toast.success('Mission enlisted successfully!');
  } else {
    toast.error(result.error ?? 'Registration failed.');
  }
}
```

### 3.8 — Profile Page Refactor

**Create:** `src/app/profile/page.tsx` (Server Component wrapper)

```tsx
import { getMyProfile } from '@/lib/actions/profile';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const profile = await getMyProfile();

  if (!profile) redirect('/login?callbackUrl=/profile');

  return <ProfileClient profile={profile} />;
}
```

Rename existing `src/app/profile/page.tsx` → `src/app/profile/ProfileClient.tsx`, pass profile data as props to `ProfileCard` instead of mock data.

---

### Phase 3 — File Summary

| Action | File Path |
|---|---|
| **Create** | `src/lib/actions/register-event.ts` |
| **Create** | `src/lib/actions/team.ts` |
| **Create** | `src/lib/actions/register-sport.ts` |
| **Create** | `src/lib/actions/profile.ts` |
| **Create** | `src/lib/actions/certificate.ts` |
| **Modify** | `src/components/missions/MissionCard.tsx` (add register button) |
| **Modify** | `src/app/missions/MissionsClient.tsx` (wire up actions) |
| **Modify** | `src/components/profile/ProfileCard.tsx` (real data + QR) |
| **Rename + Modify** | `src/app/profile/page.tsx` → `ProfileClient.tsx` |
| **Create** | `src/app/profile/page.tsx` (Server Component) |

---

## Phase 4: Real-Time and Polish

### 4.1 — Live Sports Scores (Item 24)

**Create:** `src/app/api/scores/route.ts`

```ts
import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'live-scores';
const CACHE_TTL = 10; // 10 seconds

export async function GET() {
  // Try Redis cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  // Fetch live/recent matches
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ['LIVE', 'COMPLETED'] },
    },
    include: {
      Sport: { select: { name: true, gender: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  const data = matches.map((m) => ({
    id: m.id,
    sport: m.Sport.name,
    gender: m.Sport.gender,
    round: m.round,
    team1: m.team1Name,
    team2: m.team2Name,
    score1: m.score1,
    score2: m.score2,
    status: m.status,
    winner: m.winner,
    venue: m.venue,
    time: m.time,
  }));

  // Cache in Redis
  await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL);

  return NextResponse.json(data);
}
```

**Create:** `src/hooks/useLiveScores.ts` (client hook)

```ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveScore {
  id: string;
  sport: string;
  round: string;
  team1: string;
  team2: string;
  score1: string | null;
  score2: string | null;
  status: string;
  winner: string | null;
}

export function useLiveScores(pollInterval = 30000) {
  const [scores, setScores] = useState<LiveScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data);
      }
    } catch (err) {
      console.error('[LiveScores] Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, pollInterval);
    return () => clearInterval(interval);
  }, [fetchScores, pollInterval]);

  return { scores, isLoading };
}
```

Use in Sports pages and UpdatesTicker:

```tsx
// In SportsClient.tsx or any component showing live scores:
const { scores, isLoading } = useLiveScores(30000); // poll every 30s
```

### 4.2 — Registration Status Tracking (Item 25)

This is already handled by Phase 3's `getMyProfile()` which returns registration statuses. The Profile page's `MissionSection` component should render these:

**Modify:** `src/components/profile/MissionSection.tsx`

```tsx
// Accept real registration data as props instead of mock data
interface MissionSectionProps {
  registrations: {
    id: string;
    eventTitle: string;
    status: string;        // PENDING | CONFIRMED | WAITLISTED | ATTENDED | CANCELLED
    paymentStatus: string; // PENDING | PAID | FAILED
    certificateUrl: string | null;
    certificateIssuedAt: string | null;
    rank: number | null;
  }[];
}

// Status badge mapping
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400 border-yellow-400/40',
  CONFIRMED: 'text-[var(--color-neon)] border-[var(--color-neon)]/40',
  WAITLISTED: 'text-orange-400 border-orange-400/40',
  ATTENDED: 'text-cyan-400 border-cyan-400/40',
  CANCELLED: 'text-red-400 border-red-400/40',
};
```

### 4.3 — Announcement View Counter (Item 26)

**Create:** `src/lib/actions/view-announcement.ts`

```ts
'use server';

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

const VIEW_KEY_PREFIX = 'announcement-views:';
const FLUSH_THRESHOLD = 10; // Flush to DB every 10 views

/**
 * Increment view count for an announcement.
 * Uses Redis as a write buffer, periodically flushing to PostgreSQL.
 */
export async function incrementAnnouncementView(announcementId: string) {
  const key = `${VIEW_KEY_PREFIX}${announcementId}`;

  const count = await redis.incr(key);

  // Flush to DB every FLUSH_THRESHOLD views
  if (count >= FLUSH_THRESHOLD) {
    await redis.set(key, 0);
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { viewCount: { increment: FLUSH_THRESHOLD } },
    });
  }
}
```

Wire into the Updates page client component:

```tsx
// In UpdatesClient.tsx, when a card is expanded:
import { incrementAnnouncementView } from '@/lib/actions/view-announcement';

function handleExpand(id: string) {
  // Fire and forget — no need to await
  incrementAnnouncementView(id);
  // ... existing expand logic
}
```

---

### Phase 4 — File Summary

| Action | File Path |
|---|---|
| **Create** | `src/app/api/scores/route.ts` |
| **Create** | `src/hooks/useLiveScores.ts` |
| **Create** | `src/lib/actions/view-announcement.ts` |
| **Modify** | `src/components/profile/MissionSection.tsx` (real statuses) |
| **Modify** | `src/app/fest/sports/SportsClient.tsx` (use live scores hook) |
| **Modify** | `src/app/updates/UpdatesClient.tsx` (view counter) |

---

## Deployment Configuration

### PM2 Ecosystem File

**Create:** `ecosystem.config.js` (project root)

```js
module.exports = {
  apps: [
    {
      name: 'ornate-student',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/ornate-student',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Logging
      error_file: '/var/log/pm2/ornate-student-error.log',
      out_file: '/var/log/pm2/ornate-student-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### Nginx Configuration

**File:** `/etc/nginx/sites-available/ornate-student`

```nginx
upstream ornate_student {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name student.ornate26.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name student.ornate26.in;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/student.ornate26.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/student.ornate26.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css image/svg+xml;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Static assets — cache aggressively
    location /_next/static {
        proxy_pass http://ornate_student;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public assets
    location /assets {
        proxy_pass http://ornate_student;
        expires 30d;
        add_header Cache-Control "public";
    }

    location /fonts {
        proxy_pass http://ornate_student;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Health check (no rate limit)
    location /api/health {
        proxy_pass http://ornate_student;
        proxy_set_header Host $host;
    }

    # Main app
    location / {
        proxy_pass http://ornate_student;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Rate limiting zone (applied at nginx level as extra layer)
    # Define in http block: limit_req_zone $binary_remote_addr zone=student:10m rate=50r/s;
    # limit_req zone=student burst=100 nodelay;
}
```

### Build & Deploy Script

**Create:** `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Ornate Student App..."

cd /var/www/ornate-student

# Pull latest
git pull origin main

# Install deps
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Restart PM2
pm2 reload ornate-student --update-env

echo "✅ Deployment complete!"

# Health check
sleep 5
curl -s http://127.0.0.1:3001/api/health | jq .
```

---

## Migration & Integration Checklist

### Pre-Deployment (One-Time Setup)

- [ ] **1. Verify shared DB access** — run `npx prisma db pull` from Student App to confirm schema matches
- [ ] **2. Generate Prisma client** — `npx prisma generate` (outputs to `src/generated/prisma/`)
- [ ] **3. Set up `.env.local`** on VPS with all required variables
- [ ] **4. Verify Redis** — `redis-cli -h 127.0.0.1 ping` should return `PONG`
- [ ] **5. Verify R2 access** — test upload/download with a small file
- [ ] **6. Create student test account** — insert a `User` row with `role: STUDENT` and bcrypt-hashed password
- [ ] **7. Install SSL cert** — `sudo certbot --nginx -d student.ornate26.in`
- [ ] **8. Configure Nginx** — copy config, `sudo nginx -t`, `sudo systemctl reload nginx`
- [ ] **9. Start PM2** — `pm2 start ecosystem.config.js`
- [ ] **10. Verify health** — `curl https://student.ornate26.in/api/health`

### Per-Phase Verification

**Phase 1:**
- [ ] `GET /api/health` returns `{ status: "healthy" }` with both DB and Redis OK
- [ ] Login page at `/login` renders correctly with sci-fi theme
- [ ] Login with valid student credentials sets JWT + session cookie
- [ ] Protected routes (`/profile`) redirect to `/login` when unauthenticated
- [ ] Rate limiting blocks after 5 rapid login attempts

**Phase 2:**
- [ ] `/missions` loads events from DB (verify with `console.log` count)
- [ ] `/stalls` loads stalls from DB
- [ ] `/updates` loads announcements from DB
- [ ] `/roadmap` shows timeline derived from DB events
- [ ] `/fest/sports` shows sports, matches, standings from DB
- [ ] `/gallery` shows albums from DB
- [ ] `/branches/[slug]` shows branch-specific events + gallery from DB
- [ ] Loading skeletons appear while data loads
- [ ] When admin creates a new event in Admin EMS, it appears in Student App within 60s

**Phase 3:**
- [ ] Logged-in student can register for solo event
- [ ] Logged-in student can create team for team event (receives team code)
- [ ] Another student can join team via team code
- [ ] Profile page shows real user data + registration history
- [ ] QR code on profile encodes real user ID
- [ ] Certificate download works for registrations with issued certificates

**Phase 4:**
- [ ] `/api/scores` returns live match data, cached in Redis with 10s TTL
- [ ] Sports page updates scores every 30s without full page reload
- [ ] Announcement view counts increment (check DB after viewing several)

### Cache Tag Registry (Shared with Admin EMS)

Both apps must use the same cache tag strings so revalidation works correctly:

| Tag | Busted When | Used By |
|---|---|---|
| `events` | Admin creates/edits/deletes event | Events, Missions, Roadmap, Branch detail |
| `registrations` | Student registers, admin approves | Events (slot count), Profile |
| `stalls` | Admin manages stalls | Stalls listing + detail |
| `announcements` | Admin publishes announcement | Updates, Home dashboard |
| `sports` | Admin updates sport/match | Sports page, Standings |
| `branch-points` | Admin updates points | Branch detail, Sports standings |
| `gallery` | Admin uploads photos | Gallery, Branch detail |
| `promo-videos` | Admin manages videos | Branch detail video carousel |
| `event-winners` | Admin publishes winners | Branch detail Hall of Fame |
| `sport-winners` | Admin publishes sport winners | Sports results |
| `fest-settings` | Admin changes fest config | Home page, global settings |
| `best-outgoing` | Admin manages awards | Branch Hall of Fame |

---

## Complete New File Inventory

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts            ← NEW (Phase 1)
│   │   ├── health/
│   │   │   └── route.ts                ← NEW (Phase 1)
│   │   └── scores/
│   │       └── route.ts                ← NEW (Phase 4)
│   ├── login/
│   │   └── page.tsx                    ← NEW (Phase 1)
│   ├── page.tsx                        ← REWRITE as Server Component (Phase 2)
│   ├── HomeClient.tsx                  ← RENAMED from page.tsx (Phase 2)
│   ├── missions/
│   │   ├── page.tsx                    ← REWRITE as Server Component (Phase 2)
│   │   ├── MissionsClient.tsx          ← RENAMED from page.tsx (Phase 2)
│   │   └── loading.tsx                 ← NEW (Phase 2)
│   ├── roadmap/
│   │   ├── page.tsx                    ← REWRITE as Server Component (Phase 2)
│   │   ├── RoadmapClient.tsx           ← RENAMED from page.tsx (Phase 2)
│   │   └── loading.tsx                 ← NEW (Phase 2)
│   ├── stalls/
│   │   ├── page.tsx                    ← REWRITE as Server Component (Phase 2)
│   │   ├── StallsClient.tsx            ← RENAMED from page.tsx (Phase 2)
│   │   ├── loading.tsx                 ← NEW (Phase 2)
│   │   └── [id]/
│   │       ├── page.tsx                ← REWRITE as Server Component (Phase 2)
│   │       └── StallDetailClient.tsx   ← RENAMED from page.tsx (Phase 2)
│   ├── updates/
│   │   ├── page.tsx                    ← REWRITE as Server Component (Phase 2)
│   │   ├── UpdatesClient.tsx           ← RENAMED from page.tsx (Phase 2)
│   │   └── loading.tsx                 ← NEW (Phase 2)
│   ├── gallery/
│   │   ├── page.tsx                    ← REWRITE as Server Component (Phase 2)
│   │   └── GalleryClient.tsx           ← RENAMED from page.tsx (Phase 2)
│   ├── fest/
│   │   ├── sports/
│   │   │   ├── page.tsx                ← REWRITE as Server Component (Phase 2)
│   │   │   └── SportsClient.tsx        ← RENAMED from page.tsx (Phase 2)
│   │   └── culturals/
│   │       ├── page.tsx                ← REWRITE as Server Component (Phase 2)
│   │       └── CulturalsClient.tsx     ← RENAMED from page.tsx (Phase 2)
│   ├── branches/
│   │   └── [slug]/
│   │       ├── page.tsx                ← REWRITE as Server Component (Phase 2)
│   │       └── BranchDetailClient.tsx  ← RENAMED from page.tsx (Phase 2)
│   ├── clubs/
│   │   └── [slug]/
│   │       ├── page.tsx                ← REWRITE as Server Component (Phase 2)
│   │       └── ClubDetailClient.tsx    ← RENAMED from page.tsx (Phase 2)
│   └── profile/
│       ├── page.tsx                    ← REWRITE as Server Component (Phase 3)
│       └── ProfileClient.tsx           ← RENAMED from page.tsx (Phase 3)
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx            ← NEW (Phase 1)
│   ├── missions/
│   │   └── MissionCard.tsx             ← MODIFY (Phase 3, add register button)
│   └── profile/
│       ├── ProfileCard.tsx             ← MODIFY (Phase 3, real data + QR)
│       └── MissionSection.tsx          ← MODIFY (Phase 4, real statuses)
├── hooks/
│   └── useLiveScores.ts               ← NEW (Phase 4)
├── lib/
│   ├── env.ts                          ← NEW (Phase 1)
│   ├── redis.ts                        ← NEW (Phase 1)
│   ├── rate-limit.ts                   ← NEW (Phase 1)
│   ├── auth.ts                         ← NEW (Phase 1)
│   ├── r2.ts                           ← NEW (Phase 1)
│   ├── data/
│   │   ├── events.ts                   ← NEW (Phase 2)
│   │   ├── stalls.ts                   ← NEW (Phase 2)
│   │   ├── announcements.ts            ← NEW (Phase 2)
│   │   ├── sports.ts                   ← NEW (Phase 2)
│   │   ├── gallery.ts                  ← NEW (Phase 2)
│   │   ├── fest-settings.ts            ← NEW (Phase 2)
│   │   ├── winners.ts                  ← NEW (Phase 2)
│   │   ├── videos.ts                   ← NEW (Phase 2)
│   │   ├── best-outgoing.ts            ← NEW (Phase 2)
│   │   └── branch-detail.ts            ← NEW (Phase 2)
│   └── actions/
│       ├── register-event.ts           ← NEW (Phase 3)
│       ├── team.ts                     ← NEW (Phase 3)
│       ├── register-sport.ts           ← NEW (Phase 3)
│       ├── profile.ts                  ← NEW (Phase 3)
│       ├── certificate.ts              ← NEW (Phase 3)
│       └── view-announcement.ts        ← NEW (Phase 4)
├── middleware.ts                        ← NEW (Phase 1)
├── types/
│   └── next-auth.d.ts                  ← NEW (Phase 1)
├── .env.local                          ← NEW (setup)
├── ecosystem.config.js                 ← NEW (deployment)
└── scripts/
    └── deploy.sh                       ← NEW (deployment)
```

**Total new files:** 38
**Total modified files:** 6
**Total renamed files:** 14

---

## Execution Timeline Estimate

| Phase | Duration | Deploys As |
|---|---|---|
| Phase 1: Foundation | 2–3 days | Auth + health check functional |
| Phase 2: Read Layer | 4–5 days | All pages show live DB data |
| Phase 3: Write Layer | 3–4 days | Registration + teams + profile functional |
| Phase 4: Real-Time | 1–2 days | Live scores + view counters |
| **Total** | **10–14 days** | Full production-ready app |

Each phase is independently deployable. The app continues to function between phases — Phase 1 adds auth without breaking existing static pages, Phase 2 swaps data sources one page at a time, etc.
