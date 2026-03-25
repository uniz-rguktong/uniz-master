import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, lazy, Suspense, useRef } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { Activity, Lock, Smartphone, ArrowRight } from "lucide-react";
import { PUBLIC_BANNERS, BASE_URL } from "../api/endpoints";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { HeroBlock } from "../components/ui/hero-block-shadcnui";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

// Lazy load heavy UI sections for better initial paint performance
const FeaturedCarousel = lazy(() => import("../components/FeaturedCarousel"));
const Timeline = lazy(() =>
  import("../components/ui/timeline").then((module) => ({
    default: module.Timeline,
  })),
);
const DatabaseWithRestApi = lazy(
  () => import("../components/ui/database-with-rest-api"),
);
const Features = lazy(() =>
  import("../components/ui/features-9").then((module) => ({
    default: module.Features,
  })),
);
const GlobeFeature = lazy(
  () => import("../components/ui/globe-feature-section"),
);

// Loading placeholder for Suspense
const SectionLoader = () => (
  <div className="w-full h-48 flex items-center justify-center">
    <div className="size-8 rounded-full border-2 border-slate-200 border-t-zinc-950 animate-spin" />
  </div>
);

// ─── Component: NotificationTicker ───────────────────────────────────────────

const NotificationTicker = ({ notifications }: { notifications: any[] }) => {
  if (!notifications.length) return null;

  return (
    <div className="w-full border-b border-zinc-100 bg-white overflow-hidden relative z-40">
      {/* Side fades for infinite emergence effect */}
      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="marquee flex items-center py-3">
        {[...notifications, ...notifications].map((n, idx) => {
          const isRecent =
            n.createdAt &&
            new Date().getTime() - new Date(n.createdAt).getTime() <
              48 * 60 * 60 * 1000;

          return (
            <a
              key={idx}
              href={n.link || "#"}
              target={n.link ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-4 mx-12 shrink-0 group/item no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                  {isRecent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                  {n.title || "Broadcast"}
                </span>
                <span className="text-zinc-600 text-[13.5px] font-bold tracking-tight whitespace-nowrap group-hover/item:text-zinc-950 transition-colors">
                  {n.content}
                </span>
                {n.link && (
                  <div className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded-full text-zinc-400 group-hover/item:border-zinc-300 group-hover/item:text-zinc-900 transition-all">
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                      Learn More
                    </span>
                    <ArrowRight
                      size={10}
                      className="group-hover/item:translate-x-0.5 transition-transform"
                    />
                  </div>
                )}
              </div>
              <div className="mx-8 w-1 h-1 rounded-full bg-zinc-200 opacity-50" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const ScrollRevealer = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "200px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[100px] w-full">
      {isVisible ? children : <SectionLoader />}
    </div>
  );
};

const Home = () => {
  useIsAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<any[]>([]);
  const { install, isInstalled } = usePWAInstall();

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await install();
    if (result === "ios") {
      window.alert(
        "To install UniZ on iOS:\n\n1. Tap the Share icon (at bottom)\n2. Select 'Add to Home Screen'\n\nDirect native install is not supported by Apple yet.",
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
            UniZ is built with cutting-edge PWA technology. Directly install the
            platform on your device for a lightning-fast experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start pt-4">
            {!isInstalled && (
              <Button
                variant="ghost"
                onClick={handleInstallClick}
                className="h-14 px-10 bg-[#111111] hover:bg-black text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-3 shadow-2xl transition-all"
              >
                Download the App
                <ArrowRight size={18} />
              </Button>
            )}
            {isInstalled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                Native App Instance Active
              </div>
            )}
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
            Gain a God's-eye view of your university credentials. Track exact
            GPA numbers and attendance thresholds automatically.
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
            Request outpasses, track results, and receive broadcast alerts
            directly. Understand the pulse of your university life in real-time.
          </p>
        </div>
      ),
    },
  ];

  const [notifications, setNotifications] = useState<any[]>([
    {
      title: "Campus Update",
      content:
        "New academic semester registration is now live. Please check your portals.",
    },
    {
      title: "Ornate 2026",
      content:
        "Our biggest technical fest is coming soon. Stay tuned for registrations.",
    },
  ]);

  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("x-cms-api-key", "uniz-landing-v1-key");

    fetch(PUBLIC_BANNERS, {
      method: "GET",
      headers: myHeaders,
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setBanners(result.banners || []);
      })
      .catch((error) => console.error(error));

    fetch(`${BASE_URL}/cms/notifications`, {
      method: "GET",
      headers: myHeaders,
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.notifications?.updates?.length > 0) {
          setNotifications(result.notifications.updates);
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-100 selection:text-zinc-900 pt-16">
      <NotificationTicker notifications={notifications} />

      <HeroBlock />

      <Suspense fallback={<SectionLoader />}>
        {/* FEATURED NOTIFICATIONS CAROUSEL */}
        <ScrollRevealer>
          <FeaturedCarousel
            items={banners.map((b, i) => ({
              id: b.id || i,
              imageUrl: b.imageUrl,
              title: b.title,
              tag: i % 2 === 0 ? "Featured" : "New Update",
              hasHeart: true,
            }))}
          />
        </ScrollRevealer>

        {/* GETTING STARTED TIMELINE */}
        <ScrollRevealer>
          <div className="px-[9px]">
            <Timeline data={timelineData} />
          </div>
        </ScrollRevealer>

        {/* DATABASE REST API COMPONENT INTEGRATION */}
        <ScrollRevealer>
          <div className="w-full flex flex-col items-center pb-32 pt-32 md:pt-48">
            <div className="w-full max-w-7xl px-8 md:px-12 lg:px-16 mb-16 px-4">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
                Everything your campus needs,
                <br className="hidden md:block" />
                <span className="text-slate-400">managed seamlessly.</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                Eliminate operational friction with smart syncing connecting
                students, faculty and admin seamlessly.
              </p>
            </div>
            <div className="w-full max-w-[1400px] px-4">
              <DatabaseWithRestApi />
            </div>
          </div>
        </ScrollRevealer>

        {/* SYSTEM HEALTH AND ACTIVITY DASHBOARD */}
        <ScrollRevealer>
          <Features />
        </ScrollRevealer>

        {/* GLOBAL CONNECTIVITY FEATURE - FULL WIDTH */}
        <ScrollRevealer>
          <div className="w-full bg-transparent mt-0 flex flex-col items-center pb-20">
            <GlobeFeature />
          </div>
        </ScrollRevealer>

        {/* FOOTER CTA */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full border-t border-zinc-100 bg-zinc-50/30"
        >
          <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                UniZ
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight mb-2">
                Built by RGUKT students,
                <span className="text-zinc-400 font-light">
                  {" "}
                  for RGUKT students.
                </span>
              </h3>
              <p className="text-[14px] text-zinc-500">
                From the developers of{" "}
                <a
                  href="https://synapstore.me/"
                  className="font-semibold text-blue-600 hover:text-blue-700 no-underline"
                >
                  Synapstore
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/student/signin")}
                className="bg-zinc-950 text-white rounded-xl px-8 font-bold h-12"
              >
                Get started now!
              </Button>
            </div>
          </div>
        </motion.section>
      </Suspense>
    </div>
  );
};

export default memo(Home);
