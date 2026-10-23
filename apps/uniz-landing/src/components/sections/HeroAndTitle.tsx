import { useState, useEffect, useCallback } from "react";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

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
        className="relative w-full overflow-hidden bg-[#000035] select-none"
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
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#000035]/90 via-[#000035]/35 to-[#000035]/25 pointer-events-none" />

        <div className="absolute inset-0 z-[3] flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24">
            <p className="text-[11px] sm:text-xs font-medium tracking-[0.22em] uppercase text-white/70 mb-4 sm:mb-5">
              Ongole Campus
            </p>
            <h1 className="font-serif text-white font-semibold tracking-tight leading-[1.08] text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] max-w-3xl">
              {title}
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-white/80 max-w-xl leading-relaxed font-light">
              {subtitle}
            </p>

            <div className="mt-8 sm:mt-10 flex items-center gap-5">
              <a
                href="#leadership"
                aria-label="Explore campus"
                className="group inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/50 text-white hover:bg-white hover:text-[#000035] transition-colors duration-300"
              >
                <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-y-0.5 transition-transform" />
              </a>
              <a
                href="#explore"
                className="editorial-link-light text-sm sm:text-[15px] font-medium tracking-wide"
              >
                Explore the campus
              </a>
            </div>
          </div>
        </div>

        {/* Minimal prev/next */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white/60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white/60 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-6 right-5 sm:right-8 z-10 flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: idx === current ? "20px" : "6px",
                    height: "6px",
                    backgroundColor:
                      idx === current ? "#ffffff" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Calm announcement ticker */}
      {announcements.length > 0 && (
        <section className="relative w-full overflow-hidden announcement-bar flex h-11 sm:h-12 items-center">
          <div className="relative z-20 flex items-center justify-center bg-[#800000] text-white px-4 sm:px-6 h-full shrink-0">
            <span className="text-[11px] sm:text-xs font-medium tracking-[0.16em] uppercase">
              Announcements
            </span>
          </div>

          <div className="relative flex-1 h-full overflow-hidden flex items-center">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />

            <div className="announcement-track flex items-center gap-10 whitespace-nowrap pl-5">
              {[...announcements, ...announcements].map((ann, idx) => (
                <a
                  key={idx}
                  href={ann.link || "#"}
                  target={ann.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-[13px] sm:text-sm text-slate-600 hover:text-[#800000] transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#800000] shrink-0" />
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
