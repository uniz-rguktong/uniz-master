import { redirect } from "next/navigation";
import { getCoordinatorEvents } from "@/actions/coordinatorGetters";

export const dynamic = "force-dynamic";

export default async function CoordinatorLiveAttendanceRedirect() {
  const { success, events, error } = await getCoordinatorEvents();

  // If coordinator has events, redirect to the first event's attendance page
  if (success && events && events.length > 0) {
    redirect(`/coordinator/event/${events[0]!.id}/attendance`);
  }

  // Fallback: redirect to coordinator dashboard if no events found
  redirect("/coordinator");
}
