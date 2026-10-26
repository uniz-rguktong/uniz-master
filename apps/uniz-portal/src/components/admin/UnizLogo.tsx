import { cn } from "@/lib/utils";
import { adminChipClass } from "@/components/admin/admin-ui";
import { RGUKT_CREST_URL, UNIZ_CAMPUS_LABEL } from "@/constants/branding";

type UnizLogoProps = {
  /** Sidebar collapsed — compact wordmark */
  collapsed?: boolean;
  /** When collapsed, show "Z." vs "uniZ." */
  abbreviate?: boolean;
  /** Larger wordmark for auth/marketing surfaces */
  size?: "md" | "lg";
  /** Auth / sidebar: white wordmark on navy gradient */
  variant?: "default" | "auth" | "sidebar";
  portalLabel?: string;
  className?: string;
};

function Wordmark({
  large = false,
  compact = false,
  short = false,
  inverted = false,
}: {
  large?: boolean;
  compact?: boolean;
  short?: boolean;
  inverted?: boolean;
}) {
  return (
    <p
      className={cn(
        "uniz-logo-wordmark shrink-0 leading-none",
        inverted ? "text-white" : "text-[#0A2540]",
        compact
          ? large
            ? "text-[1.1rem]"
            : "text-[0.95rem]"
          : large
            ? "text-[1.35rem]"
            : "text-[1.05rem]",
      )}
    >
      {short ? "Z" : "UNIZ"}
    </p>
  );
}

function CampusLabel({
  large = false,
  inverted = false,
}: {
  large?: boolean;
  inverted?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-semibold uppercase tracking-[0.12em] font-sans",
        inverted ? "text-white/70" : "text-[#5A7A94]",
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
  const onNavy = variant === "auth";

  if (variant === "auth") {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-3",
          className,
        )}
      >
        <img
          src={RGUKT_CREST_URL}
          alt="UniZ"
          className="h-9 w-9 shrink-0 rounded-full bg-white object-contain ring-1 ring-white/25 shadow-sm"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Wordmark large={large} inverted />
          <span
            className={cn(
              "shrink-0 font-semibold uppercase tracking-[0.12em] text-white/70 font-sans",
              large ? "text-[9px]" : "text-[8px]",
            )}
          >
            {UNIZ_CAMPUS_LABEL}
          </span>
          {portalLabel && (
            <span
              className={cn(
                adminChipClass,
                "mt-1 hidden w-fit max-w-full truncate border-white/25 bg-white/10 text-white/90 sm:inline-flex",
              )}
            >
              {portalLabel}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <img
          src={RGUKT_CREST_URL}
          alt="UniZ"
          className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-[#0A2540]/15 shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 leading-none", className)}>
      <img
        src={RGUKT_CREST_URL}
        alt="UniZ"
        className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-[#0A2540]/15 shadow-sm"
      />
      <div className="min-w-0">
        <Wordmark large={large} inverted={onNavy} />
        <CampusLabel large={large} inverted={onNavy} />
      </div>
    </div>
  );
}
