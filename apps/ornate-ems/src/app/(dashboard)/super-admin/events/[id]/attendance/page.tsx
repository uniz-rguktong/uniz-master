import { AttendanceView } from "@/components/features/admin/views/AttendanceView";

interface SuperAdminAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function SuperAdminAttendancePage({
  params,
}: SuperAdminAttendancePageProps) {
  const { id: eventId } = await params;

  return (
    <AttendanceView
      eventId={eventId}
      backPath="/super-admin/events"
      backLabel="Back to Events"
    />
  );
}
