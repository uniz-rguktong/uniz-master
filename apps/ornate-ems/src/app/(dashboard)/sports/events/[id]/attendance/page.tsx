import { AttendanceView } from "@/components/features/admin/views/AttendanceView";

interface SportsAdminAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function SportsAdminAttendancePage({
  params,
}: SportsAdminAttendancePageProps) {
  const { id: eventId } = await params;

  return (
    <AttendanceView
      eventId={eventId}
      backPath="/sports/live-attendance"
      backLabel="Back to Live Attendance"
    />
  );
}
