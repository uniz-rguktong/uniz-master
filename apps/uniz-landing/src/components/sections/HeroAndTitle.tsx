import { useState, useEffect } from "react";


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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <>
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-1 bg-[#800000] rounded-full mb-4"></div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-lg sm:text-xl md:text-2xl font-semibold tracking-wide text-[#800000]">
              {subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden">
        <div id="hero-carousel" className="carousel-container">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((img, index) => (
              <div key={index} className="carousel-slide hero-carousel-slide">
                <a href="#" className="block w-full h-full cursor-default">
                  <img
                    src={img}
                    alt={`Campus ${index}`}
                    className="w-full object-cover"
                  />
                </a>
              </div>
            ))}
          </div>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
            }
            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/50 hover:bg-white text-slate-800 p-3 rounded-full shadow-md transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/50 hover:bg-white text-slate-800 p-3 rounded-full shadow-md transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </section>

      <section id="announcements" className="announcement-bar relative overflow-hidden border-b border-[#800000]/10">
        {/* Animated background shimmer */}
        <div className="announcement-shimmer"></div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-5">
            {/* Premium animated badge */}
            <span className="announcement-badge shrink-0 inline-flex items-center gap-2 px-5 py-2 text-sm font-bold tracking-wide text-white bg-gradient-to-r from-[#800000] to-[#a00028] rounded-full shadow-lg shadow-[#800000]/30">
              <span className="announcement-pulse-dot"></span>
              Announcements
            </span>

            {/* Scrolling content */}
            <div className="relative flex-1 overflow-hidden">
              {/* Edge masks for seamless scroll */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-20 announcement-edge-left z-10"></div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-20 announcement-edge-right z-10"></div>

              <div className="announcement-track flex items-center gap-12 whitespace-nowrap">
                {[...announcements, ...announcements].map((ann, idx) => (
                  <a
                    key={idx}
                    href={ann.link || "#"}
                    target={ann.link ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="announcement-item-enhanced group inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-[#800000]/8"
                  >
                    <span className="announcement-dot-icon"></span>
                    <span className="text-sm sm:text-[15px] font-semibold text-slate-700 group-hover:text-[#800000] transition-colors duration-300">
                      {ann.text || "View Latest Updates"}
                    </span>
                    {idx === 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#d00000] to-[#800000] rounded-full shadow-sm animate-pulse">
                        New
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
