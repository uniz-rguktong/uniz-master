import { useEffect, useState } from "react";
import { getHomeData } from "@/types/api";
import type { Announcement } from "@/types/api";
import { Wrap } from "../layout/Wrap";

export function HomeAnnouncements() {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHomeData().then((data) => {
      if (cancelled) return;
      setItems(data.announcements.filter((item) => item.text.trim()));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = items !== null;
  const rows = (items ?? []).slice(0, 4);

  return (
    <Wrap>
      <section className="mt-4 border-t border-border pt-8" aria-labelledby="announcements-heading">
        <h2 id="announcements-heading" className="text-[15px] font-semibold leading-6 text-head">
          Announcements
        </h2>
        {!ready && (
          <div className="mt-4 space-y-3" aria-busy="true">
            <span className="sr-only">Loading announcements</span>
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-5 w-3/5" />
          </div>
        )}
        {ready && rows.length === 0 && (
          <p className="mt-3 text-[15px] leading-6 text-text-2">No announcements right now.</p>
        )}
        {ready && rows.length > 0 && (
          <ul className="mt-3 divide-y divide-border">
            {rows.map((item) => (
              <li key={item.text} className="py-3 text-[15px] leading-6 text-text">
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                    {item.text}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Wrap>
  );
}
