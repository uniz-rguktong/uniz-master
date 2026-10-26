import { Link } from "react-router-dom";
import { FileText, Megaphone, Bell, GraduationCap, BookOpen } from "lucide-react";

const iconStyles = [
  { bg: "#113255", Icon: FileText },
  { bg: "#0A2540", Icon: Megaphone },
  { bg: "#061B33", Icon: Bell },
  { bg: "#113255", Icon: GraduationCap },
  { bg: "#0A2540", Icon: BookOpen },
];

export function Media({ news }: { news: readonly any[] }) {
  const base = news.slice(0, 5);
  const scrollItems = [...base, ...base, ...base];

  return (
    <section id="media" className="relative section-editorial bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-stretch">

          <div className="lg:w-2/5 flex flex-col justify-center">
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#0A2540] mb-4">
              Notifications
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#061B33] leading-tight">
              News &amp; notifications
            </h2>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-md">
              Stay informed with the latest announcements, campus insights, and official updates from RGUKT Ongole.
            </p>
            <div className="mt-8">
              <Link to="/notifications/news" className="editorial-link text-[15px] font-medium">
                View announcements directory
              </Link>
            </div>
          </div>

          <div className="lg:w-3/5 w-full">
            <div className="relative overflow-hidden h-[460px] sm:h-[500px] border-y border-slate-200">
              <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

              <div className="h-full w-full overflow-hidden">
                <div className="youtube-track space-y-0 px-1 py-4">
                  {scrollItems.map((item, idx) => {
                    const { bg, Icon } = iconStyles[idx % iconStyles.length];

                    return (
                      <a
                        key={idx}
                        href={item.links?.[0]?.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full cursor-pointer items-center gap-4 py-4 px-2 border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                      >
                        <div
                          className="flex w-10 h-10 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: bg }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-medium text-slate-900 text-sm sm:text-base truncate flex-1 min-w-0">
                              {item.title}
                            </span>
                            <span className="text-slate-300 flex-shrink-0">·</span>
                            <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                              {item.date || "Recent"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-0.5">
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
