import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, ChevronRight, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export const overviewSectionTitleClass =
  "font-serif text-[22px] font-normal leading-[30px] tracking-[-0.01em] text-head min-[821px]:text-[24px] min-[821px]:leading-8";

export const overviewCardClass =
  "min-w-0 rounded-lg border border-border bg-tile p-4 min-[640px]:p-6";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const textLinkClass = cn(
  "inline-flex min-h-11 shrink-0 items-center gap-0.5 px-1 text-dense font-medium text-link",
  focusRing,
);

export function OverviewStat({
  label,
  value,
  line,
  status,
}: {
  label: string;
  value: ReactNode;
  line: string;
  status?: "success" | "warning";
}) {
  const statusClass =
    status === "success" ? "text-success" : status === "warning" ? "text-warning" : "text-text-2";
  const StatusIcon = status === "success" ? Check : status === "warning" ? AlertTriangle : null;
  return (
    <div
      role="group"
      aria-label={`${label} ${value}, ${line}`}
      className="flex min-h-[124px] min-w-0 flex-col rounded-lg border border-border bg-tile p-4 min-[821px]:min-h-[148px] min-[821px]:p-6"
    >
      <p className="text-dense text-text-2">{label}</p>
      <p className="mt-2 font-sans text-[32px] font-semibold leading-10 tracking-[-0.01em] text-head tabular-nums">
        {value}
      </p>
      <p className={cn("mt-auto flex items-center gap-1.5 pt-1.5 text-small", statusClass)}>
        {StatusIcon ? <StatusIcon size={16} strokeWidth={1.75} aria-hidden /> : null}
        <span className="min-w-0">{line}</span>
      </p>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[640px]:grid-cols-4 min-[821px]:gap-4">{children}</div>
  );
}

export function SectionHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className={overviewSectionTitleClass}>{title}</h2>
        {sub ? <p className="mt-0.5 text-small text-text-3">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function OverviewLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={textLinkClass}>
      {children}
      <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}

export function OverviewTextButton({
  onClick,
  children,
  busy = false,
  chevron = true,
}: {
  onClick: () => void;
  children: ReactNode;
  busy?: boolean;
  chevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy || undefined}
      className={cn(textLinkClass, "disabled:opacity-[0.45]")}
    >
      {children}
      {chevron ? <ChevronRight size={16} strokeWidth={1.75} aria-hidden /> : null}
    </button>
  );
}

export function InlineRetry({
  title,
  body,
  onRetry,
  busy = false,
  bare = false,
}: {
  title: string;
  body?: string;
  onRetry: () => void;
  busy?: boolean;
  bare?: boolean;
}) {
  const inner = (
    <div className="flex min-w-0 gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] text-error">
        <AlertCircle size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-head">{title}</p>
        {body ? <p className="mt-0.5 text-dense text-text-2">{body}</p> : null}
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={onRetry}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden />
          {busy ? "Trying again…" : "Try again"}
        </Button>
      </div>
    </div>
  );
  if (bare) {
    return (
      <div role="alert" className="min-w-0">
        {inner}
      </div>
    );
  }
  return (
    <div role="alert" className={overviewCardClass}>
      {inner}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="flex min-h-[124px] min-w-0 flex-col rounded-lg border border-border bg-tile p-4 min-[821px]:min-h-[148px] min-[821px]:p-6">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="mt-2.5 h-9 w-1/2" />
      <Skeleton className="mt-auto h-4 w-2/3" />
    </div>
  );
}

const rowWidths = ["w-3/5", "w-[54%]", "w-1/2", "w-[42%]", "w-[36%]"];

export function ListSkeleton({
  rows,
  panel = false,
}: {
  rows: number;
  panel?: boolean;
}) {
  return (
    <div
      className={
        panel
          ? "min-w-0 rounded-xl border border-border bg-panel p-4 min-[640px]:p-6 min-[821px]:p-8"
          : overviewCardClass
      }
    >
      <Skeleton className="mb-3 h-6 w-2/5" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between gap-3 py-3.5",
            index > 0 && "border-t border-border",
          )}
        >
          <Skeleton className={cn("h-4", rowWidths[index % rowWidths.length])} />
          <Skeleton className="h-4 w-9 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function OverviewBusy({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true" className="min-w-0 space-y-6 min-[821px]:space-y-8">
      <span className="sr-only">Loading overview</span>
      {children}
    </div>
  );
}
