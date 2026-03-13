import { AttendanceView } from '@/components/features/admin/views/AttendanceView';
import { unstable_noStore as noStore } from 'next/cache';

interface CoordinatorAttendancePageProps {
    params: Promise<{ id: string }>;
}

export default async function CoordinatorAttendancePage({ params }: CoordinatorAttendancePageProps) {
    noStore();
    const { id: eventId } = await params;

    return (
        <AttendanceView
            eventId={eventId}
            backPath="/coordinator"
            backLabel="Back to Dashboard"
        />
    );
}
