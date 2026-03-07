import { PendingApprovalsPage } from "@/components/features/admin/views/PendingApprovalsPage";
import { getPendingRegistrations } from "@/actions/registrationGetters";

export default async function Page() {
  const res = await getPendingRegistrations();
  const registrations = "data" in res ? res.data : [];

  return (
    <PendingApprovalsPage
      initialRegistrations={(registrations || []) as any[]}
      decoupleMetricsFromFilters
    />
  );
}
