import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
// Force rebuild
const nextConfig = {
    output: 'standalone',
    // ── File Size Limits ──────────────────────────────────────
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
        proxyClientMaxBodySize: '50mb',
    },

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "*.r2.dev",
            },
            {
                protocol: "https",
                hostname: "ui-avatars.com",
            },
            {
                protocol: "https",
                hostname: "img.youtube.com",
            },
            {
                protocol: "https",
                hostname: "vumbnail.com",
            },
            {
                protocol: "https",
                hostname: "i.vimeocdn.com",
            },
        ],
    },
    serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],

    // ── Security Headers ──────────────────────────────────────
    async headers() {
        return [
            {
                // Apply to all routes
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
                            "img-src 'self' data: blob: https://images.unsplash.com https://*.r2.dev https://img.youtube.com https://vumbnail.com https://i.vimeocdn.com",
                            "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
                            "connect-src 'self' ws: wss: https://*.r2.dev https://cdn.jsdelivr.net https://unpkg.com",
                            "frame-src https://www.youtube.com https://youtube.com https://player.vimeo.com",
                            "object-src 'none'",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})(nextConfig);
