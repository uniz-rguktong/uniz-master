import { cn } from "@/lib/utils";

type UnizLogoProps = {
  /** Sidebar collapsed — show monogram only */
  collapsed?: boolean;
  /** When collapsed, show "Z" monogram vs full mark */
  abbreviate?: boolean;
  /** Larger wordmark for auth/marketing surfaces */
  size?: "md" | "lg";
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
  className,
}: UnizLogoProps) {
  const large = size === "lg";

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
            "uniz-logo-wordmark font-semibold tracking-[-0.075em] text-zinc-950",
            large ? "text-[2.35rem]" : "text-[1.65rem]",
          )}
        >
          uniz
        </p>
        <p
          className={cn(
            "font-semibold uppercase tracking-[0.2em] text-zinc-400",
            large ? "mt-1.5 text-[10px]" : "mt-1 text-[9px]",
          )}
        >
          RGUKT
        </p>
      </div>
    </div>
  );
}
