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
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-slate-50 cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
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
        <div className="py-20 text-center bg-white border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
            {listType === 'news' && <Newspaper className="w-8 h-8 text-slate-300" />}
            {listType === 'tenders' && <FileText className="w-8 h-8 text-slate-300" />}
            {listType === 'careers' && <Briefcase className="w-8 h-8 text-slate-300" />}
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
      <div className="bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#1c2434] text-white">
                <th className="py-4 px-5 font-semibold text-[15px] border-b border-[#2a3447] w-[60%]">
                  {descLabel}
                </th>
                <th className="py-4 px-5 font-semibold text-[15px] border-b border-[#2a3447] border-l border-[#2a3447] w-[20%] whitespace-nowrap">
                  Posted date
                </th>
                <th className="py-4 px-5 font-semibold text-[15px] border-b border-[#2a3447] border-l border-[#2a3447] w-[20%] whitespace-nowrap">
                  Detailed Notification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const parsedDate = parseSafeDate(item.date);
                const formattedDate = parsedDate
                  ? `${parsedDate.getDate().toString().padStart(2, '0')}/${(parsedDate.getMonth() + 1).toString().padStart(2, '0')}/${parsedDate.getFullYear()}`
                  : item.date || "-";

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-5 px-5 text-[15px] text-slate-700 align-top">
                      <div className="flex items-start gap-3">
                        <ArrowRightCircle className="w-[18px] h-[18px] text-slate-400 mt-0.5 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
                        <span className="leading-relaxed font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-[15px] align-top border-l border-slate-200">
                      <span className="font-semibold text-[#189b4b]">{formattedDate}</span>
                    </td>
                    <td className="py-5 px-5 text-[15px] align-top border-l border-slate-200">
                      {item.links && item.links.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {item.links.map((link, lidx) => (
                            <a
                              key={lidx}
                              href={link.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-black hover:underline font-semibold text-[14px] transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                              <span className="underline decoration-slate-300 underline-offset-4">{link.label || "Detailed Notification"}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[14px]">No notification available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-5 border-t border-slate-200 flex justify-center bg-slate-50/50">
            <button
              onClick={() => setVisibleLimit(prev => prev + 10)}
              className="px-6 py-2.5 rounded-md bg-[#000035] text-white text-[14px] font-semibold shadow-sm hover:bg-[#800000] focus:outline-none transition-all duration-300"
            >
              View Next {Math.min(10, allItems.length - visibleLimit)} Updates
            </button>
          </div>
        )}
      </div>
    );
  };

  const headingText = currentTab === "news" ? "News & Updates" : currentTab === "tenders" ? "Tenders" : "Career Opportunities";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Hero Banner ── */}
      <div className="relative bg-[#000035] overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, #800000 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, #1d4ed8 0%, transparent 50%)" }}
        />
        {/* Faint grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="inline-block px-5 py-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full">
            Rajiv Gandhi University of Knowledge Technologies
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            {headingText}
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
            Stay informed with the latest {headingText}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-20">
        {/* ── Content ── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderList(itemsData, `No active ${headingText.toLowerCase()} available at this time.`, currentTab)}
        </div>
      </div>
    </div>
  );
}

