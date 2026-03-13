import { WinnerAnnouncementsPage } from '@/components/features/admin/views/WinnerAnnouncementsPage';
import { getWinnerAnnouncements, getEventsForWinners } from '@/actions/winnerActions';

export default async function HHOEventWinnersPage() {
    const [winnersRes, eventsRes] = await Promise.all([
        getWinnerAnnouncements(),
        getEventsForWinners()
    ]);

    const initialWinners = winnersRes.success ? winnersRes.data : [];
    const availableEvents = eventsRes.success ? eventsRes.data : [];

    return (
        <WinnerAnnouncementsPage
            initialWinners={initialWinners || []}
            availableEvents={availableEvents || []}
            readOnlyFromRegistrations={true}
        />
    );
}
