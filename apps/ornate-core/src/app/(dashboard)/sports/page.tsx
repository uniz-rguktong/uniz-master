import { DashboardOverview } from '@/components/features/sports/views/DashboardOverview';
import { WelcomeToast } from '@/components/dashboard/WelcomeToast';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SportsOverviewPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const userBranch = session?.user?.branch;

  const title = (userRole === 'BRANCH_SPORTS_ADMIN' && userBranch)
    ? `${userBranch.toUpperCase()} Sports Dashboard`
    : "Sports Dashboard";

  return (
    <>
      <WelcomeToast title={title} />
      <DashboardOverview />
    </>
  );
}
