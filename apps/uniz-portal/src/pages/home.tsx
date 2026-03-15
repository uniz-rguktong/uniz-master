import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, lazy, Suspense } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import {
  Activity,
  Lock,
  Smartphone,
  Download,
} from "lucide-react";
import { PUBLIC_BANNERS } from "../api/endpoints";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { HeroBlock } from "../components/ui/hero-block-shadcnui";

// Lazy load heavy UI sections for better initial paint performance
const FeaturedCarousel = lazy(() => import("../components/FeaturedCarousel"));
const Timeline = lazy(() => import("../components/ui/timeline").then(module => ({ default: module.Timeline })));
const DatabaseWithRestApi = lazy(() => import("../components/ui/database-with-rest-api"));
const Features = lazy(() => import("../components/ui/features-9").then(module => ({ default: module.Features })));
const GlobeFeature = lazy(() => import("../components/ui/globe-feature-section"));

// Loading placeholder for Suspense
const SectionLoader = () => (
  <div className="w-full h-48 flex items-center justify-center">
    <div className="size-8 rounded-full border-2 border-slate-200 border-t-navy-900 animate-spin" />
  </div>
);

const Home = () => {
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
        </div>
      ),
    },
  ];

  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    fetch(PUBLIC_BANNERS, { method: "GET", headers: myHeaders })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setBanners(result.banners || []);
        }
      })
      .catch((error) => console.error(error));
  }, []);

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
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-navy-100 selection:text-navy-900">
      <HeroBlock />

      <Suspense fallback={<SectionLoader />}>
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
      </Suspense>
    </div>
  );
};

export default memo(Home);
