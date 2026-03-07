import { ConfirmedRegistrationsPage } from "@/components/features/admin/views/ConfirmedRegistrationsPage";
import { getConfirmedRegistrations } from "@/actions/registrationGetters";

export default async function Page() {
  const res = await getConfirmedRegistrations();
  const registrations = "data" in res ? res.data : [];

  return (
    <ConfirmedRegistrationsPage
      initialRegistrations={registrations || []}
      hideSelection
      paginationWindowSize={5}
    />
  );
}
