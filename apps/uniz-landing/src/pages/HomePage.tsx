import { useEffect, useState } from "react";
import { getHomeData, getNotifications } from "../types/api";
import type { HomeData, Notification } from "../types/api";
import { usePageTitle } from "../lib/usePageTitle";

import { HeroAndTitle } from "../components/sections/HeroAndTitle";
import { UniZPortalStrip } from "../components/sections/UniZPortalStrip";
import { Leadership } from "../components/sections/Leadership";
import { Media } from "../components/sections/Media";
import { Logos3 } from "../components/blocks/logos3";
import { ExploreCampus } from "../components/sections/ExploreCampus";
import { Stats } from "../components/sections/Stats";
import { DirectorMessage } from "../components/sections/DirectorMessage";
import { Gallery } from "../components/sections/Gallery";
import { CampusBoot } from "../components/CampusBoot";

export function HomePage() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [notificationsData, setNotificationsData] = useState<{
    news_updates: Notification[];
    tenders: Notification[];
    careers: Notification[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle("IIIT Ongole :: RGUKT-AP");

  useEffect(() => {
    async function loadData() {
      try {
        const [home, news, tenders, careers] = await Promise.all([
          getHomeData(),
          getNotifications("news_updates"),
          getNotifications("tenders"),
          getNotifications("careers"),
        ]);
        setHomeData(home);
        setNotificationsData({
          news_updates: news,
          tenders: tenders,
          careers: careers,
        });
      } catch (error) {
        console.error("Error loading home page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !homeData || !notificationsData) {
    return (
      <CampusBoot />
    );
  }

  const allImages = homeData.images || [];

  const heroImages = [
    "/carousel/VRD.png.webp",
    "/carousel/all.jpg.webp",
    "/carousel/Sports.png.webp",
    "/carousel/Cul.png.webp",
    "https://rguktong.ac.in/svgs/carosel/1%20ind.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS22.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS222.jpeg",
    "https://rguktong.ac.in/svgs/carosel/Events.jpeg",
    "https://rguktong.ac.in/svgs/carosel/C26.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS11.jpeg",
    "/carousel/swatch.png.webp",
  ];

  const goodImages = allImages.filter(
    (img) =>
      !img.includes(".gif") &&
      !img.includes(".svg") &&
      !img.includes("rguktlogo") &&
      !img.includes("ap-logo") &&
      !img.includes("cutercounter") &&
      !img.includes("social-media") &&
      !img.includes("/profiles/") &&
      !img.includes("/img/new") &&
      img.includes("carosel") &&
      (img.endsWith(".jpg") || img.endsWith(".jpeg") || img.endsWith(".png"))
  );

  const getPoolSlice = (offset: number, count: number) => {
    if (goodImages.length === 0) return [];
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(goodImages[(offset + i) % goodImages.length]);
    }
    return result;
  };

  const galleryImages = getPoolSlice(0, 16);
  const directorImage =
    allImages.find((img) => img.toLowerCase().includes("gupta")) ||
    "https://rguktong.ac.in/images/gupta%20sir.jpeg";

  return (
    <div className="w-full bg-white">
      <HeroAndTitle
        images={heroImages}
        announcements={homeData.announcements || []}
      />

      <UniZPortalStrip />

      <Leadership />

      <DirectorMessage directorImage={directorImage} />

      <Stats stats={homeData.stats || []} />

      <ExploreCampus />

      <Media news={notificationsData.news_updates || []} />

      <div className="border-t border-slate-100">
        <Logos3 />
      </div>

      <Gallery images={galleryImages} />
    </div>
  );
}
