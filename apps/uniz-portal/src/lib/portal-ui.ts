import { cn } from "@/lib/utils";

/**
 * Portal surfaces. Colours come from the light U2 semantic tokens in index.css.
 * Radii: sm 8, md 12, lg 16, xl 24, full.
 */

export const portalPageClass =
  "min-h-screen bg-bg text-text selection:bg-navy-100 selection:text-navy-900";

export const portalPageWrapClass =
  "mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 md:px-6 md:py-8 min-[821px]:px-10";

export const portalSectionGapClass = "space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

export const portalCardClass =
  "rounded-xl border border-border bg-panel text-text";

export const portalCardHoverClass =
  "transition-[border-color,background-color] duration-150 ease-out hover:border-border-strong";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-lg border border-border bg-tile p-4 md:p-6";

export const portalBannerGradientClass = "bg-navy-900 text-white";

export const portalEyebrowClass = "text-small font-medium text-text-2";

export const portalTitleClass =
  "font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head min-[821px]:text-page min-[821px]:leading-[40px]";

export const portalSubtitleClass = "text-body leading-6 text-text-2";

export const portalSectionTitleClass =
  "font-sans text-h3 font-semibold tracking-[-0.01em] text-head";

export const portalBodyClass = "text-body font-normal leading-6 text-text";

export const portalMutedClass = "text-caption text-text-3";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-[0.45]";

export const portalPrimaryButtonClass = cn(
  buttonBase,
  "h-11 min-h-11 bg-primary px-6 text-[15px] leading-[22px] text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
);

export const portalSecondaryButtonClass = cn(
  buttonBase,
  "h-11 min-h-11 border border-head bg-transparent px-6 text-[15px] leading-[22px] text-head hover:bg-tint",
);

export const portalGhostButtonClass = cn(
  buttonBase,
  "h-11 min-h-11 bg-transparent px-4 text-[15px] leading-[22px] text-text-2 hover:bg-tint",
);

export const portalDangerButtonClass = cn(
  buttonBase,
  "h-11 min-h-11 bg-error px-6 text-[15px] leading-[22px] text-on-error hover:opacity-90",
);

export const portalLabelClass = "mb-2 block text-dense font-medium text-text";

export const portalInputClass =
  "h-11 min-h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-text placeholder:text-text-3 transition-[border-color,box-shadow] duration-150 focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring focus:shadow-[0_0_0_3px_var(--ring-soft)] disabled:opacity-[0.45] dark:focus:border-navy-300 max-[639px]:h-12";

export const portalTextareaClass =
  "min-h-[120px] w-full resize-y rounded-md border border-border-strong bg-surface px-4 py-3 text-body text-text placeholder:text-text-3 transition-[border-color,box-shadow] duration-150 focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring focus:shadow-[0_0_0_3px_var(--ring-soft)] dark:focus:border-navy-300";

export const portalSelectClass =
  "h-11 min-h-11 w-full cursor-pointer appearance-none rounded-md border border-border-strong bg-surface pl-4 pr-10 text-body text-text transition-[border-color,box-shadow] duration-150 focus:border-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring focus:shadow-[0_0_0_3px_var(--ring-soft)] disabled:opacity-[0.45] dark:focus:border-navy-300 max-[639px]:h-12";

export const portalHeaderClass =
  "sticky top-0 z-40 flex h-16 items-center border-b border-border bg-bg";

export const portalNavActiveClass = "bg-navy-800 text-white";

export const portalNavInactiveClass = "text-navy-300 hover:bg-white/5 hover:text-white";

export const portalTabActiveClass = "border-b-2 border-head text-head";

export const portalTabInactiveClass =
  "border-b-2 border-transparent text-text-2 hover:text-head";

export const portalPillClass =
  "inline-flex h-6 items-center gap-1.5 rounded-full bg-tint px-2.5 text-small font-medium text-text-2";

export const portalLivePillClass = portalPillClass;

export const portalChipClass =
  "inline-flex h-6 items-center gap-1.5 rounded-sm bg-tint px-2 text-caption font-medium text-text-2";

export const portalModalShellClass =
  "rounded-xl border border-border bg-surface text-text shadow-lg dark:border-border-strong dark:shadow-none";

export const portalModalTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

export const portalModalDescClass = "text-body leading-6 text-text-2";

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "inline-flex items-center justify-center text-accent";
