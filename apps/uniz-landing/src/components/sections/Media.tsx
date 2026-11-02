import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import type { Notification } from "../../types/api";

export function Media({ news }: { news: readonly Notification[] }) {
  const base = news.slice(0, 5);
  const scrollItems = [...base, ...base, ...base];

  return (
    <section id="media" className="relative section-editorial bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 items-stretch">

          <div className="lg:w-2/5 flex flex-col justify-center">
            <p className="text-sm text-ink-muted mb-3">Notifications</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-navy-900 leading-tight">
              News and notifications
            </h2>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-md">
              Official notices, tenders, and careers published by RGUKT Ongole.
            </p>
            <div className="mt-8">
              <Link to="/notifications/news" className="editorial-link text-[15px] font-medium">
                View all notifications
              </Link>
            </div>
          </div>

          <div className="lg:w-3/5 w-full">
            <div className="relative overflow-hidden h-[460px] sm:h-[500px] border-y border-line">
              <div
                className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"
                aria-hidden="true"
              />

              <div className="h-full w-full overflow-hidden">
                <div className="youtube-track space-y-0 px-1 py-4">
                  {scrollItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.links?.[0]?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full cursor-pointer items-center gap-4 py-4 px-2 border-b border-line hover:bg-surface transition-colors duration-150"
                    >
                      <div className="flex w-9 h-9 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted">
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="font-medium text-slate-900 text-sm sm:text-base truncate flex-1 min-w-0">
                            {item.title}
                          </span>
                          <span className="text-slate-300 flex-shrink-0" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-xs text-ink-subtle flex-shrink-0 whitespace-nowrap tabular-nums">
                            {item.date || "Recent"}
                          </span>
                        </div>
                        <p className="text-sm text-ink-subtle mt-0.5">RGUKT Ongole</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
