import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "neutral" | "success" | "warning" | "error";

const icons: Record<AlertTone, LucideIcon> = {
  neutral: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const text: Record<AlertTone, string> = {
  neutral: "text-text-2",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

/** Inline status message. One or two lines, icon, 8% tint. Not a banner. */
export function Alert({
  tone = "neutral",
  title,
  children,
  icon,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  const IconCmp = icon ?? icons[tone];
  const tint =
    tone === "neutral"
      ? "var(--tint-2)"
      : tone === "success"
        ? "var(--success)"
        : tone === "warning"
          ? "var(--warning)"
          : "var(--error)";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg px-5 py-4", text[tone], className)}
      style={
        tone === "neutral"
          ? { background: "var(--tint-2)" }
          : { background: `color-mix(in srgb, ${tint} 8%, var(--surface))` }
      }
    >
      <IconCmp size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 text-body leading-6">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}
