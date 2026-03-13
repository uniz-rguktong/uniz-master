import { getSportsScheduleData } from '@/lib/data/sports';
import SportsScheduleClient, { Match, MatchStatus } from './SportsScheduleClient';

export default async function SportsSchedulePage() {
    const sports = await getSportsScheduleData();

    const matches: Match[] = [];

    for (const sport of sports) {
        for (const match of sport.matches) {
            // Map DB gender (MALE/FEMALE) to display category (BOYS/GIRLS)
            let category: 'BOYS' | 'GIRLS' = 'BOYS';
            if (sport.gender === 'FEMALE' || sport.gender === 'GIRLS') {
                category = 'GIRLS';
            }

            // Map DB status to MatchStatus
            let status: MatchStatus = 'UPCOMING';
            const s = match.status?.toUpperCase();
            if (s === 'LIVE') status = 'LIVE';
            else if (s === 'COMPLETED' || s === 'DONE') status = 'COMPLETED';
            else if (s === 'PENDING' || s === 'UPCOMING') status = 'UPCOMING';

            matches.push({
                id: match.id,
                sport: sport.name.toUpperCase(),
                teamA: match.team1Name || 'TBD',
                teamB: match.team2Name || 'TBD',
                venue: match.venue || 'TBD',
                date: match.date
                    ? new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'TBD',
                day: match.date
                    ? new Date(match.date).toLocaleDateString('en-US', { weekday: 'short' })
                    : 'TBD',
                time: match.time || 'TBD',
                status,
                category,
                round: match.round || 'Round 1',
            });
        }
    }

    // Sort: LIVE first, then UPCOMING, then COMPLETED; within each group sort by date
    const order: Record<MatchStatus, number> = { LIVE: 0, UPCOMING: 1, COMPLETED: 2 };
    matches.sort((a, b) => (order[a.status] - order[b.status]) || a.date.localeCompare(b.date));

    return <SportsScheduleClient matches={matches} />;
}
