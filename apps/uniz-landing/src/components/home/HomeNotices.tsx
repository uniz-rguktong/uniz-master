import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getNotifications } from "@/types/api";
import type { Notification } from "@/types/api";
import { formatNoticeDay, parseSafeDate } from "@/lib/notice-date";
import { buttonVariants } from "../ui/button-variants";
import { Wrap } from "../layout/Wrap";

function noticeHref(item: Notification) {
  const link = item.links?.find((entry) => entry.url);
  if (link?.url) return { href: link.url, external: true };
  return { href: "/notifications/news", external: false };
}

function dateLabel(date?: string) {
  const parsed = parseSafeDate(date);
  if (parsed) return formatNoticeDay(parsed);
  return date?.trim() ?? "";
}

function Row({ item }: { item: Notification }) {
  const target = noticeHref(item);
  const className =
    "grid grid-cols-[1fr_20px] gap-x-5 border-t border-border py-[18px] no-underline last:border-b min-[821px]:grid-cols-[96px_minmax(0,1fr)_24px] min-[821px]:items-baseline min-[821px]:py-[22px]";
  const body = (
    <>
      <span className="col-span-2 text-[14px] leading-5 text-text-3 tabular-nums min-[821px]:col-span-1 min-[821px]:col-start-1">
        {dateLabel(item.date)}
      </span>
      <span className="mt-1 line-clamp-2 text-[17px] font-semibold leading-[26px] text-head min-[821px]:col-start-2 min-[821px]:mt-0">
        {item.title}
      </span>
      <ArrowUpRight className="mt-1 text-accent min-[821px]:col-start-3 min-[821px]:mt-1" size={18} strokeWidth={1.75} aria-hidden="true" />
    </>
  );
  if (target.external) {
    return (
      <a href={target.href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    );
  }
  return (
    <Link to={target.href} className={className}>
      {body}
    </Link>
  );
}

export function HomeNotices() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getNotifications("news_updates")
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const left = parseSafeDate(a.date);
          const right = parseSafeDate(b.date);
          if (left && right) return right.getTime() - left.getTime();
          if (left) return -1;
          if (right) return 1;
          return 0;
        });
        setItems(sorted.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = items !== null || failed;
  const rows = items ?? [];

  return (
    <Wrap>
      <section className="mt-[72px] min-[821px]:mt-[112px]" aria-labelledby="notices-heading">
        <div className="grid grid-cols-1 gap-7 min-[821px]:grid-cols-[4fr_7fr] min-[821px]:gap-20">
          <div>
            <h2 id="notices-heading" className="u-section text-head">
              Notices
            </h2>
            <p className="mt-2.5 mb-7 max-w-[320px] text-[17px] leading-[26px] text-text-2">
              The latest from campus offices.
            </p>
            <Link to="/notifications/news" className={buttonVariants({ variant: "outline", size: "default" })}>
              All notices
            </Link>
          </div>
          <div className="min-w-0">
            {!ready &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border-t border-border py-[18px] last:border-b min-[821px]:py-[22px]" aria-hidden="true">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton mt-3 h-5 w-4/5" />
                </div>
              ))}
            {ready && rows.length === 0 && (
              <p className="border-t border-b border-border py-[22px] text-[15px] leading-6 text-text-2">
                No notices right now.
              </p>
            )}
            {ready && rows.map((item, index) => <Row key={`${item.date}-${index}`} item={item} />)}
            {!ready && <span className="sr-only">Loading notices</span>}
          </div>
        </div>
      </section>
    </Wrap>
  );
}
