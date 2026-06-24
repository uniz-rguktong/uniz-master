import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  LandingSection,
  LandingSectionHeader,
  LandingPill,
  landingCardClass,
  landingCardHoverClass,
} from "./ui/landing-section";
import { cn } from "@/lib/utils";

interface FeatureCard {
  id: string | number;
  imageUrl: string;
  title: string;
  tag?: string;
  link?: string;
  hasHeart?: boolean;
}

interface FeaturedCarouselProps {
  items: FeatureCard[];
}

const TAG_ACCENTS = ["emerald", "blue", "amber", "slate"] as const;

const ArrowBtn = ({
  onClick,
  dir,
}: {
  onClick?: () => void;
  dir: "left" | "right";
}) => (
  <button
    onClick={onClick}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center",
      "bg-white/90 backdrop-blur-md border border-zinc-100",
      "shadow-[0_12px_32px_-10px_rgba(0,0,0,0.15)] hover:bg-white hover:scale-105 transition-all duration-300",
      dir === "left" ? "-left-3 md:-left-5" : "-right-3 md:-right-5",
    )}
  >
    {dir === "left" ? (
      <ChevronLeft size={20} className="text-zinc-700" />
    ) : (
      <ChevronRight size={20} className="text-zinc-700" />
    )}
  </button>
);

export default function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const displayItems =
    items.length > 1 && items.length < 6
      ? [...items, ...items, ...items]
      : items;

  const settings = {
    dots: false,
    infinite: displayItems.length > 1,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    arrows: true,
    speed: 900,
    cssEase: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <ArrowBtn dir="right" />,
    prevArrow: <ArrowBtn dir="left" />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  if (!items || items.length === 0) return null;

  return (
    <LandingSection>
      <LandingSectionHeader
        eyebrow="Campus Highlights"
        title="Featured"
        titleMuted="stories from your institute."
      />

      <div className="relative -mx-1 md:-mx-2 pt-2 pb-4">
        <Slider key={displayItems.length} {...settings}>
          {displayItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="px-3 py-2">
              <motion.div
                whileHover={{ y: -10 }}
                animate={{ y: [0, -4, 0] }}
                transition={{
                  y: {
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (idx % 4) * 0.35,
                  },
                }}
                className={cn(
                  landingCardClass,
                  landingCardHoverClass,
                  "group flex flex-col cursor-pointer shadow-[0_20px_50px_-22px_rgba(0,0,0,0.12)]",
                )}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50/40 border-b border-zinc-100/40">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="flex flex-col gap-2.5 p-5 pt-4">
                  <LandingPill
                    label={item.tag || "Campus"}
                    accent={TAG_ACCENTS[idx % TAG_ACCENTS.length]}
                  />
                  <h3 className="text-[15px] font-black text-zinc-950 tracking-tight leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-zinc-800 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[12.5px] font-medium text-zinc-500/80 leading-relaxed">
                    Institute announcements and campus highlights.
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </Slider>
      </div>
    </LandingSection>
  );
}
