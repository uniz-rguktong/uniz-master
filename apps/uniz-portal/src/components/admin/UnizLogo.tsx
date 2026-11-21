import { cn } from "@/lib/utils";
import { Lockup, Mark } from "@/components/brand/Mark";

type UnizLogoProps = {
  /** Sidebar collapsed — mark only */
  collapsed?: boolean;
  /** Kept for existing callers. The collapsed state is always the mark. */
  abbreviate?: boolean;
  /** Larger wordmark for auth/marketing surfaces */
  size?: "md" | "lg";
  /** Auth screens: lockup with an optional portal label */
  variant?: "default" | "auth";
  portalLabel?: string;
  className?: string;
  /** `chrome` is white on navy. `ink` is navy on light. */
  tone?: "ink" | "chrome";
};

export function UnizLogo({
  collapsed = false,
  size = "md",
  variant = "default",
  portalLabel,
  className,
  tone = "ink",
}: UnizLogoProps) {
  const large = size === "lg" || variant === "auth";
  const mark = large ? 40 : 28;
  const word = large ? 24 : 18;

  if (collapsed) {
    return (
      <span className={cn(tone === "chrome" ? "text-white" : "text-navy-900", className)}>
        <Mark size={24} title="UniZ" />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 flex-col gap-1", className)}>
      <Lockup mark={mark} word={word} tone={tone} />
      {portalLabel ? (
        <span className={cn("text-small", tone === "chrome" ? "text-navy-300" : "text-text-2")}>
          {portalLabel}
        </span>
      ) : null}
    </span>
  );
}
