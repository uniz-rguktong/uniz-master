import { Link } from "react-router-dom";
import type { Notification } from "../../types/api";

export function Media({ news }: { news: readonly Notification[] }) {
  const items = news.slice(0, 6);

  return (
    <section id="media" className="section-editorial bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="text-[13px] font-semibold text-crimson">Notices</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            News &amp; notifications
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Official announcements, tenders, and campus notices from RGUKT Ongole.
          </p>
          <Link to="/notifications/news" className="editorial-link mt-6 inline-block text-[15px]">
            All announcements
          </Link>
        </div>

        <ul className="divide-y divide-line border-y border-line lg:col-span-8">
          {items.length === 0 ? (
            <li className="py-8 text-ink-muted">No announcements are posted right now.</li>
          ) : (
            items.map((item, idx) => (
              <li key={`${item.title}-${idx}`}>
                <a
                  href={item.links?.[0]?.url || "/notifications/news"}
                  target={item.links?.[0]?.url ? "_blank" : undefined}
                  rel={item.links?.[0]?.url ? "noopener noreferrer" : undefined}
                  className="group grid gap-1 py-5 sm:grid-cols-[8.5rem_1fr] sm:gap-6"
                >
                  <span className="text-sm tabular-nums text-ink-subtle">{item.date || "Recent"}</span>
                  <span className="font-serif text-lg leading-snug text-ink group-hover:text-crimson">
                    {item.title}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
