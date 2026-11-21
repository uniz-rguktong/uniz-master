import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";
import { Masthead } from "../components/home/Masthead";
import { ServiceIndex } from "../components/home/ServiceIndex";
import { HomeNotices } from "../components/home/HomeNotices";
import { HomeAnnouncements } from "../components/home/HomeAnnouncements";
import { QuickLinks } from "../components/home/QuickLinks";
import { Leadership } from "../components/home/Leadership";
import { HomeExplore } from "../components/home/HomeExplore";
import { InstallPanel } from "../components/home/InstallPanel";
import { Stats } from "../components/sections/Stats";
import { Wrap } from "../components/layout/Wrap";
import { getHomeData } from "../types/api";
import type { Stat } from "../types/api";

function HomeStats() {
  const [stats, setStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHomeData().then((data) => {
      if (!cancelled) setStats(data.stats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || stats.length === 0) return null;
  return <Stats stats={stats} />;
}

export function HomePage() {
  usePageTitle("IIIT Ongole :: RGUKT-AP");

  return (
    <>
      <Masthead />
      <HomeAnnouncements />
      <QuickLinks />
      <Leadership />
      <Wrap>
        <div className="mt-[72px] grid gap-16 min-[821px]:mt-[112px] min-[821px]:grid-cols-2">
          <HomeNotices
            stacked
            type="news_updates"
            heading="News and updates"
            lede="Official news published by RGUKT Ongole."
            href="/notifications/news"
            action="All news"
          />
          <HomeNotices
            stacked
            type="tenders"
            heading="Tenders"
            lede="Quotations and tenders from the Ongole campus."
            href="/notifications/tenders"
            action="All tenders"
          />
        </div>
      </Wrap>
      <div className="mt-[72px] min-[821px]:mt-[112px]">
        <HomeStats />
      </div>
      <HomeExplore />
      <div className="mt-[72px] min-[821px]:mt-[112px]">
        <ServiceIndex />
      </div>
      <InstallPanel />
    </>
  );
}
