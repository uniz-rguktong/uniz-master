import { DashboardOverview } from "@/components/features/sports/views/DashboardOverview";
import { WelcomeToast } from "@/components/dashboard/WelcomeToast";

export default function SportsOverviewPage() {
  return (
    <>
      <WelcomeToast title="Sports Dashboard" />
      <DashboardOverview />
    </>
  );
}
