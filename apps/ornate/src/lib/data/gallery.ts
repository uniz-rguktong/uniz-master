import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const GALLERY_ALBUM_LIMIT = 30;
const GALLERY_ALBUM_IMAGE_LIMIT = 20;
const CULTURAL_IMAGE_LIMIT = 50;
const PROMO_VIDEO_LIMIT = 20;
const GALLERY_MAX_ALBUM_LIMIT = 60;
const GALLERY_MAX_IMAGE_LIMIT = 40;
const CULTURAL_MAX_IMAGE_LIMIT = 150;


export type AlbumData = {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    tags: string[];
    images: { id: string; url: string; caption: string | null }[];
    creator: {
        id: string;
        name: string | null;
        role: string;
        branch: string | null;
        clubId: string | null;
    };
};

export type PromoVideoData = {
    id: string;
    title: string;
    url: string;
    thumbnail: string | null;
    category: string;
    creator: {
        role: string;
        branch: string | null;
        clubId: string | null;
    };
};

type RedisClientLike = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, mode: 'EX', seconds: number) => Promise<unknown>;
};


// Bounded query: prevents unbounded payload growth as albums/images increase.
export const getGalleryAlbums = unstable_cache(async (
    limit = GALLERY_ALBUM_LIMIT,
    imageLimit = GALLERY_ALBUM_IMAGE_LIMIT
): Promise<AlbumData[]> => {
    const boundedAlbumLimit = Math.max(1, Math.min(GALLERY_MAX_ALBUM_LIMIT, limit));
    const boundedImageLimit = Math.max(1, Math.min(GALLERY_MAX_IMAGE_LIMIT, imageLimit));

    const albums = await prisma.galleryAlbum.findMany({
        where: { isArchived: false },
        select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            tags: true,
            GalleryImage: {
                select: { id: true, url: true, caption: true },
                orderBy: { uploadedAt: 'desc' },
                take: boundedImageLimit,
            },
            Admin: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    branch: true,
                    clubId: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: boundedAlbumLimit,
    });

    return albums.map((a: (typeof albums)[number]) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        coverImage: a.coverImage || a.GalleryImage[0]?.url || null,
        tags: a.tags,
        images: a.GalleryImage.map((img: (typeof a.GalleryImage)[number]) => ({
            id: img.id,
            url: img.url,
            caption: img.caption,
        })),
        creator: a.Admin,
    }));
}, ['gallery-albums'], { revalidate: 300, tags: ['gallery'] });

// Lightweight version: only fetches cover + up to 3 preview images per album.
export async function getSportsGalleryAlbums(): Promise<AlbumData[]> {
    const cacheKey = 'gallery:sports-albums';

    // Lazy-load Redis
    let redis: RedisClientLike | null = null;
    try {
        const redisModule = await import('@/lib/redis');
        redis = redisModule.redis;
    } catch (e) {
        // Continue without cache
    }

    if (redis) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {
            console.warn('[Cache] Redis read error (sports-albums):', e);
        }
    }

    try {
        const albums = await prisma.galleryAlbum.findMany({
            where: {
                isArchived: false,
                Admin: {
                    role: {
                        in: ['SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN']
                    }
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                coverImage: true,
                tags: true,
                // Only load first 3 image URLs for preview, not the entire collection
                GalleryImage: {
                    select: { id: true, url: true, caption: true },
                    orderBy: { uploadedAt: 'desc' },
                    take: 3,
                },
                Admin: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        branch: true,
                        clubId: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 12, // Cap the number of sports albums for initial landing
        });

        const data = albums.map((a: (typeof albums)[number]) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            coverImage: a.coverImage || a.GalleryImage[0]?.url || null,
            tags: a.tags,
            images: a.GalleryImage.map((img: (typeof a.GalleryImage)[number]) => ({
                id: img.id,
                url: img.url,
                caption: img.caption,
            })),
            creator: a.Admin,
        }));

        if (redis && data.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', 60); // 1 minute cache
            } catch (e) {
                // Ignore
            }
        }

        return data;
    } catch (error) {
        console.error('Error fetching sports gallery albums:', error);
        return [];
    }
}

// For when a user opens a specific album — fetches ALL images on demand.
export async function getAlbumImages(albumId: string): Promise<{ id: string; url: string; caption: string | null }[]> {
    const images = await prisma.galleryImage.findMany({
        where: { albumId },
        select: { id: true, url: true, caption: true },
        orderBy: { uploadedAt: 'desc' },
    });
    return images;
}

