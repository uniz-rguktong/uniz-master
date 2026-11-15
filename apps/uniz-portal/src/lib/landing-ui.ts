import { cn } from "@/lib/utils";

/**
 * Marketing / landing design tokens — white institutional canvas.
 * Distinct from portal navy app chrome; used on marketing surfaces.
 */

export const landingPageClass = "min-h-screen bg-white text-black antialiased";

export const landingSectionYClass = "py-16 md:py-24";

export const landingContainerClass = "max-w-[1280px] mx-auto px-4 sm:px-6";

export const landingCardClass =
  "rounded-xl border border-navy-200/80 bg-white overflow-hidden transition-[border-color,box-shadow] duration-150";

export const landingCardHoverClass =
  "hover:border-navy-300 hover:shadow-whisper-landing";

export const landingEyebrowClass =
  "inline-flex items-center gap-2 text-[12px] font-medium text-navy-500";

export const landingDisplayClass =
  "text-[clamp(1.85rem,4.5vw,3.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)] font-semibold text-navy-900 tracking-[-0.03em] leading-[1.05]";

export const landingDisplayMutedClass = "text-navy-400 font-normal";

export const landingLeadClass =
  "text-[15px] md:text-[17px] text-navy-500 font-medium leading-relaxed max-w-xl";

export const landingPillClass =
  "inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-navy-200 text-[11px] font-medium text-navy-700";

export const landingCtaClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-7 rounded-lg bg-navy-900 text-white text-[14px] font-medium hover:bg-navy-800 transition-[color,background-color] duration-150";

export const landingDividerClass = "h-px w-full bg-navy-200/80";

export const landingFeatureGridClass =
  "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4";

export const landingStackClass = cn(landingContainerClass, "space-y-4 md:space-y-6");
