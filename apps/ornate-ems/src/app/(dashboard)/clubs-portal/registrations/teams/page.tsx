import { TeamRegistrationPage } from '@/components/features/clubs/views/TeamRegistrationPage';
import { getTeamRegistrations } from '@/actions/registrationGetters';
import { getEventsListForFilter } from '@/actions/eventGetters';

export default async function Page() {
    const [teamsRes, eventsRes] = await Promise.all([
        getTeamRegistrations(),
        getEventsListForFilter()
    ]);
    const teams = teamsRes.data || [];
    const events = eventsRes.data || [];
    return <TeamRegistrationPage
        initialTeams={(teams || []) as any[]}
        initialEvents={(events || []) as any[]}
    />;
}
