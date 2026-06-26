import { useNavigate } from "react-router-dom";
import {
  useEffect,
  useState,
  memo,
  lazy,
  Suspense,
  useRef,
  useMemo,
} from "react";
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
import { motion } from "framer-motion";
import {
  LandingSection,
  LandingSectionHeader,
  LandingDivider,
  LandingCard,
  LandingPill,
  LandingCTA,
} from "../components/ui/landing-section";

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
    <div className="size-8 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin" />
  </div>
);

// ─── Platform Icons ─────────────────────────────────────────────────────────

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const AndroidIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.23-.57-2.6-.89-4.05-.89-1.45 0-2.82.32-4.05.89L6.47 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C4.21 10.96 2.17 13.76 2 17h20c-.17-3.24-2.21-6.04-4.4-7.52zM8.5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const getPlatform = () => {
  if (typeof navigator === "undefined")
    return { label: "Desktop", PlatformIcon: Monitor };
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua))
    return { label: "iOS", PlatformIcon: AppleIcon };
  if (/android/.test(ua))
    return { label: "Android", PlatformIcon: AndroidIcon };
  if (/macintosh|mac os x/.test(ua))
    return { label: "macOS", PlatformIcon: AppleIcon };
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
    <LandingSection>
      <LandingSectionHeader
        eyebrow="Live Updates"
        title="Real-time campus events,"
        titleMuted="piped directly to your feed."
      />

      <LandingCard className="shadow-[0_25px_60px_-20px_rgba(0,0,0,0.06)]">
        <div className="divide-y divide-zinc-100/80">
          {notifications.map((n, idx) => {
            const accents = ["amber", "emerald", "blue", "default", "slate"] as const;
            const accent = accents[idx % accents.length];

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
                className="flex items-center gap-4 px-6 py-5 md:px-8 md:py-6 hover:bg-zinc-50/60 transition-colors group no-underline first:rounded-t-[2.5rem] last:rounded-b-[2.5rem]"
              >
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(0,0,0,0.2)]">
                  {(() => {
                    const style = NOTIF_STYLES[idx % NOTIF_STYLES.length];
                    return <style.Icon size={18} className="text-white" />;
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1.5">
                    <LandingPill
                      label={n.title || "Campus Update"}
                      accent={accent}
                    />
                  </div>
                  <p className="text-[14px] font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors leading-snug line-clamp-2">
                    {n.content}
                  </p>
                </div>

                <span className="shrink-0 text-[11px] font-semibold text-zinc-400 tabular-nums">
                  {getTimeAgo(n.createdAt)}
                </span>
              </motion.a>
            );
          })}
        </div>
      </LandingCard>
    </LandingSection>
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
          <p className="text-zinc-500 font-medium text-[15px] md:text-[17px] leading-relaxed">
            UniZ is built with cutting-edge PWA technology. Directly install the
            platform on your device for a lightning-fast experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start pt-4">
            {!isInstalled && (
              <LandingCTA onClick={handleInstallClick} className="h-14 px-10 text-[15px]">
                <platform.PlatformIcon size={18} />
                Download for {platform.label}
              </LandingCTA>
            )}
            {isInstalled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold tracking-[0.14em] border border-emerald-100">
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
          <p className="text-zinc-500 font-medium text-[15px] md:text-[17px] leading-relaxed">
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
          <p className="text-zinc-500 font-medium text-[15px] md:text-[17px] leading-relaxed">
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
      title: "Campus Events",
      content:
        "Watch the notice board and student channels for upcoming workshops, sports, and cultural programs.",
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const headers = new Headers();
    headers.append("x-cms-api-key", "uniz-landing-v1-key");

    const fetchOpts: RequestInit = {
      method: "GET",
      headers,
      signal: controller.signal,
    };

    const loadLandingData = () => {
      fetch(PUBLIC_BANNERS, fetchOpts)
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (!cancelled && result?.success) {
            setBanners(result.banners || []);
          }
        })
        .catch(() => {});

      fetch(`${BASE_URL}/cms/notifications`, fetchOpts)
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (
            !cancelled &&
            result?.success &&
            result.notifications?.updates?.length > 0
          ) {
            setNotifications(result.notifications.updates);
          }
        })
        .catch(() => {});
    };

    const defer =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(loadLandingData, { timeout: 2500 })
        : window.setTimeout(loadLandingData, 200);

    return () => {
      cancelled = true;
      controller.abort();
      if (typeof defer === "number") {
        window.clearTimeout(defer);
      } else if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(defer);
      }
    };
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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-zinc-100 selection:text-zinc-900 pt-16 relative overflow-x-hidden">
      <HeroBlock />

      <main className="relative">
        <LiveUpdatesFeed notifications={notifications} />
        <LandingDivider />

        <Suspense fallback={<SectionLoader />}>
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

          <LandingDivider />

          <ScrollRevealer>
            <Timeline data={timelineData} />
          </ScrollRevealer>

          <LandingDivider />

          <ScrollRevealer>
            <LandingSection className="!pb-8 md:!pb-12">
              <LandingSectionHeader
                eyebrow="Platform"
                title="Everything your campus needs,"
                titleMuted="managed seamlessly."
                description="Eliminate operational friction with smart syncing connecting students, faculty and admin seamlessly."
              />
              <LandingCard hover={false} className="p-4 md:p-8 shadow-[0_25px_60px_-22px_rgba(0,0,0,0.08)]">
                <DatabaseWithRestApi />
              </LandingCard>
            </LandingSection>
          </ScrollRevealer>

          <LandingDivider />

          <ScrollRevealer>
            <Features />
          </ScrollRevealer>

          <LandingDivider />

          <ScrollRevealer>
            <GlobeFeature />
          </ScrollRevealer>

          <LandingDivider />

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-24">
              <LandingCard className="p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.08)]">
                <div>
                  <LandingPill label="UniZ" accent="emerald" className="mb-4" />
                  <h3 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold text-zinc-950 tracking-[-0.05em] leading-[1.05] mb-3">
                    Built by RGUKT students,
                    <span className="text-zinc-400 font-light">
                      {" "}
                      for RGUKT students.
                    </span>
                  </h3>
                  <p className="text-[15px] text-zinc-500 font-medium leading-relaxed">
                    From the developers of{" "}
                    <a
                      href="https://synapstore.me/"
                      className="font-semibold text-zinc-950 hover:text-zinc-700 no-underline underline-offset-4 hover:underline"
                    >
                      Synapstore
                    </a>
                  </p>
                </div>
                <LandingCTA onClick={() => navigate("/student/signin")}>
                  Get started now!
                </LandingCTA>
              </LandingCard>
            </div>
          </motion.section>
        </Suspense>
      </main>
    </div>
  );
};

export default memo(Home);
