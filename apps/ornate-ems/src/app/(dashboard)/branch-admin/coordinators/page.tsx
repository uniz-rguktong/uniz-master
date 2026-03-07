import { CoordinatorManagementPage } from "@/components/shared/CoordinatorManagementPage";
import { getCoordinators } from "@/actions/userGetters";

export default async function Page() {
  const { data } = await getCoordinators();

  return <CoordinatorManagementPage initialCoordinators={data || []} />;
}
