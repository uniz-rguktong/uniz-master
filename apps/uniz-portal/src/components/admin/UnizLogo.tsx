import { cn } from "@/lib/utils";
import { adminChipClass } from "@/components/admin/admin-ui";

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

function Mark({ letter = "u", large = false }: { letter?: string; large?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-[10px] bg-zinc-900",
        "shadow-[0_1px_2px_rgba(10,10,10,0.18)] ring-1 ring-zinc-900/10",
        large ? "h-11 w-11 rounded-xl" : "h-9 w-9",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "font-semibold leading-none tracking-[-0.04em] text-white select-none",
          large ? "text-[21px]" : "text-[17px]",
        )}
      >
        {letter}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/10 to-transparent" />
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
          "flex items-center justify-between gap-4 w-full",
          className,
        )}
      >
        <div className="min-w-0 flex items-baseline gap-2.5">
          <p
            className={cn(
              "uniz-logo-wordmark text-zinc-950 leading-none",
              large ? "text-[2.125rem]" : "text-[1.75rem]",
            )}
          >
            uniZ
          </p>
          <span
            className={cn(
              "font-semibold uppercase text-zinc-400 tracking-[0.14em]",
              large ? "text-[9px] pb-0.5" : "text-[8px]",
            )}
          >
            RGUKT
          </span>
        </div>
        {portalLabel && (
          <span className={cn(adminChipClass, "shrink-0 text-zinc-600")}>
            {portalLabel}
          </span>
        )}
      </div>
    );
  }

  if (collapsed && abbreviate) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Mark letter="Z" large={large} />
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Mark large={large} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Mark large={large} />
      <div className="min-w-0 leading-none">
        <p
          className={cn(
            "uniz-logo-wordmark text-zinc-950 leading-none",
            large ? "text-[1.85rem]" : "text-[1.5rem]",
          )}
        >
          uniZ
        </p>
        <p
          className={cn(
            "font-medium uppercase tracking-[0.12em] text-zinc-400",
            large ? "mt-1 text-[9px]" : "mt-0.5 text-[8px]",
          )}
        >
          RGUKT
        </p>
      </div>
    </div>
  );
}
