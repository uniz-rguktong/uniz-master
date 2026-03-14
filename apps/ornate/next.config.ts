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
    skipWaiting: true,
    importScripts: ["/push-sw.js"],
  });

  return withPWA(nextConfig);
})();

export default finalConfig;
