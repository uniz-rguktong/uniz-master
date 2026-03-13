'use server';

import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { revalidateGallery } from '@/lib/revalidation';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { Prisma } from '@/lib/generated/client';
import type { ScopeUser } from '@/lib/auth-helpers';
import { executeAction } from '@/lib/api-utils';

interface CreateAlbumData {
    name: string;
    description?: string;
    visibility?: 'public' | 'private' | 'branch';
    coverImage?: string;
}

interface UpdateAlbumData {
    name?: string;
    description?: string;
    visibility?: 'public' | 'private' | 'branch';
    coverImage?: string;
    isArchived?: boolean;
}

interface PhotoInput {
    url: string;
    caption?: string;
}

interface UpdateGalleryImageData {
    caption?: string;
    url?: string;
}

interface GalleryAlbumWithRelations {
    id: string;
    title: string;
    description: string | null;
    coverImage: string | null;
    tags: string[];
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    images: { id: string; url: string; caption: string | null; albumId: string; uploadedAt: Date }[];
    creator: { name: string | null; branch: string | null } | null;
}

interface GalleryImageRow {
    id: string;
    url: string;
    caption: string | null;
    albumId: string;
    uploadedAt: Date;
}

export interface GalleryActionResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

export interface FormattedGalleryAlbum {
    id: string;
    title: string;
    name: string;
    description: string;
    photoCount: number;
    dateCreated: string;
    lastUpdated: string;
    visibility: string;
    coverImage: string;
    isArchived: boolean;
    createdBy: string;
    images: FormattedGalleryImage[];
}

export interface FormattedGalleryImage {
    id: string;
    url: string;
    caption: string;
    albumId: string;
    uploadedAt: string;
}

async function getSessionUser(): Promise<ScopeUser> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error('Not authenticated');
    }
    return session.user as ScopeUser;
}

function buildGalleryScope(user: ScopeUser): Prisma.GalleryAlbumWhereInput {
    if (user.role === 'SUPER_ADMIN') return {};
    if (user.role === 'HHO') return { creator: { role: 'HHO' } };
    if (user.role === 'SPORTS_ADMIN' || user.role === 'BRANCH_SPORTS_ADMIN') {
        return {
            creator: {
                role: { in: ['SPORTS_ADMIN', 'BRANCH_SPORTS_ADMIN'] as any }
            }
        };
    }
    if (user.role === 'CLUB_COORDINATOR') return { creator: { clubId: user.clubId ?? null } };
    return {
        OR: [
            { creatorId: user.id },
            { creator: { branch: user.branch ?? null } }
        ]
    };
}

const VISIBILITY_TAG_PREFIX = 'visibility:';
const DEFAULT_GALLERY_VISIBILITY: 'public' | 'private' | 'branch' = 'public';

function resolveAlbumVisibility(tags: string[] | undefined): 'public' | 'private' | 'branch' {
    const match = (tags || []).find(tag => tag.startsWith(VISIBILITY_TAG_PREFIX));
    if (!match) return DEFAULT_GALLERY_VISIBILITY;
    const value = match.slice(VISIBILITY_TAG_PREFIX.length);
    if (value === 'public' || value === 'private' || value === 'branch') {
        return value;
    }
    return DEFAULT_GALLERY_VISIBILITY;
}

function buildAlbumTags(existingTags: string[] | undefined, visibility?: 'public' | 'private' | 'branch') {
    const tagsWithoutVisibility = (existingTags || []).filter(tag => !tag.startsWith(VISIBILITY_TAG_PREFIX));
    const resolvedVisibility = visibility || DEFAULT_GALLERY_VISIBILITY;
    return [...tagsWithoutVisibility, `${VISIBILITY_TAG_PREFIX}${resolvedVisibility}`];
}


