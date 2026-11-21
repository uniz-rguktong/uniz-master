import { usePageTitle } from "../lib/usePageTitle";
import { Masthead } from "../components/home/Masthead";
import { ServiceIndex } from "../components/home/ServiceIndex";
import { HomeNotices } from "../components/home/HomeNotices";
import { InstallPanel } from "../components/home/InstallPanel";

export function HomePage() {
  usePageTitle("IIIT Ongole :: RGUKT-AP");

  return (
    <>
      <Masthead />
      <ServiceIndex />
      <HomeNotices />
      <InstallPanel />
    </>
  );
}
