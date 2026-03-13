// Unified super-admin live feed (event + sport)
import { getLiveEvents } from '@/actions/superAdminGetters';
import prisma from '@/lib/prisma';

export default async function UnifiedLiveAttendancePage() {
  // Fetch live events
  const liveEvents = await getLiveEvents();
  // Fetch live sports
  const liveSports = await prisma.sport.findMany({
    where: { status: 'ONGOING', isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Normalize and merge
  const allLive = [
    ...liveEvents.map(e => ({
      type: 'Event',
      id: e.id,
      name: e.name,
      category: 'Live Event',
      branch: e.venue,
      date: e.startedAt,
      status: e.status
    })),
    ...liveSports.map(s => ({
      type: 'Sport',
      id: s.id,
      name: s.name,
      category: s.category,
      branch: 'General',
      date: s.createdAt,
      status: 'ONGOING'
    }))
  ];

  return (
    <div>
      <h1>Super Admin Live Feed (Event + Sport)</h1>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Category</th>
            <th>Branch/Venue</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {allLive.map((item, idx) => (
            <tr key={idx}>
              <td>{item.type}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.branch}</td>
              <td>{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