export async function getPromoVideos(): Promise<PromoVideoData[]> {
    const videos = await prisma.promoVideo.findMany({
        where: { status: 'active' },
        select: {
            id: true,
            title: true,
            url: true,
            thumbnail: true,
            category: true,
            Admin: {
                select: {
                    role: true,
                    branch: true,
                    clubId: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: PROMO_VIDEO_LIMIT,
    });

    return videos.map((v: (typeof videos)[number]) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail,
        category: v.category,
        creator: v.Admin
    }));
}

export async function getCulturalGalleryAlbums(limit = GALLERY_ALBUM_LIMIT, imageLimit = GALLERY_ALBUM_IMAGE_LIMIT): Promise<AlbumData[]> {
    const boundedAlbumLimit = Math.max(1, Math.min(GALLERY_MAX_ALBUM_LIMIT, limit));
    const boundedImageLimit = Math.max(1, Math.min(GALLERY_MAX_IMAGE_LIMIT, imageLimit));

    const albums = await prisma.galleryAlbum.findMany({
        where: {
            isArchived: false,
            OR: [
                { Admin: { clubId: { in: ['KALADHARINI', 'KALADHARANI', 'kaladharini', 'kaladharani', 'khaladharini', 'khaladharani', 'KHALADHARINI', 'KHALADHARANI'] } } },
                { title: { contains: 'CULTURAL', mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            tags: true,
            GalleryImage: {
                select: { id: true, url: true, caption: true },
                orderBy: { uploadedAt: 'desc' },
                take: boundedImageLimit,
            },
            Admin: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    branch: true,
                    clubId: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: boundedAlbumLimit,
    });

    return albums.map((a: (typeof albums)[number]) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        coverImage: a.coverImage || a.GalleryImage[0]?.url || null,
        tags: a.tags,
        images: a.GalleryImage.map((img: (typeof a.GalleryImage)[number]) => ({
            id: img.id,
            url: img.url,
            caption: img.caption,
        })),
        creator: a.Admin,
    }));
}

export async function getCulturalPromoVideos(): Promise<PromoVideoData[]> {
    const videos = await prisma.promoVideo.findMany({
        where: {
            status: 'active',
            OR: [
                { Admin: { clubId: { in: ['KALADHARINI', 'KALADHARANI', 'kaladharini', 'kaladharani', 'khaladharini', 'khaladharani', 'KHALADHARINI', 'KHALADHARANI'] } } },
                { Admin: { role: 'SUPER_ADMIN' } }
            ]
        },
        select: {
            id: true,
            title: true,
            url: true,
            thumbnail: true,
            category: true,
            Admin: {
                select: {
                    role: true,
                    branch: true,
                    clubId: true,
                }
            }
        },
        orderBy: { uploadDate: 'desc' },
        take: PROMO_VIDEO_LIMIT,
    });

    return videos.map((v: (typeof videos)[number]) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        thumbnail: v.thumbnail,
        category: v.category,
        creator: v.Admin
    }));
}

export async function getAllCulturalImages(limit = CULTURAL_IMAGE_LIMIT): Promise<string[]> {
    const boundedLimit = Math.max(1, Math.min(CULTURAL_MAX_IMAGE_LIMIT, limit));

    const images = await prisma.galleryImage.findMany({
        where: {
            GalleryAlbum: {
                OR: [
                    { Admin: { clubId: { in: ['KALADHARINI', 'KALADHARANI', 'kaladharini', 'kaladharani', 'khaladharini', 'khaladharani', 'KHALADHARINI', 'KHALADHARANI'] } } },
                    { title: { contains: 'CULTURAL', mode: 'insensitive' } }
                ]
            }
        },
        select: { url: true },
        orderBy: { uploadedAt: 'desc' },
        take: boundedLimit,
    });

    return images.map((img: (typeof images)[number]) => img.url);
}

export async function getCulturalBrandLogos(): Promise<string[]> {
    const logos = await prisma.brandLogo.findMany({
        where: {
            status: 'active',
            Admin: {
                OR: [
                    { clubId: { in: ['KALADHARINI', 'KALADHARANI', 'kaladharini', 'kaladharani', 'khaladharini', 'khaladharani', 'KHALADHARINI', 'KHALADHARANI'] } },
                    { branch: { in: ['CULTURAL', 'cultural'] } }
                ]
            }
        },
        select: { url: true },
        orderBy: { createdAt: 'desc' }
    });

    return logos.map((logo: (typeof logos)[number]) => logo.url);
}
