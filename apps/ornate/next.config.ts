import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- Performance ---
  compress: true,
  output: "standalone",

  // --- Security: remove fingerprinting header ---
  poweredByHeader: false,

  // --- Image Optimization ---
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
        pathname: "/**",
      },
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
              "media-src 'self' blob: https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
              "worker-src 'self' blob:", // 'self' = sw.js, blob: = Three.js
              "connect-src 'self' https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
