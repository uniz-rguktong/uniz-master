import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

type Common = {
  className?: string;
};

/**
 * Service tile. The whole surface is the link. No badge, count, or stat.
 */
export function Tile({
  icon,
  label,
  line,
  href,
  onClick,
  className,
}: Common & {
  icon: LucideIcon;
  label: string;
  line: string;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <Icon icon={icon} size={28} className="text-accent" />
      <p className="mt-[18px] text-[17px] font-semibold leading-6 text-head">{label}</p>
      <p className="mt-2 text-dense leading-[21px] text-text-2">{line}</p>
      <span className="mt-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-head">
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
      </span>
    </>
  );
  const classes = cn(
    "flex min-h-[196px] flex-col rounded-lg border border-border bg-tile px-6 pb-6 pt-7 text-left transition-colors duration-150 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[821px]:min-h-[208px]",
    className,
  );
  if (href) {
    return (
      <a href={href} className={classes}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {body}
    </button>
  );
}

/** Number tile. Status colour only when `status` is set, and then with an icon. */
export function StatTile({
  label,
  value,
  line,
  status,
  icon,
  className,
}: Common & {
  label: string;
  value: ReactNode;
  line?: ReactNode;
  status?: "success" | "warning" | "error";
  icon?: LucideIcon;
}) {
  const statusClass =
    status === "success" ? "text-success" : status === "warning" ? "text-warning" : status === "error" ? "text-error" : "text-text-2";
  return (
    <div className={cn("flex min-h-[148px] flex-col rounded-lg border border-border bg-tile p-6", className)}>
      <p className="text-dense leading-5 text-text-2">{label}</p>
      <p className="mt-3 font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums">
        {value}
      </p>
      {line ? (
        <p className={cn("mt-3 flex items-center gap-1.5 text-dense leading-5", statusClass)}>
          {status && icon ? <Icon icon={icon} size={16} className={statusClass} /> : null}
          {line}
        </p>
      ) : null}
    </div>
  );
}
