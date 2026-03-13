import { EventCalendar } from '@/components/shared/EventCalendar';
import { getCalendarEvents } from '@/actions/eventGetters';
import type { CalendarViewType } from '@/components/shared/EventCalendar/types';

export default async function Page() {
    const res = await getCalendarEvents();
    const events = 'data' in res ? res.data : [];

    const config = {
        title: "Clubs Schedule",
        description: "Oversee all scheduled events and academic roadmap",
        defaultView: 'month' as CalendarViewType,
        showAddEvent: true
    };

    return (
        <EventCalendar
            config={config}
            initialEvents={(events || []) as any[]}
            fetchEvents={getCalendarEvents as any}
        />
    );
}
