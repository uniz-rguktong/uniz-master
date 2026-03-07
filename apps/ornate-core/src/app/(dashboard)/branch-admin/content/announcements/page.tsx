import { UpdatesAnnouncementsPage } from "@/components/features/admin/views/UpdatesAnnouncementsPage";

interface BranchAnnouncementsPageProps {
  searchParams?: Promise<{
    create?: string;
  }>;
}

export default async function Page({
  searchParams,
}: BranchAnnouncementsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const autoOpenCreate = resolvedSearchParams?.create === "true";

  return (
    <UpdatesAnnouncementsPage
      autoOpenCreate={autoOpenCreate}
      enforceExpiryAfterCreation={true}
    />
  );
}
