import { AttendanceView } from "@/components/features/admin/views/AttendanceView";

interface CoordinatorAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoordinatorAttendancePage({
  params,
}: CoordinatorAttendancePageProps) {
  const { id: eventId } = await params;

  return (
    <AttendanceView
      eventId={eventId}
      backPath="/coordinator"
      backLabel="Back to Dashboard"
    />
  );
}
