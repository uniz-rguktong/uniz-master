import { ConfirmedRegistrationsPage } from '@/components/features/admin/views/ConfirmedRegistrationsPage';
import { getConfirmedRegistrations } from '@/actions/registrationGetters';

export default async function HHOConfirmedRegistrationsPage() {
    const result = await getConfirmedRegistrations();
    const initialRegistrations = result.success ? (result.data ?? []) : [];

    return <ConfirmedRegistrationsPage initialRegistrations={initialRegistrations} hideSelection paginationWindowSize={5} />;
}