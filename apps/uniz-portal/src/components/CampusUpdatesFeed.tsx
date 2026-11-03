import { ArrowUpRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  type CampusUpdate,
  getTimeAgo,
  useCampusUpdates,
} from "@/hooks/useCampusUpdates";
import { CAMPUS_UPDATES_FALLBACK } from "@/constants/campusUpdates";

type CampusUpdatesFeedProps = {
  items?: CampusUpdate[];
  fallback?: CampusUpdate[];
  className?: string;
  variant?: "portal" | "landing";
};

export default function CampusUpdatesFeed({
  items: controlledItems,
  fallback = CAMPUS_UPDATES_FALLBACK,
  className,
}: CampusUpdatesFeedProps) {
  const { updates } = useCampusUpdates(fallback);
  const list =
    controlledItems && controlledItems.length > 0
      ? controlledItems
      : updates && updates.length > 0
        ? updates
        : fallback;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-line bg-white",
        className,
      )}
    >
 <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
 <FileText className="h-4 w-4 text-navy" />
 <span className="text-sm font-medium text-navy-900">
            Official circulars and examination bulletins
          </span>
        </div>
 <span className="hidden text-sm text-ink-muted sm:inline">
          Office of the Controller of Examinations
        </span>
      </div>

      <div className="divide-y divide-line">
        {list.slice(0, 6).map((item, index) => {
          const body = item.content || item.description || "";
          const href = item.link || "/student/signin";
          const isInternal = href.startsWith("/");
          const dateLabel =
            item.createdAt && !Number.isNaN(Date.parse(item.createdAt))
              ? getTimeAgo(item.createdAt)
              : item.createdAt || "Official Notice";

          return (
            <div
              key={item.id || item._id || index}
 className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-2 sm:flex-row sm:items-start"
            >
              <div className="max-w-3xl space-y-1">
                <div className="flex flex-wrap items-center gap-2">
 <span className="inline-block rounded-sm bg-navy-900 px-2 py-0.5 text-xs font-medium text-white">
                    Circular
                  </span>
 <span className="text-sm text-ink-muted">{dateLabel}</span>
                </div>
 <h3 className="pt-0.5 font-serif text-lg font-medium leading-snug text-navy-900">
                  {item.title}
                </h3>
                {body && body !== item.title && (
 <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
                )}
              </div>

              <div className="shrink-0 sm:pt-1">
                {isInternal ? (
                  <Link
                    to={href}
 className="editorial-link inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <span>Access Service</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
 className="editorial-link inline-flex items-center gap-1 text-sm font-medium"
                  >
                    <span>View Notice</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
