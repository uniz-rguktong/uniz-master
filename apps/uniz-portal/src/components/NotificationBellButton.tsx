import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationUnread } from "@/hooks/useNotificationUnread";

type Props = {
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
  to?: string;
};

export function NotificationBellButton({
  active = false,
  size = "md",
  className,
  to = "/student/notifications",
}: Props) {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationUnread();

  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const icon = size === "sm" ? 17 : 18;

  return (
    <button
      type="button"
      title="Notifications"
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      onClick={() => navigate(to)}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border transition-all",
        dim,
        active
          ? "border-navy-300 bg-navy-50 text-navy-900"
          : "border-zinc-100 bg-white text-navy-500 shadow-sm hover:border-navy-200 hover:bg-navy-50/80 hover:text-navy-800",
        className,
      )}
    >
      <Bell size={icon} strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-navy-900 px-1 text-[9px] font-bold text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
