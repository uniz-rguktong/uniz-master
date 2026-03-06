import { AccessControlPage } from '@/components/features/hho/views/AccessControlPage';
import { getSystemUsers, getAuditLogs } from '@/actions/userGetters';

export default async function HHOAccessControlPage() {
    const usersRes = await getSystemUsers();
    const logsRes = await getAuditLogs();

    return <AccessControlPage initialUsers={(usersRes.data || []) as any[]} initialLogs={(logsRes.data || []) as any[]} />;
}