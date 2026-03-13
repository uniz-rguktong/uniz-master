import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { type MissionData, mapEventToMission } from './events';

export type BranchDetailData = {
    slug: string;
    name: string;
    description: string;
    updates: string[];
    events: MissionData[];
    hallOfFame: unknown[];
    winners: unknown[];
    videos: { title: string; url: string; thumbnail: string | null; category: string }[];
    gallery: string[];
    albums: { id: string; title: string; images: string[]; coverImage: string | null }[];
    standings: { sport: string; branch: string; points: number }[];
    brandLogos: string[];
};

export const getBranchDetail = unstable_cache(
    async (slug: string): Promise<BranchDetailData | null> => {
        // Normalize slug to category name
        const slugToCategory: Record<string, string> = {
            cse: 'CSE', ece: 'ECE', eee: 'EEE', mechanical: 'MECH',
            civil: 'CIVIL', hho: 'HHO',
            artix: 'ARTIX', kaladharani: 'KALADHARANI', icro: 'ICRO',
            khelsaathi: 'KHELSAATHI', pixelro: 'PIXLERO',
            sarvasrijana: 'SARVASRIJANA', techxcel: 'TECHXCEL',
        };

        const category = slugToCategory[slug.toLowerCase()];
        if (!category) return null;

        const [events, albums, videos, branchPoints, announcements, eventWinners, bestOutgoingStudents, brandLogos] =
            await Promise.all([
                prisma.event.findMany({
                    where: {
                        status: 'PUBLISHED',
                        OR: [
                            { category: category },
                            { Admin_Event_creatorIdToAdmin: { branch: slug.toLowerCase() } },
                            { Admin_Event_creatorIdToAdmin: { clubId: slug.toLowerCase() } }
                        ]
                    },
                    include: {
                        _count: { select: { Registration: true } },
                        Admin_Event_creatorIdToAdmin: { select: { branch: true, clubId: true } },
                        Admin_EventCoordinators: {
                            select: {
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { date: 'asc' },
                    take: 20,
                }),
                prisma.galleryAlbum.findMany({
                    where: {
                        isArchived: false,
                        Admin: {
                            OR: [
                                { branch: slug.toLowerCase() },
                                { clubId: slug.toLowerCase() }
                            ]
                        }
                    },
                    include: { GalleryImage: { take: 20 } },
                }),
                prisma.promoVideo.findMany({
                    where: {
                        status: 'active',
                        Admin: {
                            OR: [
                                { branch: slug.toLowerCase() },
                                { clubId: slug.toLowerCase() },
                                { role: 'SUPER_ADMIN' }
                            ]
                        }
                    },
                    orderBy: { uploadDate: 'desc' },
                    take: 30,
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
                prisma.bestOutgoingStudent.findMany({
                    where: {
                        isPublished: true,
                        OR: [
                            { branch: category },  // Branch-specific best students
                            { isOverall: true },    // Overall best students (all branches, added by Super Admin)
                        ],
                    },
                    include: {
                        Admin: {
                            select: {
                                role: true,
                            }
                        }
                    },
                    orderBy: { awardYear: 'desc' },
                }),
                prisma.brandLogo.findMany({
                    where: {
                        status: 'active',
                        Admin: {
                            OR: [
                                { branch: slug.toLowerCase() },
                                { clubId: slug.toLowerCase() }
                            ]
                        }
                    },
                    select: { url: true }
                })
            ]);

        const galleryUrls = albums.flatMap((a) => a.GalleryImage.map((img) => img.url));

        // Map the events to MissionData based on standardized mapping logic
        const mappedEvents: MissionData[] = events.map((event) =>
            mapEventToMission(event, event._count.Registration)
        );

        const hallOfFame = bestOutgoingStudents.map((bos) => ({
            id: bos.id,
            status: bos.isOverall ? 'OVERALL BEST' : 'BRANCH BEST',
            title: `${bos.year} Year / ${bos.awardYear}`,
            organization: bos.company ? `Placed at ${bos.company} (${bos.package})` : `CGPA: ${bos.cgpa}`,
            student: bos.name,
            isOverall: bos.isOverall,             // direct field from DB
            addedBySuperAdmin: bos.isOverall,     // used by HallOfFameSection to split left/right column
        }));

        const names: Record<string, string> = {
            'CSE': 'TECHZEON',
            'ECE': 'ELECSPIRE',
            'EEE': 'POWERMANIA',
            'CIVIL': 'NIRMAAN',
            'MECH': 'YANTHRIKA',
            'HHO': 'HHO',
            'ARTIX': 'ARTIX',
            'KALADHARANI': 'KALADHARANI',
            'ICRO': 'ICRO',
            'KHELSAATHI': 'KHELSAATHI',
            'PIXLERO': 'PIXLERO',
            'SARVASRIJANA': 'SARVASRIJANA',
            'TECHXCEL': 'TECHXCEL',
        };

        const descriptions: Record<string, string> = {
            'CSE': 'where ideas become code and innovation never stops.',
            'ECE': 'the planet that keeps the entire system connected.',
            'EEE': 'the planet where energy flows and circuits power the future.',
            'CIVIL': 'where explorers design the foundations of tomorrow.',
            'MECH': 'a world driven by machines, motion, and mechanical creativity.',
            'HHO': 'the planet where kindness powers the strongest energy.',
            'ICRO': 'the planet where minds prepare for the toughest challenges.',
            'KHELSAATHI': 'where passion, teamwork, and competition thrive.',
            'PIXLERO': 'where every moment becomes a story.',
            'TECHXCEL': 'the innovation lab of the ORNATE universe.',
            'ARTIX': 'the planet where ideas find their voice.',
            'KALADHARANI': 'where culture, rhythm, and performance come alive.',
            'SARVASRIJANA': 'where imagination turns into creation.',
        };

        return {
            slug,
            name: names[category] || category,
            description: descriptions[category] || `Welcome to the ${category} portal.`,
            updates: announcements.map((a) => `${a.title}: ${a.content}`),
            events: mappedEvents,
            hallOfFame: hallOfFame,
            winners: eventWinners.map((w) => ({
                eventId: w.eventId,
                eventTitle: w.Event.title,
                positions: w.positions,
            })),
            videos: videos.map((v) => ({
                title: v.title,
                url: v.url,
                thumbnail: v.thumbnail,
                category: v.category,
            })),
            gallery: galleryUrls.slice(0, 15),
            albums: albums.map((a) => ({
                id: a.id,
                title: a.title,
                images: a.GalleryImage.map((img) => img.url),
                coverImage: a.coverImage || a.GalleryImage[0]?.url || null,
            })),
            standings: branchPoints.map((bp) => ({
                sport: bp.Sport.name,
                branch: bp.branch,
                points: bp.points + bp.manualAdjustment,
            })),
            brandLogos: brandLogos.map((l) => l.url),
        };
    },
    ['branch-detail'],
    { tags: ['branch-detail'], revalidate: 30 }
);
