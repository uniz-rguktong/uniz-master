import { cn } from "@/lib/utils";

/**
 * Portal public-page tokens (home, privacy, developers).
 * Same U2 palette as the signed-in portal.
 */

export const landingPageClass = "min-h-screen bg-bg text-text antialiased";

export const landingSectionYClass = "py-16 md:py-24";

export const landingContainerClass = "mx-auto w-full max-w-[1232px] px-5 min-[821px]:px-10";

export const landingCardClass =
  "overflow-hidden rounded-xl border border-border bg-panel text-text";

export const landingCardHoverClass = "hover:border-border-strong";

export const landingEyebrowClass = "text-body text-text-2";

export const landingDisplayClass =
  "font-serif text-[34px] font-normal leading-[44px] tracking-[-0.01em] text-head min-[821px]:text-display min-[821px]:leading-[66px]";

export const landingDisplayMutedClass = "text-text-2 font-normal";

export const landingLeadClass =
  "max-w-xl text-[17px] font-normal leading-[27px] text-text-2 min-[821px]:text-lede min-[821px]:leading-[30px]";

export const landingPillClass =
  "inline-flex h-6 items-center gap-1.5 rounded-full bg-tint px-2.5 text-small font-medium text-text-2";

export const landingCtaClass =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-[16px] font-semibold leading-6 text-on-primary transition-[background-color,color] duration-150 ease-out hover:bg-primary-hover hover:text-on-primary active:text-on-primary disabled:text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const landingDividerClass = "h-px w-full bg-border";

export const landingFeatureGridClass = "grid grid-cols-1 gap-5 sm:grid-cols-2";

export const landingStackClass = cn(landingContainerClass, "space-y-6");
