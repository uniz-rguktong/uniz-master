import { getPublishedEventsForRoadmap } from '@/lib/data/events';
import RoadmapClient from './RoadmapClient';

export const revalidate = 300;

export default async function RoadmapPage() {
    const missions = await getPublishedEventsForRoadmap(250);

    const events = missions.map((mission) => {
        const dayMatch = mission.eventDay?.match(/Day (\d)/i);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;

        // Use actual start time from event if available, fallback to ID-based spread
        const hour = 9 + (parseInt(mission.id.replace(/\D/g, '') || '0', 10) % 12);
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;

        return {
            id: mission.id,
            title: mission.title,
            timeStr,
            type: mission.eventCategory,
            description: mission.description,
            venue: mission.venue || 'Unknown Location',
            origin: mission.subCategory || mission.category,
            category: mission.category.toLowerCase(),
            subCategory: mission.subCategory?.toLowerCase() || 'all',
            day,
        };
    });

    return <RoadmapClient events={events} />;
}
