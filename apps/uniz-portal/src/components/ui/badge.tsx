import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "error";

const toneIcon: Record<Exclude<BadgeTone, "neutral">, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const toneText: Record<Exclude<BadgeTone, "neutral">, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

/**
 * 24px status pill. Status tones always include an icon.
 * Text on a tint is the status colour, never text-3.
 */
export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: LucideIcon;
  className?: string;
}) {
  const IconCmp = icon ?? (tone === "neutral" ? undefined : toneIcon[tone]);
  const tint =
    tone === "neutral"
      ? undefined
      : tone === "success"
        ? "var(--success)"
        : tone === "warning"
          ? "var(--warning)"
          : "var(--error)";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-small font-medium",
        tone === "neutral" ? "bg-tint text-text-2" : toneText[tone],
        className,
      )}
      style={
        tint
          ? { background: `color-mix(in srgb, ${tint} 8%, var(--surface))` }
          : undefined
      }
    >
      {IconCmp ? <IconCmp size={14} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </span>
  );
}
