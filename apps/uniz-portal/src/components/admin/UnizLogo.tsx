import { cn } from "@/lib/utils";
import { adminChipClass } from "@/components/admin/admin-ui";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

type UnizLogoProps = {
  /** Sidebar collapsed — compact wordmark */
  collapsed?: boolean;
  /** When collapsed, show "Z." vs "uniZ." */
  abbreviate?: boolean;
  /** Larger wordmark for auth/marketing surfaces */
  size?: "md" | "lg";
  /** Auth screens: wordmark-only lockup with optional portal chip */
  variant?: "default" | "auth";
  portalLabel?: string;
  className?: string;
};

function Wordmark({
  large = false,
  compact = false,
  short = false,
}: {
  large?: boolean;
  compact?: boolean;
  short?: boolean;
}) {
  return (
    <p
      className={cn(
        "uniz-logo-wordmark shrink-0 leading-none text-navy-900",
        compact
          ? large
            ? "text-[1.4rem]"
            : "text-[1.2rem]"
          : large
            ? "text-[2.25rem]"
            : "text-[1.55rem]",
      )}
    >
      uniZ.
    </p>
  );
}

function CampusLabel({ large = false }: { large?: boolean }) {
  return (
    <p
      className={cn(
        "font-semibold uppercase tracking-[0.12em] text-zinc-500",
        large ? "mt-1 text-[9px]" : "mt-0.5 text-[8px]",
      )}
    >
      {UNIZ_CAMPUS_LABEL}
    </p>
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
          <Wordmark large={large} />
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

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Wordmark large={large} compact short={abbreviate} />
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 leading-none", className)}>
      <Wordmark large={large} />
      <CampusLabel large={large} />
    </div>
  );
}
