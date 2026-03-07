import { RegistrationsTable } from "@/components/shared/RegistrationsTable";
import { ADMIN_CONFIG } from "@/components/shared/RegistrationsTable/configs";
import { getAllRegistrations } from "@/actions/registrationGetters";
import { getEventsListForFilter } from "@/actions/eventGetters";
import { getEventAnalytics } from "@/actions/analyticsGetters";
import {
  deleteRegistration,
  announceWinnersFromRegistrations,
  assignWinnerPrizeAndAnnounce,
} from "@/actions/registrationActions";

interface BranchAdminRegistrationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({
  searchParams,
}: BranchAdminRegistrationsPageProps) {
  const resolvedParams = await searchParams;
  const query =
    (Array.isArray(resolvedParams?.q)
      ? resolvedParams?.q[0]
      : resolvedParams?.q) || "";
  const page = Number(resolvedParams?.page) || 1;
  const limit = Number(resolvedParams?.limit) || 10;
  const status =
    (Array.isArray(resolvedParams?.status)
      ? resolvedParams?.status[0]
      : resolvedParams?.status) || "all";
  const eventId =
    (Array.isArray(resolvedParams?.eventId)
      ? resolvedParams?.eventId[0]
      : resolvedParams?.eventId) || "all";

  const [allRegsResult, eventsResult, analyticsResult] = await Promise.all([
    getAllRegistrations({ page, limit, search: query, status, eventId }),
    getEventsListForFilter(),
    getEventAnalytics(),
  ]);

  const registrations = allRegsResult.data?.registrations || [];
  const pagination = allRegsResult.data?.pagination;
  const events = eventsResult.data || [];

  const stats = analyticsResult?.data?.summary || {
    totalOnlineRegistrations: 0,
    totalOfflineRegistrations: 0,
    totalRevenue: 0,
    avgAttendanceRate: 0,
  };

  const actions = {
    fetchRegistrations: getAllRegistrations,
    deleteRegistration: deleteRegistration,
    announceWinners: announceWinnersFromRegistrations,
    assignWinnerPrize: assignWinnerPrizeAndAnnounce,
  };

  return (
    <RegistrationsTable
      variant="admin"
      hideSelection
      initialData={{
        registrations: (registrations || []) as any[],
        pagination,
        events: (events || []).map((e) => ({ id: e.id, title: e.title })),
        stats,
      }}
      actions={actions}
    />
  );
}
