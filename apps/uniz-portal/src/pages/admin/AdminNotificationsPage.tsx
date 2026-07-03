import NotificationCenter from "@/pages/NotificationCenter";
import { useIsAuth } from "@/hooks/is_authenticated";

export default function AdminNotificationsPage() {
  useIsAuth();
  return <NotificationCenter portal="admin" />;
}
