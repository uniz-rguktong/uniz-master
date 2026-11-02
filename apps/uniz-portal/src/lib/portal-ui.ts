import { cn } from "@/lib/utils";

/**
 * UniZ portal design system.
 *
 * Palette: navy (#0A2540 / #021227), red accent (#EA2027), slate neutrals.
 * Same tokens as rguktong.in: navy #0A2540, navy-900 #061B33, line #E2E8F0, 8px controls.
 * Type: Cabin Condensed. Headings and buttons are medium weight.
 * Motion: 150-200ms, disabled under prefers-reduced-motion.
 */

export const EXAMCELL_HOME_GRADIENT =
  "linear-gradient(180deg, #061527 0%, #0A2540 100%)";

export const EXAMCELL_CTA = "#0A2540";
export const EXAMCELL_ERROR = "#DC2626";
export const EXAMCELL_FOOTER = "#F8FAFC";
export const EXAMCELL_DEEP = "#061B33";

/* ── Page & layout ───────────────────────────────────────────── */

export const portalPageClass =
  "campus-canvas min-h-screen bg-surface text-ink selection:bg-navy selection:text-white antialiased";

export const portalPageWrapClass = "px-4 py-8 md:px-10 md:py-10 space-y-8";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-lg border border-line bg-white shadow-[0_1px_2px_0_rgb(6_27_51/0.06)]";

export const portalCardHoverClass =
  "transition-colors duration-150 hover:bg-surface-2 motion-reduce:transition-none";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:p-6";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-white border-t border-[#E2E8F0] text-[#475569] font-sans";

export const portalNoticeClass =
  "rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[13px] text-[#0F172A] font-sans shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)] relative pl-5 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-[#EA2027]";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass = "text-sm text-ink-muted";

export const portalTitleClass =
  "font-serif text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium tracking-tight text-navy-900 leading-tight text-balance";

export const portalSubtitleClass =
  "text-[14px] md:text-[15px] text-[#64748B] leading-6 font-sans";

export const portalSectionTitleClass =
  "text-[13px] font-semibold tracking-[-0.005em] text-[#0A2540] font-sans";

export const portalBodyClass =
  "text-[14px] font-normal text-[#334155] leading-6 font-sans";

export const portalMutedClass = "text-[12px] text-[#64748B] font-sans";

/* ── Buttons (Harvard/MIT Institutional Solid Navy & Hairline) ─ */

export const portalPrimaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

export const portalSecondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-medium text-navy transition-colors duration-150 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

export const portalGhostButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-transparent px-4 text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0";

