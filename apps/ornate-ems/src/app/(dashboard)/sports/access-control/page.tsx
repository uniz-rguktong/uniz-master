import { AccessControlPage } from "@/components/features/sports/views/AccessControlPage";
import { getSystemUsers, getAuditLogs } from "@/actions/userGetters";

export default async function Page() {
  const usersRes = await getSystemUsers();
  const logsRes = await getAuditLogs();

  return (
    <AccessControlPage
      initialUsers={(usersRes.data || []) as any[]}
      initialLogs={(logsRes.data || []) as any[]}
    />
  );
}
