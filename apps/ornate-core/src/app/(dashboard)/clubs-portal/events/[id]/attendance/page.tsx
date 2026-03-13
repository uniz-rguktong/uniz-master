import { AttendanceView } from '@/components/features/admin/views/AttendanceView';

interface ClubCoordinatorAttendancePageProps {
    params: Promise<{ id: string }>;
}

export default async function ClubCoordinatorAttendancePage({ params }: ClubCoordinatorAttendancePageProps) {
    const { id: eventId } = await params;

    return (
        <AttendanceView
            eventId={eventId}
            backPath="/clubs-portal/live-attendance"
            backLabel="Back to Live Attendance"
        />
    );
}
