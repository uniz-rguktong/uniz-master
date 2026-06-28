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
  className?: string;
}

export default function MeetTheDevelopersSection({
  subtitle = "The minds behind UniZ.",
  compact = false,
  className,
}: MeetTheDevelopersSectionProps) {
  return (
    <section
      className={cn(
        "bg-white relative",
        compact ? "py-12" : "py-24",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className={cn("text-center", compact ? "mb-10" : "mb-16")}>
          <h2
            className={cn(
              "font-bold text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 to-neutral-500 mb-4",
              compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl",
            )}
          >
            Meet the Developers
          </h2>
          <p className="text-neutral-600 text-lg">{subtitle}</p>
        </div>

        <div className="flex justify-center">
          <CircularTestimonials
            testimonials={developerTestimonials}
            autoplay
            colors={CAROUSEL_COLORS}
            fontSizes={CAROUSEL_FONT_SIZES}
          />
        </div>
      </div>
    </section>
  );
}
