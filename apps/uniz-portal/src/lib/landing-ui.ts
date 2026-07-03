import { cn } from "@/lib/utils";

/**
 * Marketing / landing design tokens — white editorial canvas.
 * Distinct from portal navy; used on / and SEO pages only.
 */

export const landingPageClass = "min-h-screen bg-white text-zinc-900 antialiased";

export const landingSectionYClass = "py-16 md:py-24";

export const landingContainerClass = "max-w-[1280px] mx-auto px-4 sm:px-6";

export const landingCardClass =
  "rounded-portal-2xl border border-zinc-100/80 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300";

export const landingCardHoverClass =
  "hover:border-zinc-200 hover:bg-white hover:shadow-whisper-landing";

export const landingEyebrowClass =
  "inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-zinc-400";

export const landingDisplayClass =
  "text-[clamp(1.85rem,4.5vw,3.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)] font-semibold text-zinc-950 tracking-[-0.04em] leading-[1.02]";

export const landingDisplayMutedClass = "text-zinc-400 font-light";

export const landingLeadClass =
  "text-[15px] md:text-[17px] text-zinc-500 font-medium leading-relaxed max-w-xl";

export const landingPillClass =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9.5px] font-semibold tracking-[0.14em]";

export const landingCtaClass =
  "inline-flex items-center justify-center gap-2 min-h-12 px-8 rounded-portal-xl bg-zinc-950 text-white text-[14px] font-bold shadow-whisper-landing hover:bg-black transition-all";

export const landingDividerClass =
  "h-px w-full bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent";

export const landingFeatureGridClass =
  "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4";

export const landingStackClass = cn(landingContainerClass, "space-y-4 md:space-y-6");
