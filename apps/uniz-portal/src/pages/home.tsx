import { memo, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useIsAuth } from "../hooks/is_authenticated";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL, UNIZ_TAGLINE } from "../constants/branding";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";

const ease = [0.22, 1, 0.36, 1] as const;

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
        "To install UniZ on iOS:\n\n1. Tap the Share icon (at bottom)\n2. Select 'Add to Home Screen'\n\nDirect native install is not supported by Apple yet.",
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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] w-full flex-col overflow-hidden bg-[#F5F7FA]">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-navy-900 sm:w-2"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,rgba(11,42,71,0.06),transparent_55%)]"
      />

      <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-6 sm:px-10">
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-5 text-[13px] font-medium text-navy-700"
          >
            {UNIZ_CAMPUS_LABEL}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04, ease }}
            className="uniz-logo-wordmark mb-6 text-[clamp(3.75rem,16vw,7rem)] leading-none text-navy-900"
          >
            uniZ.
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.45, delay: 0.12, ease }}
            className="mb-6 h-px w-16 origin-center bg-navy-900"
            aria-hidden
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease }}
            className="max-w-md text-[18px] font-medium leading-snug tracking-[-0.02em] text-navy-900 sm:text-[20px]"
          >
            {UNIZ_TAGLINE.line1}
            <br className="hidden sm:block" />{" "}
            {UNIZ_TAGLINE.line2}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-4 max-w-sm text-[14px] leading-relaxed text-navy-600 sm:text-[15px]"
          >
            Academics, semester registration, outpasses, and campus updates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.26, ease }}
            className="mt-10 flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:items-center"
          >
            <button
              type="button"
              onMouseEnter={prefetchTurnstile}
              onFocus={prefetchTurnstile}
              onClick={() => navigate("/student/signin")}
              className="h-12 rounded-lg bg-navy-900 px-8 text-[14px] font-medium text-white transition-[color,background-color,transform] duration-150 hover:bg-navy-800 active:scale-[0.98]"
            >
              Get started
            </button>
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-navy-300 bg-white px-6 text-[14px] font-medium text-navy-900 transition-[color,background-color,border-color,transform] duration-150 hover:border-navy-400 hover:bg-navy-50 active:scale-[0.98]"
              >
                <platform.PlatformIcon size={16} />
                Download
              </button>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="relative z-[1] shrink-0 border-t border-navy-200/80 bg-white/90 px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-[12px] sm:flex-row">
          <p className="font-medium text-navy-700">
            © {new Date().getFullYear()} uniZ · {UNIZ_CAMPUS_LABEL}
          </p>
          <nav className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="font-medium text-navy-700 transition-colors hover:text-navy-900"
            >
              Privacy
            </Link>
            <Link
              to="/developers"
              className="font-medium text-navy-700 transition-colors hover:text-navy-900"
            >
              Developers
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default memo(Home);