export const portalDangerButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-red/30 bg-white px-4 text-sm font-medium text-[#C81A20] transition-colors duration-150 hover:border-brand-red hover:bg-brand-red hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red [&_svg]:size-4 [&_svg]:shrink-0";

/* ── Forms ───────────────────────────────────────────────────── */

export const portalLabelClass = "mb-2 block text-sm font-medium text-ink";

export const portalInputClass =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-ink-subtle transition-colors duration-150 hover:border-navy-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:bg-surface disabled:text-ink-subtle";

export const portalTextareaClass =
  "w-full min-h-[96px] resize-none rounded-lg border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-ink-subtle transition-colors duration-150 hover:border-navy-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20";

export const portalSelectClass =
  "w-full min-h-11 cursor-pointer appearance-none rounded-lg border border-line bg-white pl-3.5 pr-10 text-sm font-medium text-ink transition-colors duration-150 hover:border-navy-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 disabled:opacity-50";

/* ── Navigation & chrome (Institutional Masthead & Sidebar) ──── */

export const portalHeaderClass =
  "sticky top-0 z-40 flex h-[68px] items-center border-b border-line bg-white text-navy-900";

export const portalSidebarClass =
  "flex w-[248px] shrink-0 flex-col border-r border-line bg-white text-navy-900";

export const portalSidebarItemClass =
  "group relative mx-3 flex min-h-10 w-[calc(100%-1.5rem)] items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy [&_svg]:size-[18px] [&_svg]:shrink-0";

export const portalSidebarItemActiveClass =
  "bg-surface-2 font-medium !text-navy hover:!bg-surface-2";

export const portalLogoutPillClass =
  "mx-3 mb-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink-muted transition-colors duration-150 hover:border-brand-red/40 hover:text-[#C81A20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export const portalPageTitleClass =
  "mb-6 text-left font-serif text-2xl font-medium tracking-tight text-navy-900 md:text-3xl";

export const portalDefTableClass =
  "w-full overflow-hidden rounded-lg border border-line bg-white text-sm text-ink";

export const portalDefLabelClass =
  "w-[38%] border-b border-line bg-white px-5 py-3.5 text-left text-sm font-medium text-ink-subtle";

export const portalDefValueClass =
  "border-b border-line bg-white px-5 py-3.5 text-sm font-medium text-ink tabular-nums";

export const portalChoiceCardClass =
  "flex min-h-[120px] min-w-[180px] items-center justify-center rounded-lg border border-line bg-white px-6 py-8 text-center text-sm font-medium text-navy transition-colors duration-150 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export const portalHeaderLightClass =
  "sticky top-0 z-40 flex h-[68px] items-center border-b border-line bg-white";

export const portalNavActiveClass = "bg-navy text-white";

export const portalNavInactiveClass =
  "text-ink-muted hover:bg-surface-2 hover:text-navy";

export const portalTabActiveClass = "border-b-2 border-navy text-navy";

export const portalTabInactiveClass =
  "border-b-2 border-transparent text-ink-subtle hover:border-line hover:text-navy";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-navy";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden rounded-lg border border-line bg-white shadow-[0_12px_32px_-12px_rgba(6,21,39,0.25)]";

export const portalModalTitleClass =
  "font-serif text-xl font-medium tracking-tight text-navy-900";

export const portalModalDescClass = "text-sm leading-6 text-ink-muted";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "flex size-10 items-center justify-center rounded-lg bg-surface-2 text-navy ring-1 ring-inset ring-line [&_svg]:size-5";

/* ── Page interiors (section header + content) ───────────────── */

export const portalCanvasClass = "bg-white font-sans text-ink";

export const portalPageHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between";

export const portalPageHeaderTitleClass = portalTitleClass;

export const portalPageHeaderSubtitleClass = cn(portalSubtitleClass, "mt-1 max-w-2xl");

export const portalToolbarClass =
  "flex flex-col gap-3 rounded-lg border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between";

export const portalTableWrapClass =
  "w-full overflow-x-auto rounded-lg border border-line bg-white";

export const portalTableClass = "w-full border-collapse text-left font-sans";

export const portalThClass =
  "sticky top-0 z-[1] h-11 border-b border-line bg-surface-2 px-4 text-sm font-medium text-ink-subtle";

export const portalTdClass =
  "h-12 border-b border-line px-4 py-3 align-middle text-sm text-ink tabular-nums";

export const portalTrClass =
  "transition-colors duration-150 hover:bg-surface-2 motion-reduce:transition-none [&:last-child>td]:border-b-0";

export const portalEmptyClass =
  "mx-auto my-4 flex max-w-md flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center text-sm leading-6 text-ink-muted";

export const portalStatStripClass = "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4";

export const portalStatItemClass =
  "min-w-0 rounded-lg border border-line bg-white p-4 md:p-5";

export const portalStatValueClass =
  "font-serif text-[28px] font-medium tabular-nums leading-none tracking-tight text-navy-900 md:text-[32px]";

export const portalStatLabelClass = "mt-2 text-sm font-medium text-ink-subtle";

export const portalSectionHeaderClass =
  "flex items-end justify-between gap-4 border-b border-line pb-3";

export const portalQuickTileClass =
  "group relative flex min-h-[112px] flex-col justify-between gap-4 rounded-lg border border-line bg-white p-4 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:p-5";

export const portalIconSize = { sm: 16, md: 18, lg: 20 } as const;
