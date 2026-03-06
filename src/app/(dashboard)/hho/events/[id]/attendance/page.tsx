import { AttendanceView } from '@/components/features/admin/views/AttendanceView';

interface HHOAttendancePageProps {
    params: Promise<{ id: string }>;
}

export default async function HHOAttendancePage({ params }: HHOAttendancePageProps) {
    const { id: eventId } = await params;

    return (
        <AttendanceView
            eventId={eventId}
            backPath="/hho/live-attendance"
            backLabel="Back to Live Attendance"
        />
    );
}
