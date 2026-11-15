import { memo, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useIsAuth } from "../hooks/is_authenticated";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL, UNIZ_TAGLINE } from "../constants/branding";

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
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white relative">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />

      {/* Quiet institutional wash — not a marketing gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(11,42,71,0.07),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-navy-200/60"
      />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-navy-500 mb-5 sm:mb-6"
        >
          {UNIZ_CAMPUS_LABEL}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="uniz-logo-wordmark text-[clamp(3.25rem,14vw,6.5rem)] leading-none text-navy-900 mb-5 sm:mb-6"
        >
          uniZ.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[22rem] sm:max-w-md text-[17px] sm:text-[19px] font-medium text-navy-900 tracking-[-0.02em] leading-snug"
        >
          {UNIZ_TAGLINE.line1} {UNIZ_TAGLINE.line2}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.22 }}
          className="mt-3 max-w-sm text-[14px] sm:text-[15px] text-navy-500 leading-relaxed"
        >
          Academics, semester registration, outpasses, and campus updates.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto"
        >
          <button
            type="button"
            onClick={() => navigate("/student/signin")}
            className="h-12 px-8 bg-navy-900 text-white text-[14px] font-semibold rounded-xl hover:bg-navy-800 active:scale-[0.98] transition-colors"
          >
            Get started
          </button>
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="h-12 px-6 inline-flex items-center justify-center gap-2 border border-navy-200 text-navy-800 text-[14px] font-semibold rounded-xl hover:bg-navy-50 active:scale-[0.98] transition-colors"
            >
              <platform.PlatformIcon size={16} />
              Download
            </button>
          )}
        </motion.div>
      </div>

      <footer className="relative shrink-0 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-navy-400">
        <p>© {new Date().getFullYear()} uniZ</p>
        <nav className="flex items-center gap-5">
          <Link
            to="/privacy"
            className="font-medium text-navy-500 hover:text-navy-900 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/developers"
            className="font-medium text-navy-500 hover:text-navy-900 transition-colors"
          >
            Developers
          </Link>
        </nav>
      </footer>
    </div>
  );
};

export default memo(Home);
