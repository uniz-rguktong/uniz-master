import { useState, useEffect, useCallback } from "react";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  AndroidIcon,
  AppleIcon,
  openLandingIosModal,
} from "../MobileAppModal";

interface Announcement {
  text: string;
  link?: string | null;
}

export function HeroAndTitle({
  title = "Rajiv Gandhi University of Knowledge Technologies",
  subtitle = "Catering to the Educational Needs of Gifted Rural Youth",
  images = [],
  announcements = [],
}: {
  title?: string;
  subtitle?: string;
  images: readonly string[];
  announcements: readonly Announcement[];
}) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === current) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 400);
    },
    [animating, current]
  );

  const prev = () => goTo(current === 0 ? images.length - 1 : current - 1);
  const next = useCallback(
    () => goTo((current + 1) % images.length),
    [current, goTo, images.length]
  );

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  return (
    <>
      {/* Full-bleed photographic hero */}
      <section
        className="relative w-full overflow-hidden bg-navy-900 select-none"
        style={{ height: "min(92vh, 820px)", minHeight: "420px" }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: idx === current && !animating ? 1 : 0,
              zIndex: idx === current ? 1 : 0,
            }}
          >
            {img.includes("Cul.png") || img.includes("swatch.png") ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-50"
                  style={{ backgroundImage: `url(${img})` }}
                />
                <img
                  src={img}
                  alt={`Campus ${idx + 1}`}
                  className={`relative z-10 w-full h-full object-contain ${
                    img.includes("swatch.png") ? "scale-x-[1.15]" : ""
                  }`}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </>
            ) : (
              <img
                src={img}
                alt={`Campus ${idx + 1}`}
                className={`w-full h-full object-cover ${
                  img.includes("VRD.png") ? "object-[center_15%]" : "object-center"
                }`}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}

        {/* Editorial overlay */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-navy-950/95 via-navy-900/45 to-navy-900/20 pointer-events-none" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-r from-navy-950/80 via-navy-900/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 z-[3] h-1 bg-brand-red" />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-white/90 backdrop-blur-md mb-5 sm:mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden="true" />
              Ongole Campus
            </p>
            <h1 className="font-serif text-white font-bold tracking-tight leading-[1.04] text-[2.25rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] max-w-4xl [text-wrap:balance] drop-shadow-[0_2px_24px_rgba(2,18,39,0.45)]">
              {title}
            </h1>
            <p className="mt-5 sm:mt-6 border-l-2 border-brand-red pl-4 text-base sm:text-xl text-white/85 max-w-xl leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#leadership"
                aria-label="Explore campus"
                className="group inline-flex items-center justify-center w-11 h-11 rounded-full bg-brand-red text-white shadow-[0_8px_24px_-8px_rgba(234,32,39,0.7)] hover:bg-[#C81A20] transition-colors duration-150"
              >
                <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              </a>
              <a
                href="#explore"
                className="editorial-link-light text-sm sm:text-[15px] font-medium tracking-wide mr-2"
              >
                Explore the campus
              </a>
              <a
                href={ANDROID_APK_URL}
                download={ANDROID_APK_FILENAME}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 shadow-[0_8px_24px_-12px_rgba(2,18,39,0.6)] text-xs font-bold uppercase tracking-[0.08em] text-navy-900 transition-colors hover:bg-navy-200"
              >
                <AndroidIcon className="w-3.5 h-3.5" />
                Download Android App
              </a>
              <button
                type="button"
                onClick={openLandingIosModal}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-navy-900"
              >
                <AppleIcon className="w-3.5 h-3.5" />
                Download iOS App
              </button>
            </div>
          </div>
        </div>

        {/* Minimal prev/next */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-navy-950/30 text-white/85 backdrop-blur-md hover:bg-white hover:text-navy-900 transition-colors duration-150"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-11 h-11 rounded-full border border-white/25 bg-navy-950/30 text-white/85 backdrop-blur-md hover:bg-white hover:text-navy-900 transition-colors duration-150"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 right-5 sm:right-8 z-10 flex items-center gap-3">
              <span className="text-[11px] font-semibold tabular-nums tracking-[0.18em] text-white/80" aria-hidden="true">
                {String(current + 1).padStart(2, "0")}
                <span className="text-white/40"> / {String(images.length).padStart(2, "0")}</span>
              </span>
              <div className="flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: idx === current ? "28px" : "6px",
                    height: "4px",
                    backgroundColor:
                      idx === current ? "#EA2027" : "rgba(255,255,255,0.45)",
                  }}
                />
              ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Calm announcement ticker */}
      {announcements.length > 0 && (
        <section className="relative w-full overflow-hidden announcement-bar flex h-11 sm:h-12 items-center">
          <div className="relative z-20 flex items-center justify-center gap-2 bg-navy text-white px-4 sm:px-6 h-full shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse motion-reduce:animate-none" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-medium tracking-[0.16em] uppercase">
              Announcements
            </span>
          </div>

          <div className="relative flex-1 h-full overflow-hidden flex items-center">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-surface to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-surface to-transparent z-10" />

            <div className="announcement-track flex items-center gap-10 whitespace-nowrap pl-5">
              {[...announcements, ...announcements].map((ann, idx) => (
                <a
                  key={idx}
                  href={ann.link || "#"}
                  target={ann.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-[13px] sm:text-sm text-slate-600 hover:text-navy transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-navy shrink-0" />
                  <span>{ann.text || "Important notifications will be displayed here."}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
