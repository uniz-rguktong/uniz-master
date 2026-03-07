import { PendingApprovalsPage } from "@/components/features/admin/views/PendingApprovalsPage";
import { getPendingRegistrations } from "@/actions/registrationGetters";

export default async function HHOPendingRegistrationsPage() {
  const result = await getPendingRegistrations();
  const initialRegistrations = result.success ? result.data : [];

  return (
    <PendingApprovalsPage
      initialRegistrations={(initialRegistrations || []) as any[]}
      decoupleMetricsFromFilters
    />
  );
}
