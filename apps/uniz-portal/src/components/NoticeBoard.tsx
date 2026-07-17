import { useMemo, useState } from "react";
import {
  Pin,
  ExternalLink,
  ChevronDown,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CampusUpdate,
  getTimeAgo,
  useCampusUpdates,
} from "@/hooks/useCampusUpdates";

const COLLAPSED_COUNT = 4;
const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

function updateBody(update: CampusUpdate) {
  return update.content || update.description || "";
}

function isNew(update: CampusUpdate) {
  if (!update.createdAt) return false;
  const age = Date.now() - new Date(update.createdAt).getTime();
  return age >= 0 && age < NEW_WINDOW_MS;
}

function sortByNewest(items: CampusUpdate[]) {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function NoticeCard({ update }: { update: CampusUpdate }) {
  const body = updateBody(update);
  const fresh = isNew(update);

  const card = (
    <article
      className={cn(
        "group relative flex h-full flex-col gap-1.5 rounded-portal-xl border bg-white p-3.5 md:p-4 transition-all",
        fresh
          ? "border-navy-300 shadow-[0_1px_10px_rgba(15,35,66,0.08)]"
          : "border-navy-200",
        update.link &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-[0_4px_16px_rgba(15,35,66,0.10)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-[13px] md:text-sm font-semibold leading-snug text-navy-900 [overflow-wrap:anywhere]">
          {update.title || body || "Campus update"}
        </h3>
        {update.link && (
          <ExternalLink
            size={13}
            className="mt-0.5 shrink-0 text-navy-300 transition-colors group-hover:text-navy-600"
          />
        )}
      </div>

      {update.title && body && (
        <p className="line-clamp-2 text-[12px] leading-relaxed text-navy-600 [overflow-wrap:anywhere]">
          {body}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        {fresh && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            New
          </span>
        )}
        <span className="text-[10px] font-semibold tabular-nums text-navy-400">
          {getTimeAgo(update.createdAt)}
        </span>
      </div>
    </article>
  );

  if (update.link) {
    return (
      <a
        href={update.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full no-underline"
      >
        {card}
      </a>
    );
  }

  return card;
}

type NoticeBoardProps = {
  className?: string;
  maxItems?: number;
};

export default function NoticeBoard({
  className,
  maxItems = 12,
}: NoticeBoardProps) {
  const { updates, loading } = useCampusUpdates();
  const [expanded, setExpanded] = useState(false);

  const items = useMemo(
    () => sortByNewest(updates).slice(0, maxItems),
    [updates, maxItems],
  );

  if (loading) {
    return (
      <section className={cn("space-y-3", className)}>
        <div className="h-5 w-36 animate-pulse rounded bg-navy-100" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="h-24 animate-pulse rounded-portal-xl border border-navy-200 bg-navy-50/60" />
          <div className="hidden h-24 animate-pulse rounded-portal-xl border border-navy-200 bg-navy-50/60 md:block" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={cn("space-y-2", className)} aria-label="Notice board">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700">
            <Pin size={13} strokeWidth={2.5} />
          </span>
          <h2 className="text-[13px] md:text-sm font-bold uppercase tracking-[0.12em] text-navy-900">
            Notice board
          </h2>
        </div>
        <p className="rounded-portal-xl border border-dashed border-navy-200 bg-navy-50/40 px-4 py-3 text-[12px] text-navy-500">
          No campus notices right now.
        </p>
      </section>
    );
  }

  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hiddenCount = items.length - COLLAPSED_COUNT;
  const newCount = items.filter(isNew).length;

  return (
    <section className={cn("space-y-3", className)} aria-label="Notice board">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700">
            <Pin size={13} strokeWidth={2.5} />
          </span>
          <h2 className="truncate text-[13px] md:text-sm font-bold uppercase tracking-[0.12em] text-navy-900">
            Notice board
          </h2>
          {newCount > 0 && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700">
              {newCount} new
            </span>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
          <Megaphone size={11} strokeWidth={2.5} />
          {items.length} {items.length === 1 ? "notice" : "notices"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((update, idx) => (
          <NoticeCard key={update._id || update.id || idx} update={update} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-portal-xl border border-dashed border-navy-200 bg-navy-50/40 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-navy-600 transition-colors hover:border-navy-300 hover:bg-navy-50 hover:text-navy-900"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </section>
  );
}
