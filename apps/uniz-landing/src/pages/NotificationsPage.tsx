import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getNotifications } from "../types/api";
import type { Notification } from "../types/api";
import {
  Newspaper,
  FileText,
  Briefcase,
  ArrowRightCircle,
  ChevronRight
} from "lucide-react";
import { PageHero } from "../components/layout/PageHero";

export function NotificationsPage() {
  const { type } = useParams<{ type: string }>();
  const currentTab = (type === "tenders" || type === "careers") ? type : "news";

  const [itemsData, setItemsData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(10);

  // Reset limit when changing pages
  useEffect(() => {
    setVisibleLimit(10);
  }, [currentTab]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const apiType = currentTab === "news" ? "news_updates" : currentTab;
      const data = await getNotifications(apiType as any);
      setItemsData(data);
      setLoading(false);
    }
    fetchData();
  }, [currentTab]);

  if (loading) {
    return (
      <div className="min-h-[60vh] w-full bg-surface cursor-wait" aria-busy="true">
        <div className="bg-navy-950 h-56 sm:h-64" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-line bg-white p-5 shadow-xs">
              <div className="h-3 w-3/4 rounded bg-surface-2 animate-pulse motion-reduce:animate-none" />
              <div className="mt-3 h-3 w-1/4 rounded bg-surface-2 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const parseSafeDate = (dateStr?: string) => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    const cleaned = dateStr.replace(/[\(\)]/g, '').trim();
    const parts = cleaned.match(/(\d{1,2})[\.\-\/]([a-zA-Z]+|\d{1,2})[\.\-\/](\d{4})/);

    if (parts) {
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[3], 10);
      let month = 0;

      if (isNaN(parseInt(parts[2], 10))) {
        const mStr = parts[2].toLowerCase();
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        month = months.findIndex(m => mStr.startsWith(m));
        if (month === -1) month = 0;
      } else {
        month = parseInt(parts[2], 10) - 1; // 0-indexed month
      }

      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const renderList = (allItems: Notification[], emptyMsg: string, listType: string) => {
    if (allItems.length === 0) {
      return (
        <div className="py-20 text-center bg-white border border-line rounded-lg shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-200/50 ring-8 ring-surface-2 flex items-center justify-center">
            {listType === 'news' && <Newspaper className="w-8 h-8 text-navy-400" />}
            {listType === 'tenders' && <FileText className="w-8 h-8 text-navy-400" />}
            {listType === 'careers' && <Briefcase className="w-8 h-8 text-navy-400" />}
          </div>
          <p className="text-slate-500 font-medium">{emptyMsg}</p>
        </div>
      );
    }

    const items = allItems.slice(0, visibleLimit);
    const hasMore = visibleLimit < allItems.length;

    let descLabel = "Description";
    if (listType === "tenders") descLabel = "Tender/NIQ Description";
    if (listType === "careers") descLabel = "Career Opportunity";
    if (listType === "news") descLabel = "News & Updates Description";

    return (
      <div className="bg-white border border-line rounded-lg shadow-xs overflow-hidden">
        <ul className="sm:hidden divide-y divide-line">
          {items.map((item, idx) => {
            const parsedDate = parseSafeDate(item.date);
            const formattedDate = parsedDate
              ? `${parsedDate.getDate().toString().padStart(2, '0')}/${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear()}`
              : item.date || "-";
            return (
              <li key={idx} className="relative p-4 pl-5 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-0.5 before:rounded-full before:bg-brand-red/80">
                <span className="inline-flex items-center rounded-full bg-[#189B4B]/10 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-[#137A3C]">{formattedDate}</span>
                <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink">{item.title}</p>
                {item.links && item.links.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.links.map((link, lidx) => (
                      <a key={lidx} href={link.url || "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-line bg-surface-2 px-3 text-[13px] font-semibold text-navy hover:border-navy-200 hover:bg-white">
                        {link.label || "Detailed Notification"}
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="mt-2 block text-ink-subtle italic text-[13px]">No notification available</span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-navy text-white">
                <th className="py-3.5 px-5 font-semibold text-[12px] uppercase tracking-[0.12em] text-white/85 border-b border-navy-700 w-[60%]">
                  {descLabel}
                </th>
                <th className="py-3.5 px-5 font-semibold text-[12px] uppercase tracking-[0.12em] text-white/85 border-b border-navy-700 border-l border-navy-700 w-[20%] whitespace-nowrap">
                  Posted date
                </th>
                <th className="py-3.5 px-5 font-semibold text-[12px] uppercase tracking-[0.12em] text-white/85 border-b border-navy-700 border-l border-navy-700 w-[20%] whitespace-nowrap">
                  Detailed Notification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item, idx) => {
                const parsedDate = parseSafeDate(item.date);
                const formattedDate = parsedDate
                  ? `${parsedDate.getDate().toString().padStart(2, '0')}/${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear()}`
                  : item.date || "-";

                return (
                  <tr key={idx} className="hover:bg-surface-2 transition-colors duration-150 group shadow-[inset_0_0_0_0_#EA2027] hover:shadow-[inset_3px_0_0_0_#EA2027]">
                    <td className="py-5 px-5 text-[15px] text-ink align-top">
                      <div className="flex items-start gap-3">
                        <ArrowRightCircle className="w-[18px] h-[18px] text-navy-400 mt-0.5 flex-shrink-0 group-hover:text-brand-red transition-colors" />
                        <span className="leading-relaxed font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-[15px] align-top border-l border-line">
                      <span className="inline-flex items-center rounded-full bg-[#189B4B]/10 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#137A3C] whitespace-nowrap">{formattedDate}</span>
                    </td>
                    <td className="py-5 px-5 text-[15px] align-top border-l border-line">
                      {item.links && item.links.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {item.links.map((link, lidx) => (
                            <a
                              key={lidx}
                              href={link.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-navy hover:text-brand-red font-semibold text-[14px] transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                              <span className="underline decoration-navy-200 underline-offset-4">{link.label || "Detailed Notification"}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink-subtle italic text-[14px]">No notification available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-5 border-t border-line flex justify-center bg-surface-2">
            <button
              onClick={() => setVisibleLimit(prev => prev + 10)}
              className="min-h-[44px] px-6 rounded-md bg-navy text-white text-[14px] font-semibold shadow-[0_8px_20px_-10px_rgba(10,37,64,0.6)] hover:bg-navy-950 transition-colors duration-150"
            >
              View Next {Math.min(10, allItems.length - visibleLimit)} Updates
            </button>
          </div>
        )}
      </div>
    );
  };

  const headingText = currentTab === "news" ? "News and updates" : currentTab === "tenders" ? "Tenders" : "Careers";
  const heroDescription =
    currentTab === "news"
      ? "Official news and notices published by RGUKT Ongole."
      : currentTab === "tenders"
        ? "Active tender notices from RGUKT Ongole."
        : "Career openings and recruitment notices.";

  return (
    <div className="min-h-screen bg-surface font-sans">
      <PageHero
        eyebrow="RGUKT Ongole · Notifications"
        title={headingText}
        description={heroDescription}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8 relative z-20">
        <div>
          {renderList(itemsData, `No active ${headingText.toLowerCase()} available at this time.`, currentTab)}
        </div>
      </div>
    </div>
  );
}

