import { cn } from "@/lib/utils";

/**
 * Public design system copied from rguktong.in (`apps/uniz-landing`).
 * Cabin Condensed, navy #0A2540, red #EA2027, line #E2E8F0, 150ms ease.
 * Authenticated app surfaces stay on portal-ui / student-ui.
 */

export const landingPageClass =
  "campus-canvas flex min-h-screen w-full flex-col bg-white text-ink antialiased";

export const landingContainerClass =
  "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12";

export const landingSectionYClass = "section-editorial";

export const landingEyebrowClass = "text-sm text-ink-muted";

export const landingDisplayClass =
  "font-serif font-medium tracking-tight leading-[1.06] text-white [text-wrap:balance]";

export const landingHeadingClass =
  "font-serif text-3xl font-medium tracking-tight text-navy-900 leading-tight sm:text-4xl md:text-5xl";

export const landingLeadClass =
  "text-base leading-relaxed text-ink-muted sm:text-lg";

export const landingCardClass =
  "rounded-lg border border-line bg-white";

export const landingCtaClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-navy-900 transition-colors duration-150 hover:bg-navy-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const landingCtaRedClass =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-red px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C81A20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export const landingGhostClass =
  "inline-flex h-11 items-center justify-center rounded-lg border border-white/30 bg-transparent px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10";

export const landingStackClass = cn(landingContainerClass, "space-y-8");
