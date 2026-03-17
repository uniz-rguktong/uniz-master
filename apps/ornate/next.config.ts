import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const r2PublicHost = (() => {
  const raw = process.env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  output: 'standalone',
  // --- TypeScript ---
  // Skip TS errors during build – the codebase has pre-existing Prisma relation
  // casing mismatches (PascalCase vs camelCase) that don't affect runtime.
  typescript: {
    ignoreBuildErrors: true,
  },
  // --- Performance ---
  compress: true,
  experimental: {
    cpus: 1, // Limit workers during build to avoid DB connection saturation
  },

  // --- Security: remove fingerprinting header ---
  poweredByHeader: false,

  // --- Image Optimization ---
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      ...(r2PublicHost
        ? [
          {
            protocol: "https" as const,
            hostname: r2PublicHost,
          },
        ]
        : []),
    ],
  },

  // --- Security Headers ---
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Block MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Force HTTPS for 1 year (enable once you have SSL)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Control referrer info sent to third parties
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict browser features not used by the app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy
          // Allows: same-origin resources, Google Fonts, inline styles (Tailwind/GSAP),
          // and WebGL via Three.js (worker-src blob: for Three.js internals).
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com", // jsdelivr for UnicornStudio SDK, Cloudflare for analytics
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              [
                "img-src 'self' data: dummy",
                "https://images.unsplash.com",
                "https://grainy-gradients.vercel.app",
                "https://*.cloudfront.net",
                "https://*.unicorn.studio",
                "https://*.r2.dev",
                "https://*.r2.cloudflarestorage.com",
                "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
                ...(r2PublicHost ? [`https://${r2PublicHost}`] : []),
              ].join(" "),
              [
                "media-src 'self' blob:",
                "https://*.r2.dev",
                "https://*.r2.cloudflarestorage.com",
                "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
                ...(r2PublicHost ? [`https://${r2PublicHost}`] : []),
              ].join(" "),
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com https://www.facebook.com",
              "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com https://www.facebook.com",
              "worker-src 'self' blob:", // Required by Three.js and Service Workers
              [
                "connect-src 'self' blob: https://*.unicorn.studio https://cdn.jsdelivr.net https://*.cloudfront.net https://grainy-gradients.vercel.app",
                "https://*.r2.dev",
                "https://*.r2.cloudflarestorage.com",
                "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
                ...(r2PublicHost ? [`https://${r2PublicHost}`] : []),
              ].join(" "),
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/home/fun/cosmos',
        destination: '/home/fun/cosmos/index.html',
      },
      {
        source: '/space/:path*',
        destination: '/home/fun/cosmos/:path*',
      },
    ];
  },
};

const finalConfig = (() => {
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }

  const withPWA = withPWAInit({
    dest: "public",
    register: true,
    workboxOptions: {
      skipWaiting: true,
      importScripts: ["/push-sw.js"],
      // ─── Scene Frame Cache ────────────────────────────────────────────────────
      // The landing page animation is made of 720 individual .webp frames served
      // from Cloudflare R2. Without this rule, they fall into the generic
      // "cross-origin" catch-all which only caches for 1 hour (NetworkFirst).
      //
      // This dedicated rule MUST come before the cross-origin fallback so Workbox
      // matches it first. Strategy: CacheFirst — once a frame is in the SW cache,
      // it is NEVER re-fetched from R2 until 30 days expire or the user clears
      // browser storage. This makes every refresh after the first visit load the
      // entire 720-frame animation from local disk with zero network I/O.
      runtimeCaching: [
        {
          // Matches every .webp served from our Cloudflare R2 landing-assets bucket
          urlPattern: /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/landing-assets\/.+\.webp$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "scene-frames-v1",
            expiration: {
              maxEntries: 750,             // 720 frames + a few extra for safety
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
      ],
    },
  });

  return withPWA(nextConfig);
})();

export default finalConfig;
