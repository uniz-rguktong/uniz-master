import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'http://localhost:3000'; // Replace with your production domain later

    // Basic static routes
    const staticRoutes = [
        '',
        '/awards',
        '/login',
        '/verify',
        '/sports/championship',
        '/sports/points-table',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes from database (e.g., individual sports if they have public pages)
    try {
        const sports = await prisma.sport.findMany({
            where: { isActive: true },
            select: { id: true, updatedAt: true }
        });

        const sportRoutes = sports.map((sport) => ({
            url: `${baseUrl}/sports/${sport.id}`,
            lastModified: sport.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...sportRoutes];
    } catch (error) {
        console.error('Error generating dynamic sitemap routes:', error);
        return staticRoutes;
    }
}
