import { WinnersAnnouncementPage } from "@/components/features/sports/views/WinnersAnnouncementPage";
import {
  getSportWinnerAnnouncements,
  getSportsForWinners,
} from "@/actions/sportWinnerActions";

export default async function SportsWinnersPage() {
  const [winnersRes, eventsRes] = await Promise.all([
    getSportWinnerAnnouncements(),
    getSportsForWinners(),
  ]);

  const initialWinners = winnersRes.success ? (winnersRes.data ?? []) : [];
  const availableEvents = eventsRes.success
    ? (eventsRes.data ?? []).map((sport: any) => ({
        id: sport.id,
        title: sport.name,
        category: sport.category,
        date: sport.createdAt,
      }))
    : [];

  return (
    <WinnersAnnouncementPage
      initialWinners={initialWinners as any}
      availableEvents={availableEvents as any}
    />
  );
}
