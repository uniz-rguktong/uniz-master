import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
 type CampusUpdate,
 useCampusUpdates,
} from "@/hooks/useCampusUpdates";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/Skeleton";

const COLLAPSED_COUNT = 4;
const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

const sectionTitleClass =
 "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-h2 min-[821px]:leading-9";

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

function formatNoticeDate(iso?: string) {
 if (!iso) return "—";
 const date = new Date(iso);
 if (Number.isNaN(date.getTime())) return "—";
 return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function NoticeRow({ update }: { update: CampusUpdate }) {
 const body = updateBody(update);
 const fresh = isNew(update);
 const title = update.title || body || "Campus update";

 const row = (
 <div className="flex gap-4 border-b border-border py-3">
 <time className="w-16 shrink-0 pt-1 font-sans text-small tabular-nums text-text-3">
 {formatNoticeDate(update.createdAt)}
 </time>
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-body font-medium text-head [overflow-wrap:anywhere]">
 {title}
 </h3>
 {fresh ? <Badge tone="neutral">New</Badge> : null}
 {update.link ? (
 <ExternalLink size={16} strokeWidth={1.75} className="text-text-2" aria-hidden />
 ) : null}
 </div>
 {update.title && body ? (
 <p className="mt-1 line-clamp-3 text-dense text-text-2 [overflow-wrap:anywhere]">
 {body}
 </p>
 ) : null}
 </div>
 </div>
 );

 if (update.link) {
 return (
 <a
 href={update.link}
 target="_blank"
 rel="noopener noreferrer"
 className="block no-underline"
 >
 {row}
 </a>
 );
 }

 return row;
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
 <section className={cn("space-y-3", className)} aria-hidden>
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-12 w-full" />
 <Skeleton className="h-12 w-full" />
 <Skeleton className="h-12 w-full" />
 </section>
 );
 }

 if (items.length === 0) {
 return (
 <section className={cn("space-y-3", className)} aria-label="Notice board">
 <h2 className={sectionTitleClass}>Campus updates</h2>
 <p className="text-body text-text-2">No campus notices right now.</p>
 </section>
 );
 }

 const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
 const hiddenCount = items.length - COLLAPSED_COUNT;

 return (
 <section className={cn("space-y-3", className)} aria-label="Notice board">
 <div className="flex items-end justify-between gap-3">
 <h2 className={sectionTitleClass}>Campus updates</h2>
 <span className="font-sans text-small tabular-nums text-text-3">
 {items.length} {items.length === 1 ? "notice" : "notices"}
 </span>
 </div>

 <div>
 {visible.map((update, idx) => (
 <NoticeRow key={update._id || update.id || idx} update={update} />
 ))}
 </div>

 {hiddenCount > 0 && (
 <Button
 type="button"
 variant="ghost"
 size="compact"
 onClick={() => setExpanded((v) => !v)}
 >
 {expanded ? "Show less" : `Show ${hiddenCount} more`}
 </Button>
 )}
 </section>
 );
}
