import { WinnerAnnouncementsPage } from '@/components/features/admin/views/WinnerAnnouncementsPage';
import { getWinnerAnnouncements, getEventsForWinners } from '@/actions/winnerActions';

export default async function Page() {
    const winnersPromise = getWinnerAnnouncements();
    const eventsPromise = getEventsForWinners();

    const [winnersRes, eventsRes] = await Promise.all([winnersPromise, eventsPromise]);

    const initialWinners = winnersRes.success ? winnersRes.data : [];
    const availableEvents = eventsRes.success ? eventsRes.data : [];

    return <WinnerAnnouncementsPage initialWinners={initialWinners || []} availableEvents={availableEvents || []} readOnlyFromRegistrations={true} />;
}
