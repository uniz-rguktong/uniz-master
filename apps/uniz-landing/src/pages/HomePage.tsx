import { usePageTitle } from "../lib/usePageTitle";
import { Masthead } from "../components/home/Masthead";
import { ServiceIndex } from "../components/home/ServiceIndex";
import { HomeNotices } from "../components/home/HomeNotices";
import { HomeAnnouncements } from "../components/home/HomeAnnouncements";
import { InstallPanel } from "../components/home/InstallPanel";

export function HomePage() {
  usePageTitle("RGUKT Ongole");

  return (
    <>
      <Masthead />
      <HomeAnnouncements />
      <ServiceIndex />
      <HomeNotices />
      <InstallPanel />
    </>
  );
}
