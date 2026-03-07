import { UpdatesAnnouncementsPage } from "@/components/features/admin/views/UpdatesAnnouncementsPage";

interface HHOUpdatesPageProps {
  searchParams?: Promise<{
    create?: string;
  }>;
}

export default async function HHOUpdatesPage({
  searchParams,
}: HHOUpdatesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const autoOpenCreate = resolvedSearchParams?.create === "true";
  return <UpdatesAnnouncementsPage autoOpenCreate={autoOpenCreate} />;
}
