import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationUnread } from "@/hooks/useNotificationUnread";

type Props = {
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
  to?: string;
  /** `chrome` is the white control on a navy bar. */
  tone?: "default" | "chrome";
};

export function NotificationBellButton({
  active = false,
  size = "md",
  className,
  to = "/student/notifications",
  tone = "default",
}: Props) {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationUnread();
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <button
      type="button"
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      onClick={() => navigate(to)}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        dim,
        tone === "chrome"
          ? "text-white hover:bg-white/10"
          : active
            ? "bg-tint text-head"
            : "text-text-2 hover:bg-tint",
        className,
      )}
    >
      <Bell size={18} strokeWidth={1.75} aria-hidden />
      {unreadCount > 0 ? (
        <span
          className={cn(
            "absolute right-2 top-2 h-2 w-2 rounded-full",
            tone === "chrome" ? "bg-white" : "bg-navy-600",
          )}
        />
      ) : null}
    </button>
  );
}
