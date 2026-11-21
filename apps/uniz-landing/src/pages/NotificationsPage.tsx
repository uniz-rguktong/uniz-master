import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { getNotifications } from "../types/api";
import type { Notification, NotificationType } from "../types/api";
import { usePageTitle } from "../lib/usePageTitle";
import { FileText } from "lucide-react";
import { PageHero } from "../components/layout/PageHero";
import { Wrap } from "../components/layout/Wrap";
import { formatNoticeDay, parseSafeDate } from "../lib/notice-date";
import { buttonVariants } from "../components/ui/button-variants";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "news", label: "News", to: "/notifications/news" },
  { id: "tenders", label: "Tenders", to: "/notifications/tenders" },
  { id: "careers", label: "Careers", to: "/notifications/careers" },
];

function dateLabel(date?: string) {
  const parsed = parseSafeDate(date);
  if (!parsed) return date?.trim() || "";
  return `${formatNoticeDay(parsed)} ${parsed.getFullYear()}`;
}

export function NotificationsPage() {
  const { type } = useParams<{ type: string }>();
  const currentTab = (type === "tenders" || type === "careers") ? type : "news";

  const [snapshot, setSnapshot] = useState<{ tab: string; items: Notification[] } | null>(null);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const visibleLimit = limits[currentTab] ?? 10;
  const loading = !snapshot || snapshot.tab !== currentTab;
  const itemsData = snapshot?.tab === currentTab ? snapshot.items : [];

  const headingText = currentTab === "news" ? "News and updates" : currentTab === "tenders" ? "Tenders" : "Careers";
  usePageTitle(`${headingText} · RGUKT Ongole`);

  useEffect(() => {
    let cancelled = false;
    const apiType: NotificationType = currentTab === "news" ? "news_updates" : currentTab;
    getNotifications(apiType).then((data) => {
      if (!cancelled) setSnapshot({ tab: currentTab, items: data });
    });
    return () => {
      cancelled = true;
    };
  }, [currentTab]);

  const heroDescription =
    currentTab === "news"
      ? "Official news and notices published by RGUKT Ongole."
      : currentTab === "tenders"
        ? "Active tender notices from RGUKT Ongole."
        : "Career openings and recruitment notices.";

  const renderList = (allItems: Notification[], emptyMsg: string) => {
    if (allItems.length === 0) {
      return (
        <div className="py-16 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-tint-2">
            <FileText className="text-accent" size={32} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="mt-6 font-serif text-[22px] font-normal leading-[30px] text-head">{emptyMsg}</p>
        </div>
      );
    }

    const items = allItems.slice(0, visibleLimit);
    const hasMore = visibleLimit < allItems.length;

    return (
      <div>
        <ul>
          {items.map((item, idx) => (
            <li key={idx} className="border-t border-border py-[18px] last:border-b min-[821px]:py-[22px]">
              <p className="text-[14px] leading-5 text-text-3 tabular-nums">{dateLabel(item.date)}</p>
              <p className="mt-1 text-[17px] font-semibold leading-[26px] text-head">{item.title}</p>
              {item.links && item.links.length > 0 ? (
                <div className="mt-2 flex flex-col items-start">
                  {item.links.map((link, lidx) => (
                    <a
                      key={lidx}
                      href={link.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline"
                    >
                      {link.label || "Detailed Notification"}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[15px] leading-6 text-text-2">No notification available</p>
              )}
            </li>
          ))}
        </ul>
        {hasMore && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() =>
                setLimits((prev) => ({
                  ...prev,
                  [currentTab]: (prev[currentTab] ?? 10) + 10,
                }))
              }
              className={buttonVariants({ variant: "outline", size: "default" })}
            >
              View Next {Math.min(10, allItems.length - visibleLimit)} Updates
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHero
        eyebrow="RGUKT Ongole · Notifications"
        title={headingText}
        description={heroDescription}
      />

      <Wrap className="pb-16">
        <nav aria-label="Notification types" className="mt-6 flex overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "shrink-0 border-b-2 border-transparent px-4 py-4 text-[15px] font-medium leading-[22px] text-text-2",
                  isActive && "border-head font-semibold text-head",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2">
          {loading ? (
            <div aria-busy="true">
              <span className="sr-only">Loading {headingText}</span>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-t border-border py-[22px]">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton mt-3 h-5 w-4/5" />
                </div>
              ))}
            </div>
          ) : (
            renderList(itemsData, `No active ${headingText.toLowerCase()} available at this time.`)
          )}
        </div>
      </Wrap>
    </div>
  );
}
