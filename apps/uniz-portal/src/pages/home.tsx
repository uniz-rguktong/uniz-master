import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, lazy, Suspense, useRef, useMemo } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import {
  Activity,
  Lock,
  Smartphone,
  Megaphone,
  CheckCircle2,
  ClipboardList,
  Bell,
  GraduationCap,
  Monitor,
} from "lucide-react";
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

// ─── Platform Icons ─────────────────────────────────────────────────────────

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const AndroidIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.23-.57-2.6-.89-4.05-.89-1.45 0-2.82.32-4.05.89L6.47 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C4.21 10.96 2.17 13.76 2 17h20c-.17-3.24-2.21-6.04-4.4-7.52zM8.5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

const getPlatform = () => {
  if (typeof navigator === "undefined") return { label: "Desktop", PlatformIcon: Monitor };
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return { label: "iOS", PlatformIcon: AppleIcon };
  if (/android/.test(ua)) return { label: "Android", PlatformIcon: AndroidIcon };
  if (/macintosh|mac os x/.test(ua)) return { label: "macOS", PlatformIcon: AppleIcon };
  if (/windows/.test(ua)) return { label: "Windows", PlatformIcon: Monitor };
  if (/linux/.test(ua)) return { label: "Linux", PlatformIcon: Monitor };
  return { label: "Desktop", PlatformIcon: Monitor };
};

// ─── Notification Icon Colors ────────────────────────────────────────────────

const NOTIF_STYLES = [
  {
    bg: "bg-amber-50",
    border: "border-amber-100",
    Icon: Megaphone,
    text: "text-amber-600",
  },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    Icon: CheckCircle2,
    text: "text-emerald-600",
  },
  {
    bg: "bg-blue-50",
    border: "border-blue-100",
    Icon: ClipboardList,
    text: "text-blue-600",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-100",
    Icon: Bell,
    text: "text-rose-500",
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-100",
    Icon: GraduationCap,
    text: "text-violet-600",
  },
];

const getTimeAgo = (date: string | undefined) => {
  if (!date) return "Just now";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Component: Live Updates Feed ────────────────────────────────────────────

const LiveUpdatesFeed = ({ notifications }: { notifications: any[] }) => {
  if (!notifications.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="w-full py-16 md:py-20"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Live Updates
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
            Real-time campus events,
            <span className="text-zinc-400 font-light">
              {" "}
              piped directly to your feed.
            </span>
          </h2>
        </div>

        {/* Vertical feed */}
        <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
          <div className="divide-y divide-zinc-50">
            {notifications.map((n, idx) => {
              const style = NOTIF_STYLES[idx % NOTIF_STYLES.length];

              return (
                <motion.a
                  key={idx}
                  href={n.link || "#"}
                  target={n.link ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-zinc-50/50 transition-colors group no-underline"
                >
                  {/* Icon circle */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full ${style.bg} ${style.border} border flex items-center justify-center`}
                  >
                    <style.Icon size={18} className={style.text} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors truncate leading-snug">
                      {n.content}
                    </p>
                    <p className="text-[11px] font-semibold text-zinc-400 mt-0.5 uppercase tracking-wider">
                      {n.title || "Campus Update"}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-[12px] font-medium text-zinc-400">
                    {getTimeAgo(n.createdAt)}
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
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
  const platform = useMemo(() => getPlatform(), []);

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
                className="h-14 px-10 bg-zinc-950 hover:bg-black text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-3 shadow-2xl transition-all"
              >
                <platform.PlatformIcon size={18} />
                Download for {platform.label}
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
      <HeroBlock />

      {/* ── Live Updates Feed ── */}
      <LiveUpdatesFeed notifications={notifications} />

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

        {/* GLOBAL CONNECTIVITY FEATURE - FULL WIDTH */}
        <ScrollRevealer>
          <div className="w-full bg-transparent mt-0 flex flex-col items-center pb-20">
            <GlobeFeature />
          </div>
        </ScrollRevealer>
      </Suspense>
    </div>
  );
};

export default memo(Home);
