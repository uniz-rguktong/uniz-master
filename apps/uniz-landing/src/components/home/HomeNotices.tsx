import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { NoticeCopy } from "@/lib/preview-protocol";
import { formatNoticeDay, parseSafeDate } from "@/lib/notice-date";
import { useSiteContent } from "@/components/site-context";
import { EditRegion } from "../preview/EditRegion";
import { buttonVariants } from "../ui/button-variants";
import { Wrap } from "../layout/Wrap";

function noticeHref(item: NoticeCopy) {
  const link = item.links?.find((entry) => entry.url);
  if (link?.url) return { href: link.url, external: true };
  return { href: "/notifications/news", external: false };
}

function dateLabel(date?: string) {
  const parsed = parseSafeDate(date);
  if (parsed) return formatNoticeDay(parsed);
  return date?.trim() ?? "";
}

function Row({ item }: { item: NoticeCopy }) {
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

export function HomeNotices({
  heading = "Notices",
  lede = "The latest from campus offices.",
  href = "/notifications/news",
  action = "All notices",
  stacked = false,
}: {
  heading?: string;
  lede?: string;
  href?: string;
  action?: string;
  stacked?: boolean;
}) {
  const { notices, ready } = useSiteContent();
  const headingId = heading.toLowerCase().replace(/[^a-z]+/g, "-") || "notices";
  const rows = [...notices]
    .sort((a, b) => {
      const left = parseSafeDate(a.date);
      const right = parseSafeDate(b.date);
      if (left && right) return right.getTime() - left.getTime();
      if (left) return -1;
      if (right) return 1;
      return 0;
    })
    .slice(0, 3);

  const list = (
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
            {!ready && <span className="sr-only">Loading {heading}</span>}
          </div>
  );

  if (stacked) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="u-h2 text-head">{heading}</h2>
        <p className="mt-2 mb-5 max-w-[36ch] text-[15px] leading-6 text-text-2">{lede}</p>
        <Link to={href} className={buttonVariants({ variant: "outline", size: "default" })}>
          {action}
        </Link>
        <div className="mt-6">
          <EditRegion region="notices" blockNavigation>{list}</EditRegion>
        </div>
      </section>
    );
  }

  return (
    <Wrap>
      <section className="mt-[72px] min-[821px]:mt-[112px]" aria-labelledby={headingId}>
        <div className="grid grid-cols-1 gap-7 min-[821px]:grid-cols-[4fr_7fr] min-[821px]:gap-20">
          <div>
            <h2 id={headingId} className="u-section text-head">
              {heading}
            </h2>
            <p className="mt-2.5 mb-7 max-w-[320px] text-[17px] leading-[26px] text-text-2">
              {lede}
            </p>
            <Link to={href} className={buttonVariants({ variant: "outline", size: "default" })}>
              {action}
            </Link>
          </div>
          <EditRegion region="notices" blockNavigation>{list}</EditRegion>
        </div>
      </section>
    </Wrap>
  );
}
