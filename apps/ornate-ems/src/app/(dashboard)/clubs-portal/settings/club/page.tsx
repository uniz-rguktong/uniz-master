import { ClubSettingsPage } from "@/components/features/clubs/views/ClubSettingsPage";
import { getClubSettings } from "@/actions/clubSettingsActions";

export default async function Page() {
  const res = await getClubSettings();
  return <ClubSettingsPage initialSettings={(res.data ?? undefined) as any} />;
}
