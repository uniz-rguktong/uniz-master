import { AttendanceView } from "@/components/features/admin/views/AttendanceView";

interface BranchAdminAttendancePageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchAdminAttendancePage({
  params,
}: BranchAdminAttendancePageProps) {
  const { id: eventId } = await params;

  return (
    <AttendanceView
      eventId={eventId}
      backPath="/branch-admin/live-attendance"
      backLabel="Back to Live Attendance"
    />
  );
}
