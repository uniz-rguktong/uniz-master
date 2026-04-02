import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Announcement {
  text: string;
  link?: string | null;
}

export function HeroAndTitle({
  title = "Rajiv Gandhi University of Knowledge Technologies, Ongole Campus",
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
  const next = useCallback(() => goTo((current + 1) % images.length), [current, goTo, images.length]);

  useEffect(() => {
    if (!images.length) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, images.length]);

  return (
    <>
      {/* ── University Title Bar ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight md:leading-snug">
              {title}
            </h1>
            <p className="mt-1 sm:mt-1.5 text-[13px] sm:text-[15px] md:text-[16px] font-bold tracking-wide text-[#800000]">
              {subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ── NEW PREMIUM TICKER (ABOVE CAROUSEL) ── */}
      <section className="relative w-full overflow-hidden bg-slate-100 border-b border-slate-200 flex h-10 sm:h-12 items-center">
        {/* Left 'Notifications' Block */}
        <div className="relative z-20 flex items-center justify-center bg-[#800000] text-white px-4 sm:px-8 h-full shadow-[2px_0_8px_rgba(0,0,0,0.15)]">
          <span className="text-[13px] sm:text-[15px] font-bold tracking-wider uppercase">
            Notifications
          </span>
        </div>

        {/* Scrolling Track */}
        <div className="relative flex-1 h-full overflow-hidden bg-slate-100 flex items-center">
          {/* Edge Fades for smooth entry/exit */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-16 bg-gradient-to-r from-slate-100 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-16 bg-gradient-to-l from-slate-100 to-transparent z-10" />

          <div className="announcement-track flex items-center gap-12 whitespace-nowrap pl-4">
            {[...announcements, ...announcements].map((ann, idx) => (
              <a
                key={idx}
                href={ann.link || "#"}
                target={ann.link ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="group inline-flex items-center transition-colors duration-300"
              >
                {/* Prefix NEW */}
                <span className="text-[11px] sm:text-xs font-black uppercase text-[#800000] mr-2">
                  NEW
                </span>

                <span className="text-[13px] sm:text-[14px] font-semibold text-slate-600 group-hover:text-[#800000] transition-colors duration-300">
                  {ann.text || "Important notifications will be displayed here."}
                </span>

                {/* Suffix NEW */}
                <span className="text-[11px] sm:text-xs font-black uppercase text-[#800000] ml-2">
                  NEW
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero Carousel ── */}
      <section className="relative w-full overflow-hidden bg-slate-900 select-none" style={{ height: "clamp(320px, 70vh, 680px)" }}>

        {/* Slides */}
        {images.map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: idx === current && !animating ? 1 : 0, zIndex: idx === current ? 1 : 0 }}
          >
            <img
              src={img}
              alt={`Campus ${idx + 1}`}
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Dark vignette overlay for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
          </div>
        ))}

        {/* ── Prev/Next Buttons ── */}
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-lg transition-all duration-200 hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white shadow-lg transition-all duration-200 hover:scale-105"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* ── Dot Indicators ── */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === current ? "28px" : "8px",
                height: "8px",
                backgroundColor: idx === current ? "#ffffff" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>


      </section>
    </>
  );
}
