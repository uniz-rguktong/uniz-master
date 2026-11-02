import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AndroidIcon, AppleIcon } from "../MobileAppModal";
import {
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  openLandingIosModal,
} from "../../lib/mobile-app";

interface Announcement {
  text: string;
  link?: string | null;
}

export function HeroAndTitle({
  title = "Rajiv Gandhi University of Knowledge Technologies",
  subtitle = "Ongole campus — academics, departments, and the UniZ portal for students, faculty, and admin",
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
      <section
        className="relative w-full overflow-hidden bg-navy-900 select-none"
        style={{ height: "min(92vh, 820px)", minHeight: "420px" }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: idx === current && !animating ? 1 : 0,
              zIndex: idx === current ? 1 : 0,
            }}
          >
            {img.includes("Cul.png") || img.includes("swatch.png") ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
                  style={{ backgroundImage: `url(${img})` }}
                  aria-hidden="true"
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

        <div
          className="absolute inset-0 z-[2] bg-navy-950/55 pointer-events-none"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 z-[3] h-0.5 bg-brand-red" aria-hidden="true" />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24">
            <p className="text-sm text-white/70 mb-4">Ongole campus</p>
            <h1 className="font-serif text-white font-medium tracking-tight leading-[1.06] text-[2rem] sm:text-5xl md:text-6xl lg:text-[3.75rem] max-w-4xl [text-wrap:balance]">
              {title}
            </h1>
            <p className="mt-5 sm:mt-6 border-l-2 border-brand-red pl-4 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <a
                href="https://uniz.rguktong.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-navy-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Open UniZ portal
              </a>
              <a
                href="#explore"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 bg-transparent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10"
              >
                Explore campus
              </a>
              <div className="flex flex-wrap gap-2 sm:ml-1">
                <a
                  href={ANDROID_APK_URL}
                  download={ANDROID_APK_FILENAME}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10"
                >
                  <AndroidIcon className="w-4 h-4" aria-hidden="true" />
                  Android app
                </a>
                <button
                  type="button"
                  onClick={openLandingIosModal}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10"
                >
                  <AppleIcon className="w-4 h-4" aria-hidden="true" />
                  iOS app
                </button>
              </div>
            </div>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-11 h-11 rounded-lg border border-white/20 bg-navy-950/50 text-white/90 hover:bg-white hover:text-navy-900 transition-colors duration-150"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-11 h-11 rounded-lg border border-white/20 bg-navy-950/50 text-white/90 hover:bg-white hover:text-navy-900 transition-colors duration-150"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 right-5 sm:right-8 z-10 flex items-center gap-3">
              <span
                className="text-xs font-medium tabular-nums text-white/75"
                aria-live="polite"
              >
                {current + 1}
                <span className="text-white/45"> / {images.length}</span>
              </span>
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide indicators">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === current}
                    onClick={() => goTo(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1 rounded-full transition-[width,background-color] duration-150 ${
                      idx === current ? "w-7 bg-brand-red" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {announcements.length > 0 && (
        <section className="relative w-full overflow-hidden announcement-bar flex h-11 sm:h-12 items-center">
          <div className="relative z-20 flex items-center justify-center gap-2 bg-navy text-white px-4 sm:px-6 h-full shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium">Announcements</span>
          </div>

          <div className="relative flex-1 h-full overflow-hidden flex items-center">
            <div
              className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-surface to-transparent z-10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-surface to-transparent z-10"
              aria-hidden="true"
            />

            <div className="announcement-track flex items-center gap-10 whitespace-nowrap pl-5">
              {[...announcements, ...announcements].map((ann, idx) => (
                <a
                  key={idx}
                  href={ann.link || "#"}
                  target={ann.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-[13px] sm:text-sm text-slate-600 hover:text-navy transition-colors duration-150"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-navy shrink-0" aria-hidden="true" />
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
