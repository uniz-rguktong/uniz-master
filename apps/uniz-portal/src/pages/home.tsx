import { memo, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ClipboardCheck, GraduationCap, Monitor } from "lucide-react";
import { useIsAuth } from "../hooks/is_authenticated";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL } from "../constants/branding";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";
import { Button } from "@/components/Button";
import { Tile } from "@/components/ui/tile";
import {
  CampusIllustration,
  PublicFooter,
  PublicHeader,
} from "@/components/public/PublicFrame";

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const AndroidIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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

const Home = () => {
  useIsAuth();
  const navigate = useNavigate();
  const { install, isInstalled } = usePWAInstall();
  const platform = useMemo(() => getPlatform(), []);

  const handleInstallClick = async () => {
    const result = await install();
    if (result === "ios") {
      window.alert(
        "To install UniZ on iOS:\n\n1. Tap the Share icon (at bottom)\n2. Select Add to Home Screen\n\nDirect native install is not supported by Apple yet.",
      );
    }
  };

  useEffect(() => {
    prefetchTurnstile();
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
    <div className="min-h-screen bg-bg font-sans text-text">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />
      <PublicHeader />

      <main>
        <section className="mx-auto grid w-full max-w-[1232px] items-center gap-10 px-5 py-10 min-[821px]:grid-cols-[minmax(0,1fr)_520px] min-[821px]:gap-20 min-[821px]:px-10 min-[821px]:py-16">
          <div>
            <p className="text-body text-text-2">
              {UNIZ_CAMPUS_LABEL} campus platform
            </p>
            <h1 className="mt-4 max-w-[16ch] font-serif text-[34px] font-normal leading-[44px] tracking-[-0.01em] text-head min-[821px]:text-display min-[821px]:leading-[66px]">
              Campus tools for RGUKT Ongole students
            </h1>
            <p className="mt-4 max-w-[34rem] text-[17px] leading-[27px] text-text-2 min-[821px]:text-lede min-[821px]:leading-[30px]">
              Academics, semester registration, outpasses, and campus updates in
              one signed in place.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[821px]:flex-row min-[821px]:items-center">
              <Button
                size="hero"
                className="w-full min-[821px]:w-auto"
                onMouseEnter={prefetchTurnstile}
                onFocus={prefetchTurnstile}
                onClick={() => navigate("/student/signin")}
              >
                Sign in
              </Button>
              {!isInstalled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="hero"
                  className="w-full min-[821px]:w-auto"
                  onClick={handleInstallClick}
                >
                  <platform.PlatformIcon size={16} />
                  Install app
                </Button>
              ) : null}
            </div>
          </div>
          <div className="h-[300px] overflow-hidden rounded-xl border border-border bg-tint min-[821px]:h-[480px]">
            <CampusIllustration />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1232px] px-5 pb-16 min-[821px]:px-10">
          <h2 className="font-serif text-[28px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[36px] min-[821px]:leading-[46px]">
            Services
          </h2>
          <p className="mt-2 text-[17px] leading-[26px] text-text-2">
            Sign in with your university ID or college email.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 min-[821px]:grid-cols-3">
            <Tile
              icon={GraduationCap}
              label="Results"
              line="Semester results and subjects."
              onClick={() => navigate("/student/gradehub")}
            />
            <Tile
              icon={CalendarCheck}
              label="Attendance"
              line="Attendance for each subject."
              onClick={() => navigate("/student/attendance")}
            />
            <Tile
              icon={ClipboardCheck}
              label="Registration"
              line="Semester registration and deadlines."
              onClick={() => navigate("/student/registration")}
            />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default memo(Home);
