import { AllEventsPage } from "@/components/features/admin/views/AllEventsPage";
import { getEvents } from "@/actions/eventGetters";

export default async function HHOAllEventsPage() {
  const res = await getEvents();
  const events = "data" in res ? res.data : [];

  return <AllEventsPage initialEvents={events || []} />;
}
