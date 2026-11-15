import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Monitor } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useIsAuth } from "../hooks/is_authenticated";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { SEO } from "../components/SEO";
import { HOME_SEO, homePageSchema } from "../lib/seo";
import { UNIZ_CAMPUS_LABEL } from "../constants/branding";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";
import { cn } from "@/lib/utils";

/** Elaya B7 base curve */
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

const BENEFITS = [
  {
    title: "Academics in one view",
    body: "See semester subjects, seating, and results without hopping between portals.",
  },
  {
    title: "Outpasses without the chase",
    body: "Submit a request, track status, and get notified when staff act on it.",
  },
  {
    title: "Campus updates that reach you",
    body: "Registration windows and notices land where students already sign in.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Sign in with campus credentials",
    body: "Use your university ID or college email on the student portal.",
  },
  {
    step: "02",
    title: "Open the tools you need",
    body: "Academics, outpasses, registration, and updates sit in one signed in home.",
  },
  {
    step: "03",
    title: "Stay current on campus",
    body: "Push alerts and the notice feed keep you informed when something changes.",
  },
] as const;

const TAGLINE_WORDS =
  "Campus life stays clearer when academics and requests live in one place.".split(
    " ",
  );

function TaglineReveal() {
  const reduceMotion = useReducedMotion();
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(reduceMotion ? TAGLINE_WORDS.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setActive(TAGLINE_WORDS.length);
      return;
    }

    const observers: IntersectionObserver[] = [];
    refs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive((n) => Math.max(n, i + 1));
            obs.disconnect();
          }
        },
        { rootMargin: "0px 0px -35% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [reduceMotion]);

  return (
    <section className="bg-white px-6 py-16 sm:px-10 sm:py-24">
      <p
        className="mx-auto max-w-[680px] text-balance text-center text-3xl font-semibold leading-9 sm:text-4xl sm:leading-10 md:text-5xl md:leading-none"
        aria-label={TAGLINE_WORDS.join(" ")}
      >
        {TAGLINE_WORDS.map((word, i) => (
          <span
            key={`${word}-${i}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cn(
              "inline-block mr-[0.3em] last:mr-0 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              i < active ? "text-navy-900" : "text-navy-900/30",
            )}
          >
            {word}
          </span>
        ))}
      </p>
    </section>
  );
}

/** Quiet product preview — the hero visual, not a feature card grid */
function PortalPreview() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-[0_8px_24px_rgba(11,42,71,0.08)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-navy-100 bg-navy-900 px-4 py-3">
        <span className="uniz-logo-wordmark text-lg !text-white leading-none">
          uniZ.
        </span>
        <span className="ml-auto text-xs font-medium text-white/70">
          Student home
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[140px_1fr]">
        <div className="hidden space-y-2 rounded-lg bg-[#F5F7FA] p-3 sm:block">
          {["Home", "Academics", "Outpass", "Updates"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium",
                i === 0
                  ? "bg-navy-900 text-white"
                  : "text-navy-600",
              )}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-navy-100 bg-[#F5F7FA] p-4">
            <p className="text-xs font-medium text-navy-500">This semester</p>
            <p className="mt-1 text-lg font-semibold text-navy-900">
              Subjects and seating
            </p>
            <div className="mt-3 h-2 w-3/4 rounded-full bg-navy-200/80" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-navy-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-navy-100 p-3">
              <p className="text-xs font-medium text-navy-500">Outpass</p>
              <p className="mt-1 text-sm font-semibold text-navy-900">
                Request ready
              </p>
            </div>
            <div className="rounded-lg border border-navy-100 p-3">
              <p className="text-xs font-medium text-navy-500">Updates</p>
              <p className="mt-1 text-sm font-semibold text-navy-900">
                2 new notices
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Home = () => {
  useIsAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
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

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease },
      };

  return (
    <div className="min-h-screen bg-white font-[Manrope,system-ui,sans-serif] text-navy-900">
      <SEO
        title={HOME_SEO.title}
        description={HOME_SEO.description}
        canonical="https://uniz.rguktong.in/"
        schema={homePageSchema}
      />

      {/* Hero — Layout A */}
      <section className="relative overflow-hidden bg-[#F5F7FA] px-6 pb-16 pt-28 sm:px-10 sm:pb-24 sm:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-[680px]">
            <motion.p
              {...fadeUp}
              className="mb-4 text-sm font-medium text-navy-600"
            >
              {UNIZ_CAMPUS_LABEL} campus platform
            </motion.p>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.04, ease }}
              className="uniz-logo-wordmark mb-6 text-6xl leading-none text-navy-900 sm:text-7xl md:text-8xl"
            >
              uniZ.
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.08, ease }}
              className="mb-4 max-w-[680px] text-balance bg-gradient-to-r from-black to-[#666666] bg-clip-text text-3xl font-semibold leading-9 text-transparent sm:text-4xl sm:leading-10"
            >
              Campus tools for
              <br />
              RGUKT Ongole students
            </motion.p>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.12, ease }}
              className="mb-8 max-w-[680px] text-pretty text-base font-medium leading-6 text-navy-600 sm:text-lg sm:leading-7"
            >
              Academics, semester registration, outpasses, and campus updates in
              one signed in place.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.16, ease }}
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onMouseEnter={prefetchTurnstile}
                onFocus={prefetchTurnstile}
                onClick={() => navigate("/student/signin")}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-navy-900 px-3 py-2 text-base font-semibold text-white transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 active:scale-[0.98]"
              >
                Get started
              </button>
              <p className="text-sm font-medium text-navy-500 sm:pl-2">
                Built for {UNIZ_CAMPUS_LABEL}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="w-full"
          >
            <PortalPreview />
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-navy-100 bg-white px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 max-w-[680px] text-balance text-3xl font-semibold leading-9 text-navy-900 sm:text-4xl sm:leading-10">
            What you can do once you are in
          </h2>
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {BENEFITS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
              >
                <h3 className="mb-2 text-xl font-semibold leading-7 text-navy-900">
                  {item.title}
                </h3>
                <p className="text-pretty text-base font-normal leading-6 text-navy-600">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TaglineReveal />

      {/* How it works */}
      <section className="border-t border-navy-100 bg-[#F5F7FA] px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 max-w-[680px] text-balance text-3xl font-semibold leading-9 text-navy-900 sm:text-4xl sm:leading-10">
            How it works
          </h2>
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {STEPS.map((item, i) => (
              <motion.li
                key={item.step}
                initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
                className="list-none"
              >
                <p className="mb-3 text-sm font-semibold text-navy-400">
                  {item.step}
                </p>
                <h3 className="mb-2 text-xl font-semibold leading-7 text-navy-900">
                  {item.title}
                </h3>
                <p className="text-pretty text-base font-normal leading-6 text-navy-600">
                  {item.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-900 px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-[680px]">
            <h2 className="mb-3 text-balance text-3xl font-semibold leading-9 text-white sm:text-4xl sm:leading-10">
              Ready for campus tools in one place?
            </h2>
            <p className="text-base font-medium leading-6 text-white/70">
              Sign in with your {UNIZ_CAMPUS_LABEL} credentials.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onMouseEnter={prefetchTurnstile}
              onFocus={prefetchTurnstile}
              onClick={() => navigate("/student/signin")}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-3 py-2 text-base font-semibold text-navy-900 transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-navy-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
            >
              Get started
            </button>
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white transition-[color,background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <platform.PlatformIcon size={16} />
                Install app
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100 bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-navy-600">
            © {new Date().getFullYear()} uniZ · {UNIZ_CAMPUS_LABEL}
          </p>
          <nav className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm font-medium text-navy-700 transition-colors duration-300 hover:text-navy-900"
            >
              Privacy
            </Link>
            <Link
              to="/developers"
              className="text-sm font-medium text-navy-700 transition-colors duration-300 hover:text-navy-900"
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
