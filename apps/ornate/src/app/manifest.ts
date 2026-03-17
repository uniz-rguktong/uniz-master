import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ornate '26 — Fest App",
    short_name: 'Ornate',
    description: 'Ornate fest app for events, updates, missions, sports, and live participation.',
    id: '/',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#030308',
    theme_color: '#030308',
    categories: ['events', 'education', 'entertainment'],
    shortcuts: [
      {
        name: 'Updates',
        url: '/home/updates',
        icons: [
          {
            src: '/assets/RguktLogo.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
    icons: [
      {
        src: '/assets/Ornate_LOGO.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/assets/Ornate_LOGO.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/Ornate_LOGO.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
