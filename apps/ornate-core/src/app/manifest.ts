import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Ornate EMS — Event Management System',
        short_name: 'Ornate EMS',
        description: 'A comprehensive platform for managing events, sports, and institutional registrations.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        categories: ['education', 'productivity'],
        shortcuts: [
            {
                name: 'Home',
                url: '/',
                icons: [
                    {
                        src: '/assets/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                ],
            },
        ],
        icons: [
            {
                src: '/assets/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/assets/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
