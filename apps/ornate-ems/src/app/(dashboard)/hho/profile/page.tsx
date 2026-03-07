import { ProfilePage } from "@/components/shared/Profile";
import { getAdminProfile } from "@/actions/adminProfileActions";

export default async function Page() {
  const response = await getAdminProfile();
  const profile = response.success ? response.data : null;

  return <ProfilePage initialProfile={profile} variant="hho" />;
}
