import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
// motion removed as it's unused in this file
import {
  Activity,
  Lock,
  Smartphone,
  Download,
} from "lucide-react";
import { PUBLIC_BANNERS, GET_NOTIFICATIONS } from "../api/endpoints";
import FeaturedCarousel from "../components/FeaturedCarousel";
import { Timeline } from "../components/ui/timeline";
import DatabaseWithRestApi from "../components/ui/database-with-rest-api";
import { Features } from "../components/ui/features-9";
import GlobeFeature from "../components/ui/globe-feature-section";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { HeroBlock } from "../components/ui/hero-block-shadcnui";

export default function Home() {
  useIsAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const { install } = usePWAInstall();

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await install();
    if (result === "ios") {
      window.alert(
        "Installation Guide (iOS): \n\n1. Tap the 'Share' icon (square with arrow) at the bottom.\n2. Scroll down and select 'Add to Home Screen'.\n\nUniZ will now be ready on your home screen!",
      );
    } else if (result === "fallback") {
      // Fallback for cases where install prompt is not available
      window.alert(
        "Installation Guide: \n\n1. Open your browser menu (usually three dots or share list).\n2. Select 'Install App' or 'Add to Home Screen'.",
      );
    }
  };

  const timelineData = [
    {
      title: "Install the application",
      subtitle: "Campus in your pocket",
      step: "Step 01",
      icon: Smartphone,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            UniZ is built with cutting-edge PWA technology. This means you can
            install the platform directly on your mobile device or desktop for a
            lightning-fast, native experience—completely bypassing traditional
            app stores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <a
              href="#"
              onClick={handleInstallClick}
              className="group flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-full font-black text-sm shadow-2xl hover:bg-navy-900 transition-all active:scale-95 no-underline"
            >
              <Download
                size={20}
                strokeWidth={2.5}
                className="group-hover:-translate-y-1 transition-transform"
              />
              Download Portal App
            </a>
          </div>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              App Experience Features
            </h5>
            <ul className="space-y-3">
              {[
                "Instant loading with offline support",
                "Biometric secure authentication",
                "Real-time push notifications",
              ].map((point, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-navy-900"></div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Secure your access",
      subtitle: "Live Academic Dashboard",
      step: "Step 02",
      icon: Lock,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Gain a God's-eye view of your university credentials. Our platform
            mirrors your official records in real-time digital twins. Track
            exact GPA numbers and attendance thresholds automatically.
          </p>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              Live Academic Dashboard
            </h5>
            <ul className="space-y-3">
              {[
                "Real-time SGPA & CGPA tracking",
                "Multi-department resource sync",
                "Proactive attendance analysis",
              ].map((point, pointIdx) => (
                <li
                  key={pointIdx}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-navy-900"></div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Master your campus",
      subtitle: "Unified Mobility Hub",
      step: "Step 03",
      icon: Activity,
      content: (
        <div className="space-y-6">
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Take full control of your campus mobility. Request smart outpasses,
            track results, and receive broadcast alerts directly. It's not just
            checking boxes; it's understanding the pulse of your university
            life.
          </p>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 max-w-xl">
            <h5 className="font-black text-slate-900 mb-4 tracking-tight">
              Unified Mobility Hub
            </h5>
            <ul className="space-y-3">
              {[
                "Smart Outpass automation",
                "Grievance resolution tracking",
                "Global campus broadcasts",
              ].map((itemText, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-center gap-3 text-slate-600 text-sm font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-navy-900"></div>
                  {itemText}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
  ];

  // AUTHENTIC API IMPLEMENTATION FOR BANNERS
  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    fetch(PUBLIC_BANNERS, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setBanners(result.banners || []);
        }
      })
      .catch((error) => console.error(error));
  }, []);

  // AUTHENTIC API IMPLEMENTATION FOR NOTIFICATIONS
  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as RequestRedirect,
    };

    fetch(GET_NOTIFICATIONS, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.success && result.notifications) {
          // Notifications data remains but we no longer display the list
        }
      })
      .catch((error) => console.error(error));
  }, []);
  // Admin access
  useEffect(() => {
    let keys = "";
    const track = (e: KeyboardEvent) => {
      keys += e.key.toLowerCase();
      if (keys.endsWith("admin")) navigate("/admin/signin");
      keys = keys.slice(-10);
    };
    window.addEventListener("keydown", track);
    return () => window.removeEventListener("keydown", track);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      <HeroBlock />

      {/* FEATURED NOTIFICATIONS CAROUSEL */}
      <FeaturedCarousel
        items={banners.map((b, i) => ({
          id: b.id || i,
          imageUrl: b.imageUrl,
          title: b.title,
          tag: i % 2 === 0 ? "Featured" : "New Update",
          hasHeart: true,
        }))}
      />

      {/* GETTING STARTED TIMELINE */}
      <div className="px-[9px]">
        <Timeline data={timelineData} />
      </div>

      {/* DATABASE REST API COMPONENT INTEGRATION */}
      <div className="w-full px-6 flex flex-col items-center pb-32 pt-32 md:pt-48">
        <div className="mb-16 text-left w-full max-w-7xl px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            Everything your campus needs,
            <br className="hidden md:block" />
            <span className="text-slate-400">managed seamlessly.</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
            Eliminate operational friction with smart syncing connecting
            students, faculty and admin seamlessly.
          </p>
        </div>
        <DatabaseWithRestApi />
      </div>

      {/* SYSTEM HEALTH AND ACTIVITY DASHBOARD */}
      <Features />

      {/* GLOBAL CONNECTIVITY FEATURE - FULL WIDTH */}
      <div className="w-full bg-transparent mt-0 flex flex-col items-center">
        <GlobeFeature />
      </div>
    </div>
  );
}
