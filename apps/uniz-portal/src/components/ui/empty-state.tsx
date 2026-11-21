import type { ReactNode } from "react";
import { AlertCircle, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Centred empty or error state. No box.
 * Title is serif. One action.
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
  tone = "default",
  className,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "error";
  className?: string;
}) {
  const IconCmp = icon ?? (tone === "error" ? AlertCircle : Inbox);
  return (
    <div className={cn("mt-6 flex flex-col items-center px-4 text-center", className)}>
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          tone === "error" ? "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] text-error" : "bg-tint text-text-2",
        )}
      >
        <IconCmp size={32} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="mt-4 font-serif text-[22px] font-normal leading-[30px] tracking-[-0.01em] text-head">
        {title}
      </h2>
      {body ? <p className="mt-2 max-w-[380px] text-body leading-6 text-text-2">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
