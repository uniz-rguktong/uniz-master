import { useEffect, useState } from "react";
import { getHomeData, getNotifications } from "../types/api";
import type { HomeData } from "../types/api";
import { apiData } from "../data/apiData";

import { HeroAndTitle } from "../components/sections/HeroAndTitle";
import { Events } from "../components/sections/Events";
import { Media } from "../components/sections/Media";
import { GridSection } from "../components/sections/GridSection";
import { Stats } from "../components/sections/Stats";

import { DirectorMessage } from "../components/sections/DirectorMessage";

import { Gallery } from "../components/sections/Gallery";

export function HomePage() {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [notificationsData, setNotificationsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          careers: careers
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
      <div className="flex h-screen w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading Campus Data...</p>
        </div>
      </div>
    );
  }

  const allImages = homeData.images || [];

  // Hero carousel – curated 10 images
  const heroImages = [
    "https://rguktong.ac.in/svgs/carosel/VRD.png",
    "https://rguktong.ac.in/svgs/carosel/all.jpg",
    "https://rguktong.ac.in/svgs/carosel/Cul.png",
    "https://rguktong.ac.in/svgs/carosel/1%20ind.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS22.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS222.jpeg",
    "https://rguktong.ac.in/svgs/carosel/ornat24-1.jpeg",
    "https://rguktong.ac.in/svgs/carosel/C26.jpeg",
    "https://rguktong.ac.in/svgs/carosel/WS11.jpeg",
    "https://rguktong.ac.in/svgs/carosel/swatch.png",
  ];

  // Build a pool of ALL valid, displayable images (no gifs, svgs, logos, or counters)
  const goodImages = allImages.filter(
    (img) =>
      !img.includes(".gif") &&
      !img.includes(".svg") &&
      !img.includes("rguktlogo") &&
      !img.includes("ap-logo") &&
      !img.includes("cutercounter") &&
      (img.endsWith(".jpg") || img.endsWith(".jpeg") || img.endsWith(".png"))
  );

  // Helper: take N images from the pool starting at an offset, cycling if needed
  const getPoolSlice = (offset: number, count: number) => {
    if (goodImages.length === 0) return [];
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(goodImages[(offset + i) % goodImages.length]);
    }
    return result;
  };

  const eventsImages = getPoolSlice(0, 6);
  const mediaImages = getPoolSlice(6, 12);
  const exploreImages = [
    "https://rguktong.ac.in/svgs/8libarary-min.jpg",
    "https://rguktong.ac.in/svgs/2cse-min.jpg",
    "https://rguktong.ac.in/svgs/1humanities-min.jpg",
    "https://rguktong.ac.in/svgs/sports2.svg",
  ];
  const highlightsImages = getPoolSlice(4, 6);

  const galleryImages = getPoolSlice(0, 16);

  // Provide a fixed high quality image for the Director from the API
  const directorImage = allImages.find(img => img.toLowerCase().includes("gupta")) || "https://rguktong.ac.in/images/gupta%20sir.jpeg";



  return (
    <div className="w-full bg-white">

      {/* 1. Hero & Announcements */}
      <div>
        <HeroAndTitle
          images={heroImages}
          announcements={homeData.announcements || []}
        />
      </div>

      {/* 2. Upcoming Events */}
      <div className="clear-both">
        <Events
          events={notificationsData.tenders || []}
          images={eventsImages}
        />
      </div>

      {/* 3. Media & Outreach */}
      <div className="clear-both">
        <Media
          news={notificationsData.news_updates || []}
          images={mediaImages}
        />
      </div>

      {/* 4. Explore Campus */}
      <div className="clear-both">
        <GridSection
          id="explore"
          title="Explore Campus"
          items={homeData.explore_campus || apiData.home.explore_campus || []}
          images={exploreImages}
          viewAllLink="/institute/campuslife"
          viewAllText="View Campus Actions"
          bgColor="bg-white"
          hideReadMore
        />
      </div>

      {/* 5. Careers & Recruitment */}
      <div className="clear-both">
        <GridSection
          id="careers"
          title="Careers & Recruitment"
          items={notificationsData.careers || []}
          images={highlightsImages}
          viewAllLink="/notifications"
          viewAllText="View All Careers"
          bgColor="bg-white"
        />
      </div>

      {/* 6. Statistics */}
      <div className="clear-both">
        <Stats
          stats={homeData.stats || []}
        />
      </div>



      {/* 8. Director's Message */}
      <div className="clear-both">
        <DirectorMessage
          directorImage={directorImage}
        />
      </div>



      {/* 10. Photo Gallery */}
      <div className="clear-both">
        <Gallery
          images={galleryImages}
        />
      </div>

    </div>
  );
}
