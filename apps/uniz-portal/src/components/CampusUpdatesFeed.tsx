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
        "w-full border border-[#D8E0EA] bg-white rounded-[2px]",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#F8FAFC] border-b border-[#D8E0EA]">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#0A2540]" />
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0A2540]">
            Official Circulars, Notices &amp; Examination Bulletins
          </span>
        </div>
        <span className="hidden sm:inline text-[11.5px] font-medium text-[#475569]">
          Office of the Controller of Examinations
        </span>
      </div>

      <div className="divide-y divide-[#E2E8F0]">
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
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] bg-[#0A2540] text-white rounded-[1px]">
                    Circular
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#475569]">
                    {dateLabel}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-[#0A2540] leading-snug pt-0.5">
                  {item.title}
                </h3>
                {body && body !== item.title && (
                  <p className="text-[13.5px] text-[#334155] leading-relaxed">
                    {body}
                  </p>
                )}
              </div>

              <div className="shrink-0 sm:pt-1">
                {isInternal ? (
                  <Link
                    to={href}
                    className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0A2540] hover:underline underline-offset-4"
                  >
                    <span>Access Service</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0A2540] hover:underline underline-offset-4"
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
