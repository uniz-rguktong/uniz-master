import HomeClient from '@/app/home/HomeClient';
import { getNeonCoreStats } from '@/lib/actions/gamification';
import { getActiveAnnouncements } from '@/lib/data/announcements';
import { getPublishedEvents } from '@/lib/data/events';
import { getFestSettings } from '@/lib/data/fest-settings';

export default async function HomePage() {
    let neonStats: any = { totalEnergy: 0, totalCadets: 0, topCadets: [] };
    let announcements: any[] = [];
    let todaysMissions: any[] = [];
    let festSettings = null;

    try {
        const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const [stats, activeAnnouncements, publishedEvents, settings] = await Promise.all([
            getNeonCoreStats().catch(() => ({ totalEnergy: 0, totalCadets: 0, topCadets: [] })),
            getActiveAnnouncements().catch(() => []),
            getPublishedEvents(200).catch(() => []),
            getFestSettings().catch(() => null)
        ]);

        neonStats = stats;
        announcements = activeAnnouncements;
        todaysMissions = publishedEvents.filter(mission => mission.eventDate === todayStr);
        festSettings = settings;
    } catch (error) {
        console.error("Error loading home page data:", error);
    }

    return (
        <HomeClient 
            neonStats={neonStats} 
            announcements={announcements}
            todaysMissions={todaysMissions}
            festSettings={festSettings}
        />
    );
}
