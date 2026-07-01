import CircularTestimonials from "@/components/ui/circular-testimonials";
import { developerTestimonials } from "@/constants/developerTestimonials";
import { cn } from "@/lib/utils";

const CAROUSEL_COLORS = {
  name: "#171717",
  designation: "#525252",
  testimony: "#404040",
  arrowBackground: "#e5e5e5",
  arrowForeground: "#171717",
  arrowHoverBackground: "#3b82f6",
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
        "bg-white relative",
        compact ? "py-6 md:py-12" : "py-24",
        fitScreen && "py-3 md:py-12",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 md:px-6 h-full flex flex-col",
          fitScreen && "min-h-0",
        )}
      >
        <div
          className={cn(
            "text-center shrink-0",
            compact ? "mb-4 md:mb-10" : "mb-16",
            fitScreen && "mb-2 md:mb-10",
          )}
        >
          <h2
            className={cn(
              "font-bold text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 to-neutral-500",
              compact ? "text-xl md:text-3xl mb-1 md:mb-4" : "text-3xl md:text-5xl mb-4",
              fitScreen && "text-[1.35rem] leading-tight md:text-3xl",
            )}
          >
            Meet the Developers
          </h2>
          <p
            className={cn(
              "text-neutral-600",
              fitScreen ? "text-sm md:text-lg" : "text-lg",
            )}
          >
            {subtitle}
          </p>
        </div>

        <div className={cn("flex justify-center", fitScreen && "min-h-0")}>
          <CircularTestimonials
            testimonials={developerTestimonials}
            autoplay
            dense={fitScreen}
            colors={CAROUSEL_COLORS}
            fontSizes={CAROUSEL_FONT_SIZES}
          />
        </div>
      </div>
    </section>
  );
}
