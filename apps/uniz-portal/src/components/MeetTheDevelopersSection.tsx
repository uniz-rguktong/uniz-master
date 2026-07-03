import CircularTestimonials from "@/components/ui/circular-testimonials";
import { developerTestimonials } from "@/constants/developerTestimonials";
import { cn } from "@/lib/utils";
import {
  landingEyebrowClass,
  landingLeadClass,
} from "@/lib/landing-ui";
import { Code2, Users } from "lucide-react";

const CAROUSEL_COLORS = {
  name: "#0b2a47",
  designation: "#52525b",
  testimony: "#3f3f46",
  arrowBackground: "#f4f4f5",
  arrowForeground: "#0b2a47",
  arrowHoverBackground: "#0b2a47",
};

const CAROUSEL_FONT_SIZES = {
  name: "28px",
  designation: "20px",
  quote: "20px",
};

interface MeetTheDevelopersSectionProps {
  subtitle?: string;
  compact?: boolean;
  /** Tight mobile layout so profile + quote fit one viewport (Developers page). */
  fitScreen?: boolean;
  className?: string;
}

export default function MeetTheDevelopersSection({
  subtitle = "The minds behind UniZ.",
  compact = false,
  fitScreen = false,
  className,
}: MeetTheDevelopersSectionProps) {
  return (
    <section
      className={cn(
        "relative bg-white",
        compact ? "py-8 md:py-14" : "py-24",
        fitScreen && "py-6 md:py-14",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full max-w-6xl flex-col px-4 md:px-6",
          fitScreen && "min-h-0",
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-2xl shrink-0 text-center",
            compact ? "mb-6 md:mb-10" : "mb-16",
            fitScreen && "mb-5 md:mb-10",
          )}
        >
          <div className="mb-4 hidden flex-wrap items-center justify-center gap-2 md:flex">
            <span
              className={cn(
                landingEyebrowClass,
                "rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 normal-case",
              )}
            >
              <Code2 className="h-3 w-3" />
              Student-built at RGUKT Ongole
            </span>
            <span
              className={cn(
                landingEyebrowClass,
                "rounded-full border border-zinc-200 bg-white px-3 py-1.5 normal-case",
              )}
            >
              <Users className="h-3 w-3" />
              {developerTestimonials.length} core contributors
            </span>
          </div>

          <h2
            className={cn(
              "font-semibold tracking-[-0.04em] text-zinc-950",
              compact
                ? "mb-2 text-[clamp(1.5rem,4vw,2.25rem)] leading-tight md:mb-3"
                : "mb-4 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]",
              fitScreen && "text-[clamp(1.5rem,4.5vw,2.25rem)]",
            )}
          >
            Meet the Developers
          </h2>
          <p
            className={cn(
              landingLeadClass,
              "mx-auto",
              fitScreen ? "text-sm md:text-base" : "text-base md:text-lg",
            )}
          >
            {subtitle}
          </p>
        </div>

        <div
          className={cn(
            "mx-auto w-full max-w-5xl",
            fitScreen && "min-h-0",
            "md:overflow-hidden md:rounded-portal-2xl md:border md:border-zinc-100/90 md:bg-white/80 md:p-2 md:shadow-[0_24px_60px_-24px_rgba(11,42,71,0.12)] md:backdrop-blur-sm",
          )}
        >
          <div className={cn("flex justify-center", fitScreen && "min-h-0")}>
            <CircularTestimonials
              testimonials={developerTestimonials}
              autoplay
              dense={fitScreen}
              showProgress
              colors={CAROUSEL_COLORS}
              fontSizes={CAROUSEL_FONT_SIZES}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
