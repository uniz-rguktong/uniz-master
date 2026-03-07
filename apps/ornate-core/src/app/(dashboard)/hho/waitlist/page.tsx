import { WaitlistManagementPage } from "@/components/features/admin/views/WaitlistManagementPage";
import { getWaitlistRegistrations } from "@/actions/registrationGetters";

export default async function HHOWaitlistPage() {
  const result = await getWaitlistRegistrations();
  const initialRegistrations = result.success ? (result.data ?? []) : [];

  return <WaitlistManagementPage initialRegistrations={initialRegistrations} />;
}