const getCachedGalleryAlbums = unstable_cache(
    async (userId: string, role: string, clubId: string | null, branch: string | null) => {
        const user = { id: userId, role, email: '', clubId, branch };
        const scope = buildGalleryScope(user);

        const albums = (await prisma.galleryAlbum.findMany({
            where: scope,
            select: {
                id: true,
                title: true,
                description: true,
                coverImage: true,
                isArchived: true,
                tags: true,
                createdAt: true,
                updatedAt: true,
                images: {
                    select: { id: true, url: true, caption: true, albumId: true, uploadedAt: true }
                },
                creator: {
                    select: { name: true, branch: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })) as GalleryAlbumWithRelations[];

        return albums.map(album => ({
            id: album.id,
            title: album.title,
            name: album.title,
            description: album.description || '',
            photoCount: album.images.length,
            dateCreated: album.createdAt.toISOString().split('T')[0] as string,
            lastUpdated: album.updatedAt.toISOString().split('T')[0] as string,
            visibility: resolveAlbumVisibility(album.tags),
            coverImage: album.coverImage || (album.images[0]?.url) || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
            isArchived: album.isArchived,
            createdBy: album.creator?.name || 'Admin',
            images: (album.images || []).map((img: GalleryImageRow) => ({
                id: img.id,
                url: img.url,
                caption: img.caption || '',
                albumId: img.albumId,
                uploadedAt: img.uploadedAt.toISOString()
            }))
        }));
    },
    ['gallery-albums-list-v5'],
    { tags: [CACHE_TAGS.gallery, 'albums'], revalidate: 300 }
);

const getCachedAlbumPhotos = unstable_cache(
    async (albumId: string) => {
        const images = await prisma.galleryImage.findMany({
            where: { albumId },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                url: true,
                caption: true,
                albumId: true,
                uploadedAt: true
            }
        });

        return images.map((img: GalleryImageRow) => ({
            id: img.id,
            url: img.url,
            caption: img.caption || '',
            albumId: img.albumId,
            uploadedAt: img.uploadedAt.toISOString()
        }));
    },
    ['gallery-album-photos-v6'],
    { tags: [CACHE_TAGS.gallery, 'photos'], revalidate: 300 }
);

export async function getGalleryAlbums(): Promise<GalleryActionResponse<FormattedGalleryAlbum[]>> {
    try {
        const user = await getSessionUser();

        const formatted = await getCachedGalleryAlbums(
            user.id,
            user.role,
            user.clubId || null,
            user.branch || null
        );

        return { success: true, data: formatted };
    } catch (error) {
        logger.error({ err: error }, 'Get Gallery Albums Error');
        return { success: false, error: 'Failed to fetch gallery' };
    }
}

export async function createGalleryAlbum(data: CreateAlbumData): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });

        if (!admin) throw new Error('Admin not found');
        if (admin.role === 'BRANCH_SPORTS_ADMIN') throw new Error('Unauthorized: Branch Sports Admins have view-only access');

        const album = await prisma.galleryAlbum.create({
            data: {
                title: data.name,
                description: data.description ?? null,
                coverImage: data.coverImage ?? null,
                tags: buildAlbumTags([], data.visibility),
                creatorId: admin.id,
                isArchived: false
            }
        });

        await revalidateGallery();
        return {
            success: true,
            data: {
                id: album.id,
                name: album.title,
                title: album.title,
                description: album.description,
                visibility: data.visibility ?? DEFAULT_GALLERY_VISIBILITY,
                coverImage: album.coverImage,
                isArchived: album.isArchived
            }
        };
    }, 'createGalleryAlbum');
}

export async function updateGalleryAlbum(id: string, data: UpdateAlbumData): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) throw new Error('Admin not found');

        const albumCheck = await prisma.galleryAlbum.findUnique({
            where: { id },
            select: { creatorId: true, tags: true }
        });

        if (!albumCheck) throw new Error('Album not found');

        const isAuthorized = (admin.role === 'SUPER_ADMIN' || albumCheck.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!isAuthorized) throw new Error('Unauthorized');

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.title = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
        if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
        if (data.visibility !== undefined) updateData.tags = buildAlbumTags(albumCheck.tags, data.visibility);

        const album = await prisma.galleryAlbum.update({
            where: { id },
            data: updateData as Prisma.GalleryAlbumUpdateInput
        });

        await revalidateGallery();
        return {
            success: true,
            data: {
                id: album.id,
                name: album.title,
                title: album.title,
                description: album.description,
                visibility: data.visibility ?? resolveAlbumVisibility(albumCheck.tags),
                coverImage: album.coverImage,
                isArchived: album.isArchived
            }
        };
    }, 'updateGalleryAlbum');
}

export async function deleteGalleryAlbum(id: string): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) throw new Error('Admin not found');

        const albumCheck = await prisma.galleryAlbum.findUnique({
            where: { id },
            select: { creatorId: true }
        });

        if (!albumCheck) throw new Error('Album not found');

        const isAuthorized = (admin.role === 'SUPER_ADMIN' || albumCheck.creatorId === admin.id) && admin.role !== 'BRANCH_SPORTS_ADMIN';
        if (!isAuthorized) throw new Error('Unauthorized');

        await prisma.$transaction([
            prisma.galleryImage.deleteMany({
                where: { albumId: id }
            }),
            prisma.galleryAlbum.delete({
                where: { id }
            })
        ]);

        await revalidateGallery();
        return { success: true };
    }, 'deleteGalleryAlbum');
}

export async function getAlbumPhotos(albumId: string): Promise<GalleryActionResponse<FormattedGalleryImage[]>> {
    try {
        await getSessionUser();
        const formattedPhotos = await getCachedAlbumPhotos(albumId);

        return { success: true, data: formattedPhotos };
    } catch (error) {
        return { success: false, error: 'Failed to fetch photos' };
    }
}

