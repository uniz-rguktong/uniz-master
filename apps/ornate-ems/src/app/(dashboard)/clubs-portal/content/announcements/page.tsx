import { UpdatesAnnouncementsPage } from '@/components/features/admin/views/UpdatesAnnouncementsPage';

interface ClubAnnouncementsPageProps {
    searchParams?: Promise<{
        create?: string;
    }>;
}

export default async function Page({ searchParams }: ClubAnnouncementsPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const autoOpenCreate = resolvedSearchParams?.create === 'true';

    return <UpdatesAnnouncementsPage autoOpenCreate={autoOpenCreate} enforceExpiryAfterCreation={true} />;
}
