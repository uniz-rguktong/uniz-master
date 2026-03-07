import { WaitlistManagementPage } from "@/components/features/admin/views/WaitlistManagementPage";
import { getWaitlistRegistrations } from "@/actions/registrationGetters";

export default async function Page() {
  const res = await getWaitlistRegistrations();
  const registrations = "data" in res ? res.data : [];

  return <WaitlistManagementPage initialRegistrations={registrations || []} />;
}
