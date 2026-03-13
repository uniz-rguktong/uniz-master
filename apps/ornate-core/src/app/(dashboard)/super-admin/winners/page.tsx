// Super-admin winners page: unified event + sport winners
import { getAllWinners } from '@/actions/superAdminGetters';
import { getSportWinnerAnnouncements } from '@/actions/sportWinnerActions';

export default async function SuperAdminWinnersPage() {
  // Fetch event winners
  const eventWinners = await getAllWinners();
  // Fetch sport winners
  const sportWinnersResult = await getSportWinnerAnnouncements();
  const sportWinners = sportWinnersResult?.success ? sportWinnersResult.data : [];

  // Normalize and merge
  const allWinners = [
    ...eventWinners.map((w: any) => ({
      type: 'Event',
      event: w.event,
      branch: w.branch,
      organizer: w.organizer,
      category: w.type,
      winner: w.winner,
      runner: w.runner,
      secondRunner: w.secondRunner,
      publishedAt: null
    })),
    ...sportWinners.map((sw: any) => ({
      type: 'Sport',
      event: sw.sport?.name || 'Unknown Sport',
      branch: sw.sport?.category || 'General',
      organizer: '',
      category: sw.sport?.category || 'Sport',
      winner: sw.positions?.[0]?.teamName || '',
      runner: sw.positions?.[1]?.teamName || '',
      secondRunner: sw.positions?.[2]?.teamName || '',
      publishedAt: sw.publishedAt || null
    }))
  ];

  return (
    <div>
      <h1>Super Admin Winners (Event + Sport)</h1>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Event/Sport</th>
            <th>Branch/Category</th>
            <th>Organizer</th>
            <th>Winner</th>
            <th>Runner</th>
            <th>Second Runner</th>
            <th>Published At</th>
          </tr>
        </thead>
        <tbody>
          {allWinners.map((w, idx) => (
            <tr key={idx}>
              <td>{w.type}</td>
              <td>{w.event}</td>
              <td>{w.branch}</td>
              <td>{w.organizer}</td>
              <td>{w.winner}</td>
              <td>{w.runner}</td>
              <td>{w.secondRunner}</td>
              <td>{w.publishedAt ? new Date(w.publishedAt).toLocaleDateString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
