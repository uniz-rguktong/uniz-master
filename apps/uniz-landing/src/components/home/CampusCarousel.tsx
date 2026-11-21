import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { officialHome } from "@/data/official";

const SLIDES = officialHome.carousel;

export function CampusCarousel() {
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;
  if (count === 0) return null;
  const slide = SLIDES[index] ?? SLIDES[0];

  const go = (next: number) => {
    setIndex((next + count) % count);
  };

  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-tint-2 min-[821px]:rounded-hero" aria-roledescription="carousel" aria-label="Campus photographs">
      <img
        src={slide.src}
        alt={slide.alt}
        width={1200}
        height={800}
        decoding="async"
        fetchPriority={index === 0 ? "high" : "auto"}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-navy-950/80 to-transparent p-3">
        <p className="text-[13px] leading-[18px] text-white">
          <span className="sr-only">Photograph </span>
          {index + 1} of {count}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous photograph"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900"
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next photograph"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-900"
          >
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