export async function addPhotosToAlbum(albumId: string, photos: PhotoInput[]): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) throw new Error('Admin not found');

        // Security: Verify album ownership before adding photos
        const album = await prisma.galleryAlbum.findUnique({
            where: { id: albumId },
            select: { creatorId: true }
        });
        if (!album) return { success: false, error: 'Album not found' };
        if (admin.role === 'BRANCH_SPORTS_ADMIN') return { success: false, error: 'Unauthorized: View-only access' };
        if (admin.role !== 'SUPER_ADMIN' && album.creatorId !== admin.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const data = photos.map(photo => ({
            url: photo.url,
            caption: photo.caption || null,
            albumId: albumId
        }));

        await prisma.galleryImage.createMany({
            data
        });

        await revalidateGallery();
        return { success: true };
    }, 'addPhotosToAlbum');
}

export async function deletePhoto(id: string): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) return { success: false, error: 'Admin not found' };

        // Security: Verify photo's album ownership before deletion
        const photo = await prisma.galleryImage.findUnique({
            where: { id },
            select: { album: { select: { creatorId: true } } }
        });
        if (!photo) return { success: false, error: 'Photo not found' };
        if (admin.role === 'BRANCH_SPORTS_ADMIN') return { success: false, error: 'Unauthorized: View-only access' };
        if (admin.role !== 'SUPER_ADMIN' && photo.album.creatorId !== admin.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.galleryImage.delete({ where: { id } });
        await revalidateGallery();
        return { success: true };
    }, 'deletePhoto');
}

export async function deleteGalleryImages(ids: string[]): Promise<GalleryActionResponse> {
    return executeAction(async () => {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) return { success: false, error: 'Admin not found' };

        // Security: Only delete photos from albums the caller owns (or SUPER_ADMIN)
        if (admin.role === 'BRANCH_SPORTS_ADMIN') return { success: false, error: 'Unauthorized: View-only access' };
        if (admin.role !== 'SUPER_ADMIN') {
            const ownedAlbums = await prisma.galleryAlbum.findMany({
                where: { creatorId: admin.id },
                select: { id: true }
            });
            const ownedAlbumIds = new Set(ownedAlbums.map(a => a.id));

            // Verify all photos belong to owned albums
            const photos = await prisma.galleryImage.findMany({
                where: { id: { in: ids } },
                select: { id: true, albumId: true }
            });
            const unauthorized = photos.filter(p => !ownedAlbumIds.has(p.albumId));
            if (unauthorized.length > 0) {
                return { success: false, error: 'Unauthorized: Some photos belong to albums you do not own' };
            }
        }

        await prisma.galleryImage.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        await revalidateGallery();
        return { success: true };
    }, 'deleteGalleryImages');
}

export async function updateGalleryImage(id: string, data: UpdateGalleryImageData): Promise<GalleryActionResponse> {
    try {
        const user = await getSessionUser();
        const admin = await prisma.admin.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
        });
        if (!admin) return { success: false, error: 'Admin not found' };

        const image = await prisma.galleryImage.findUnique({
            where: { id },
            select: {
                album: {
                    select: {
                        creatorId: true,
                        creator: {
                            select: { role: true }
                        }
                    }
                }
            }
        });
        if (!image) return { success: false, error: 'Photo not found' };

        const isSuperAdmin = admin.role === 'SUPER_ADMIN';
        const isOwner = image.album.creatorId === admin.id;
        const isSportsAdminScoped = (admin.role === 'SPORTS_ADMIN' || admin.role === 'BRANCH_SPORTS_ADMIN') && image.album.creator?.role === 'SPORTS_ADMIN';

        if (admin.role === 'BRANCH_SPORTS_ADMIN' || (!isSuperAdmin && !isOwner && !isSportsAdminScoped)) {
            return { success: false, error: 'Unauthorized: View-only access' };
        }

        const updateData: Prisma.GalleryImageUpdateInput = {};
        if (data.caption !== undefined) {
            updateData.caption = data.caption?.trim() ? data.caption.trim() : null;
        }
        if (data.url !== undefined) {
            updateData.url = data.url;
        }

        if (Object.keys(updateData).length === 0) {
            return { success: false, error: 'No updates provided' };
        }

        const updated = await prisma.galleryImage.update({
            where: { id },
            data: updateData
        });

        await revalidateGallery();
        return {
            success: true,
            data: {
                id: updated.id,
                url: updated.url,
                caption: updated.caption || ''
            }
        };
    } catch (error) {
        console.error('Update Gallery Image Error:', error);
        return { success: false, error: 'Failed to update photo' };
    }
}

