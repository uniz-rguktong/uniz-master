import { getSportsResultsData } from '@/lib/data/sports';
import MatchResultsClient, { Result } from './MatchResultsClient';
export const revalidate = 30;

export default async function MatchResultsPage() {
    const sports = await getSportsResultsData();

    const results: Result[] = [];

    for (const sport of sports) {
        const completedMatches = sport.matches.filter(m => m.status.toUpperCase() === 'COMPLETED');

        for (const match of completedMatches) {
            // In a real app we would have the exact team scores, for now mock it if empty
            // First is usually teamA. We'll use winner to place team at top if available.
            let firstTeam = match.team1Name || 'TBD';
            let secondTeam = match.team2Name || 'TBD';
            let firstScore = match.score1 || 'N/A';
            let secondScore = match.score2 || 'N/A';

            // Attempt to sort winner to first
            if (match.winner === match.team2Name) {
                firstTeam = match.team2Name || 'TBD';
                secondTeam = match.team1Name || 'TBD';
                firstScore = match.score2 || 'N/A';
                secondScore = match.score1 || 'N/A';
            }

            results.push({
                id: match.id,
                sport: sport.name.toUpperCase(),
                round: match.round || 'Final',
                category: sport.gender === 'BOYS' ? 'BOYS' : sport.gender === 'GIRLS' ? 'GIRLS' : 'MIXED',
                day: 'Match Day', // We can derive day from date if necessary
                date: match.date ? new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
                venue: match.venue || 'TBD',
                first: { team: firstTeam, score: firstScore },
                second: { team: secondTeam, score: secondScore },
            });
        }
    }

    return <MatchResultsClient results={results} />;
}
