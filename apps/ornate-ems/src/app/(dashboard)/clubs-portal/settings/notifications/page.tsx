import { NotificationSettingsPage } from "@/components/features/admin/views/NotificationSettingsPage";
import { getAdminProfile } from "@/actions/adminProfileActions";

export default async function Page() {
  const profileRes = await getAdminProfile();
  const notificationSettings = profileRes.success
    ? (profileRes.data as any)?.notificationSettings
    : null;

  return <NotificationSettingsPage initialSettings={notificationSettings} />;
}
