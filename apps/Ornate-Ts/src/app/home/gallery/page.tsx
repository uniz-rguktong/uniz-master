import { getGalleryAlbums, getPromoVideos } from '@/lib/data/gallery';
import GalleryClient from './GalleryClient';

export const revalidate = 300;

export default async function GalleryPage() {
    const albums = await getGalleryAlbums(45, 30);
    const promoVideos = await getPromoVideos();

    // Categorize albums by tags or creator for the filter UI
    const categorized = {
        all: albums,
        branches: albums.filter((a) => {
            // Priority 1: Match by creator branch
            if (a.creator.role === 'BRANCH_ADMIN' && a.creator.branch) return true;

            // Priority 2: Match by tags
            return a.tags.some((t) => {
                const tag = t.toLowerCase();
                const branchTerms = [
                    'cse', 'computer science',
                    'ece', 'electronics',
                    'eee', 'electrical',
                    'mechanical', 'mech',
                    'civil',
                    'hho', 'humanities'
                ];
                return branchTerms.some(term =>
                    tag === term || tag.includes(term) || tag.startsWith(term)
                );
            });
        }),
        sports: albums.filter((a) =>
            a.creator.role === 'SPORTS_ADMIN' ||
            a.creator.role === 'BRANCH_SPORTS_ADMIN' ||
            a.tags.some((t) => t.toLowerCase().includes('sport') || t.toLowerCase().includes('game'))
        ),
        culturals: albums.filter((a) =>
            a.tags.some((t) => t.toLowerCase().includes('cultural') || t.toLowerCase().includes('event') || t.toLowerCase().includes('fest'))
        ),
        clubs: albums.filter((a) => {
            // Priority 1: Match by creator club
            if (a.creator.role === 'CLUB_COORDINATOR' && a.creator.clubId) return true;

            // Priority 2: Match by tags
            return a.tags.some((t) => {
                const tag = t.toLowerCase();
                const clubTerms = [
                    'pixlero', 'sarvasrijana', 'icro', 'techxcel',
                    'artix', 'kaladharani', 'khelsaathi', 'club', 'sac'
                ];
                return clubTerms.some(term =>
                    tag === term || tag.includes(term) || tag.startsWith(term)
                );
            });
        }),
    };

    return <GalleryClient categorizedAlbums={categorized} promoVideos={promoVideos} />;
}
