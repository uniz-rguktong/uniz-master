import { cn } from "@/lib/utils";
import { adminChipClass } from "@/components/admin/admin-ui";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

const MAROON = "#800000";
const MAROON_DARK = "#5c0000";

type UnizLogoProps = {
  /** Sidebar collapsed — show monogram only */
  collapsed?: boolean;
  /** When collapsed, show "Z" monogram vs full mark */
  abbreviate?: boolean;
  /** Larger wordmark for auth/marketing surfaces */
  size?: "md" | "lg";
  /** Auth screens: wordmark-only lockup with optional portal chip */
  variant?: "default" | "auth";
  portalLabel?: string;
  className?: string;
};

function Monogram({
  letter = "u",
  large = false,
}: {
  letter?: string;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl",
        "shadow-[0_2px_8px_rgba(128,0,0,0.22)] ring-1 ring-[#800000]/15",
        large ? "h-11 w-11" : "h-9 w-9",
      )}
      style={{
        background: `linear-gradient(145deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`,
      }}
      aria-hidden
    >
      <span
        className={cn(
          "uniz-logo-wordmark leading-none text-white select-none",
          large ? "text-[22px]" : "text-[18px]",
        )}
      >
        {letter}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/15 to-transparent" />
    </div>
  );
}

export function UnizLogo({
  collapsed = false,
  abbreviate = false,
  size = "md",
  variant = "default",
  portalLabel,
  className,
}: UnizLogoProps) {
  const large = size === "lg";

  if (variant === "auth") {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
          className,
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <p
            className={cn(
              "uniz-logo-wordmark shrink-0 leading-none",
              large ? "text-[2.25rem]" : "text-[1.85rem]",
            )}
            style={{ color: MAROON }}
          >
            uniZ.
          </p>
          <span
            className={cn(
              "shrink-0 font-semibold uppercase text-zinc-500 tracking-[0.12em]",
              large ? "text-[9px]" : "text-[8px]",
            )}
          >
            {UNIZ_CAMPUS_LABEL}
          </span>
        </div>
        {portalLabel && (
          <span
            className={cn(
              adminChipClass,
              "hidden w-fit max-w-full truncate text-zinc-600 sm:inline-flex",
            )}
          >
            {portalLabel}
          </span>
        )}
      </div>
    );
  }

  if (collapsed && abbreviate) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Monogram letter="Z" large={large} />
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Monogram large={large} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Monogram large={large} />
      <div className="min-w-0 leading-none">
        <p
          className={cn(
            "uniz-logo-wordmark leading-none",
            large ? "text-[1.9rem]" : "text-[1.55rem]",
          )}
          style={{ color: MAROON }}
        >
          uniZ.
        </p>
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.12em] text-zinc-500",
            large ? "mt-1 text-[9px]" : "mt-0.5 text-[8px]",
          )}
        >
          {UNIZ_CAMPUS_LABEL}
        </p>
      </div>
    </div>
  );
}
