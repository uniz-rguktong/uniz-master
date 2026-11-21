import { usePageTitle } from "../lib/usePageTitle";
import { AnnouncementTicker } from "../components/home/AnnouncementTicker";
import { HomeBanners } from "../components/home/HomeBanners";
import { HomeUpdates } from "../components/home/HomeUpdates";
import { Masthead } from "../components/home/Masthead";
import { HomeNotices } from "../components/home/HomeNotices";

export function HomePage() {
  usePageTitle("RGUKT Ongole");

  return (
    <>
      <AnnouncementTicker />
      <HomeBanners />
      <Masthead />
      <HomeUpdates />
      <HomeNotices />
    </>
  );
}
