import { useEffect, useState } from "react";
import { getNotifications } from "../types/api";
import type { Notification } from "../types/api";
import { Newspaper, FileText, Briefcase } from "lucide-react";

export function NotificationsPage() {
  const [news, setNews] = useState<Notification[]>([]);
  const [tenders, setTenders] = useState<Notification[]>([]);
  const [careers, setCareers] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"news" | "tenders" | "careers">(
    "news",
  );
  const [visibleLimit, setVisibleLimit] = useState(10);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [n, t, c] = await Promise.all([
        getNotifications("news_updates"),
        getNotifications("tenders"),
        getNotifications("careers"),
      ]);
      setNews(n);
      setTenders(t);
      setCareers(c);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent"></div>
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">
            Loading Notifications...
          </p>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: "news" | "tenders" | "careers") => {
    setActiveTab(tab);
    setVisibleLimit(10);
  };

  const parseSafeDate = (dateStr?: string) => {
    if (!dateStr) return null;

    // 1. Try native parsing
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // 2. Try parsing specific formatting like DD-MM-YYYY, DD/MM/YYYY, or DD.MM.YYYY
    // Also handles string months like "08-july-2021"
    const cleaned = dateStr.replace(/[\(\)]/g, "").trim();
    const parts = cleaned.match(
      /(\d{1,2})[\.\-\/]([a-zA-Z]+|\d{1,2})[\.\-\/](\d{4})/,
    );

    if (parts) {
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[3], 10);
      let month = 0;

      if (isNaN(parseInt(parts[2], 10))) {
        const mStr = parts[2].toLowerCase();
        const months = [
          "jan",
          "feb",
          "mar",
          "apr",
          "may",
          "jun",
          "jul",
          "aug",
          "sep",
          "oct",
          "nov",
          "dec",
        ];
        month = months.findIndex((m) => mStr.startsWith(m));
        if (month === -1) month = 0;
      } else {
        month = parseInt(parts[2], 10) - 1; // 0-indexed month
      }

      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  };

  const renderList = (allItems: Notification[], emptyMsg: string) => {
    if (allItems.length === 0) {
      return (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-lg">{emptyMsg}</p>
        </div>
      );
    }

    const items = allItems.slice(0, visibleLimit);
    const hasMore = visibleLimit < allItems.length;

    return (
      <div className="space-y-4">
        {items.map((item, idx) => {
          const parsedDate = parseSafeDate(item.date);

          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 md:items-start group"
            >
              <div className="flex-shrink-0 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-center min-w-[100px] flex flex-col items-center justify-center transition-colors duration-300">
                {parsedDate ? (
                  <>
                    <div className="text-sm font-semibold text-[#000035] uppercase leading-tight">
                      {parsedDate.toLocaleString("default", { month: "short" })}
                    </div>
                    <div className="text-2xl font-bold text-[#000035] leading-none my-1">
                      {parsedDate.getDate()}
                    </div>
                    <div className="text-xs text-[#000035] font-medium">
                      {parsedDate.getFullYear()}
                    </div>
                  </>
                ) : (
                  <div className="text-[#000035] h-full flex flex-col items-center justify-center opacity-80 py-2">
                    {activeTab === "news" && (
                      <Newspaper strokeWidth={1.5} className="w-10 h-10" />
                    )}
                    {activeTab === "tenders" && (
                      <FileText strokeWidth={1.5} className="w-10 h-10" />
                    )}
                    {activeTab === "careers" && (
                      <Briefcase strokeWidth={1.5} className="w-10 h-10" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-[#000035] transition-colors">
                  {item.title}
                </h3>
                {item.links && item.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.links.map((link, lidx) => (
                      <a
                        key={lidx}
                        href={link.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-100 hover:text-[#000035] px-3 py-1.5 rounded-full transition-colors break-all"
                      >
                        {link.label}
                        <svg
                          className="w-4 h-4 ml-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          ></path>
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="pt-8 pb-4 flex justify-center">
            <button
              onClick={() => setVisibleLimit((prev) => prev + 10)}
              className="px-8 py-3 rounded-full bg-[#000035] border-2 border-[#000035] text-white font-semibold shadow-sm hover:opacity-90 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-[#000035]/30"
            >
              View Next {Math.min(10, allItems.length - visibleLimit)} Updates
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 capitalize border-b pb-4">
          Notifications Center
        </h1>

        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-fit">
          <button
            onClick={() => handleTabChange("news")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === "news" ? "bg-[#000035] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            News & Updates{" "}
            <span className="text-xs align-top ml-1 opacity-80">
              {news.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("tenders")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === "tenders" ? "bg-[#000035] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Tenders{" "}
            <span className="text-xs align-top ml-1 opacity-80">
              {tenders.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("careers")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === "careers" ? "bg-[#000035] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Careers{" "}
            <span className="text-xs align-top ml-1 opacity-80">
              {careers.length}
            </span>
          </button>
        </div>

        <div>
          {activeTab === "news" &&
            renderList(news, "No news or updates available at this time.")}
          {activeTab === "tenders" &&
            renderList(tenders, "No active tenders available at this time.")}
          {activeTab === "careers" &&
            renderList(
              careers,
              "No career opportunities available at this time.",
            )}
        </div>
      </div>
    </div>
  );
}
