import { Link } from "react-router-dom";
import { Newspaper, Megaphone, FileText, GraduationCap, Bell, BookOpen, ArrowRight } from "lucide-react";

const iconStyles = [
  { bg: "#1E86FF", Icon: FileText },
  { bg: "#FF3D71", Icon: Megaphone },
  { bg: "#FFB800", Icon: Bell },
  { bg: "#00C9A7", Icon: GraduationCap },
  { bg: "#8B5CF6", Icon: BookOpen },
];

export function Media({ news }: { news: readonly any[] }) {
  const base = news.slice(0, 5);
  // Duplicate 3 times for seamless scrolling with 33.33% transform
  const scrollItems = [...base, ...base, ...base];

  return (
    <section id="media" className="relative py-24 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-stretch">

          {/* ── Left Column ── */}
          <div className="lg:w-1/3 flex flex-col justify-center h-auto lg:h-[500px] text-center lg:text-left">
            <div>
              <span className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-bold tracking-widest text-[#000035] bg-[#000035]/5 rounded-full border border-[#000035]/10">
                <Newspaper className="w-4 h-4" />
                NOTIFICATIONS
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                News &<br className="hidden lg:block" /> Notifications
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Stay informed with the latest announcements, campus insights, and official news updates directly from RGUKT Ongole.
              </p>
              <div className="mt-10">
                <Link
                  to="/notifications/news"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#000035] text-white font-bold rounded-full shadow-sm hover:bg-slate-800 transition-colors"
                >
                  View Announcements Directory
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Right Column: Scrolling Cards ── */}
          <div className="lg:w-2/3 w-full">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 h-[500px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]">

              {/* Top/Bottom fade */}
              <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

              <div className="h-full w-full overflow-hidden">
                <div className="youtube-track space-y-3 px-5 py-4">
                  {scrollItems.map((item, idx) => {
                    const { bg, Icon } = iconStyles[idx % iconStyles.length];

                    return (
                      <a
                        key={idx}
                        href={item.links?.[0]?.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 hover:scale-[1.02] transition-all duration-200 ease-in-out"
                        style={{
                          boxShadow:
                            "0 0 0 1px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.05), 0 12px 24px rgba(0,0,0,.05)",
                        }}
                      >
                        {/* Circular Lucide icon */}
                        <div
                          className="flex w-11 h-11 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: bg }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        {/* Text */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-semibold text-slate-900 text-sm sm:text-base truncate flex-1 min-w-0">
                              {item.title}
                            </span>
                            <span className="text-slate-300 flex-shrink-0">·</span>
                            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                              {item.date || "Recent"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 font-normal mt-0.5">
                            Official Notice · RGUKT Ongole
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
