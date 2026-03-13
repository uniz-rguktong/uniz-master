import { getPublishedEvents } from '@/lib/data/events';
import { getCulturalGalleryAlbums, getCulturalPromoVideos, getAllCulturalImages, getCulturalBrandLogos } from '@/lib/data/gallery';
import { getEventParticipationSnapshot } from '@/lib/data/user-participation';
import CulturalsClient from './CulturalsClient';
import { getSession } from '@/lib/auth';

export const revalidate = 60;

export default async function CulturalsPage() {
    const session = await getSession();
    const [events, albums, promoVideos, allImages, logos] = await Promise.all([
        getPublishedEvents(250),
        getCulturalGalleryAlbums(45, 30),
        getCulturalPromoVideos(),
        getAllCulturalImages(120),
        getCulturalBrandLogos()
    ]);

    const culturalEvents = events.filter((e) => e.eventCategory === 'CULTURAL' || e.subCategory === 'KALADHARANI' || e.subCategory === 'KALADHARINI' || e.category === 'CULTURAL');

    let registeredEventIds: string[] = [];
    let userProfile = null;

    if (session?.user?.id) {
        const snapshot = await getEventParticipationSnapshot(session.user.id);
        registeredEventIds = snapshot.registeredEventIds;
        userProfile = snapshot.userProfile;
    }

    return (
        <CulturalsClient
            events={culturalEvents}
            albums={albums}
            promoVideos={promoVideos}
            allImages={allImages}
            logos={logos}
            registeredEventIds={registeredEventIds}
            userProfile={userProfile}
        />
    );
}
