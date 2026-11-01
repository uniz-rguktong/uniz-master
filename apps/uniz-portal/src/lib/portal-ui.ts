import { cn } from "@/lib/utils";

/**
 * UniZ portal design system.
 *
 * Palette: navy (#0A2540 / #021227), red accent (#EA2027), slate neutrals.
 * Surfaces: hairline borders (#E6EAF0), layered soft shadows, 12-16px radii.
 * Type: Inter with tight headings and tabular numbers for stats.
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
  "min-h-screen bg-[#F7F8FA] text-[#0F172A] selection:bg-[#0A2540] selection:text-white font-sans antialiased";

export const portalPageWrapClass = "px-4 py-8 md:px-10 md:py-10 space-y-8";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-2xl border border-[#E6EAF0] bg-white shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalCardHoverClass =
  "transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[#D5DCE6] hover:shadow-[0_0_0_1px_rgba(10,37,64,0.05),0_4px_8px_-2px_rgba(10,37,64,0.06),0_16px_32px_-12px_rgba(10,37,64,0.18)] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-xl border border-[#E6EAF0] bg-[#F7F8FA] p-4 md:p-6";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-white border-t border-[#E6EAF0] text-[#475569] font-sans";

export const portalNoticeClass =
  "rounded-xl border border-[#E6EAF0] bg-white px-4 py-3 text-[13px] text-[#0F172A] font-sans shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)] relative pl-5 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-[#EA2027]";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass =
  "text-[11px] font-semibold tracking-[0.08em] uppercase text-[#64748B] font-sans";

export const portalTitleClass =
  "text-[clamp(1.5rem,2.4vw,2rem)] font-semibold tracking-[-0.025em] text-[#0A2540] leading-[1.15] font-sans text-balance";

export const portalSubtitleClass =
  "text-[14px] md:text-[15px] text-[#64748B] leading-6 font-sans";

export const portalSectionTitleClass =
  "text-[13px] font-semibold tracking-[-0.005em] text-[#0A2540] font-sans";

export const portalBodyClass =
  "text-[14px] font-normal text-[#334155] leading-6 font-sans";

export const portalMutedClass = "text-[12px] text-[#64748B] font-sans";

/* ── Buttons (Harvard/MIT Institutional Solid Navy & Hairline) ─ */

export const portalPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-[#0A2540] text-white text-[14px] font-semibold tracking-[-0.005em] font-sans shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(2,18,39,0.3),0_6px_16px_-8px_rgba(10,37,64,0.6)] hover:bg-[#0D3154] active:bg-[#021227] active:scale-[0.98] transition-[background-color,transform,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-[#94A3B8] disabled:shadow-none disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl border border-[#E6EAF0] bg-white text-[#0A2540] text-[14px] font-semibold tracking-[-0.005em] font-sans shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)] hover:border-[#CBD5E1] hover:bg-[#F7F8FA] active:scale-[0.98] transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-transparent text-[#475569] text-[13px] font-semibold font-sans hover:text-[#0A2540] hover:bg-[#0A2540]/[0.05] active:bg-[#0A2540]/[0.08] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-white border border-[#EA2027]/25 text-[#C81A20] text-[13px] font-semibold font-sans hover:bg-[#EA2027] hover:border-[#EA2027] hover:text-white active:scale-[0.98] transition-[background-color,border-color,color,transform] duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA2027] focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0";

/* ── Forms (Cabin Condensed; 2px radius; crisp borders) ──────── */

export const portalLabelClass =
  "block text-[13px] font-medium text-[#334155] mb-2 font-sans";

export const portalInputClass =
  "w-full min-h-11 px-3.5 text-[15px] font-normal placeholder:text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] font-sans shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#CBD5E1] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/[0.08] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none disabled:bg-[#F7F8FA] disabled:text-[#64748B]";

export const portalTextareaClass =
  "w-full min-h-[96px] px-3.5 py-3 text-[14px] font-normal placeholder:text-[#64748B] bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] font-sans shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#CBD5E1] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/[0.08] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 text-[14px] font-medium appearance-none cursor-pointer bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] font-sans shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#CBD5E1] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/[0.08] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none disabled:opacity-50";

/* ── Navigation & chrome (Institutional Masthead & Sidebar) ──── */

export const portalHeaderClass =
  "sticky top-0 z-40 h-16 flex items-center bg-[#021227]/90 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08] text-white";

export const portalSidebarClass =
  "flex w-[248px] shrink-0 flex-col bg-white border-r border-[#E6EAF0] text-[#0A2540]";

export const portalSidebarItemClass =
  "group relative mx-3 flex w-[calc(100%-1.5rem)] min-h-11 items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium tracking-[-0.005em] text-[#475569] transition-[background-color,color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none hover:bg-[#0A2540]/[0.04] hover:text-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white [&_svg]:size-[18px] [&_svg]:shrink-0";

export const portalSidebarItemActiveClass =
  "bg-[#0A2540]/[0.06] !text-[#0A2540] font-semibold hover:!bg-[#0A2540]/[0.08] before:absolute before:-left-3 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-r-full before:bg-[#EA2027]";

export const portalLogoutPillClass =
  "mx-3 mb-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-white px-5 text-[13px] font-semibold text-[#475569] hover:border-[#EA2027]/30 hover:bg-[#EA2027]/[0.05] hover:text-[#C81A20] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const portalPageTitleClass =
  "mb-6 text-left text-[20px] md:text-[22px] font-semibold tracking-[-0.02em] text-[#0A2540] font-sans";

export const portalDefTableClass =
  "w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white text-[14px] text-[#0F172A] shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalDefLabelClass =
  "w-[38%] border-b border-[#EEF1F5] bg-white px-5 py-3.5 text-left text-[13px] font-medium text-[#64748B]";

export const portalDefValueClass =
  "border-b border-[#EEF1F5] bg-white px-5 py-3.5 text-[14px] font-medium text-[#0F172A] tabular-nums";

export const portalChoiceCardClass =
  "flex min-h-[120px] min-w-[180px] items-center justify-center rounded-2xl border border-[#E6EAF0] bg-white px-6 py-8 text-center text-[14px] font-semibold tracking-[-0.01em] text-[#0A2540] shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)] hover:border-[#CBD5E1] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const portalHeaderLightClass =
  "sticky top-0 z-40 h-16 flex items-center bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-b border-[#E6EAF0]";

export const portalNavActiveClass = "bg-[#0A2540] text-white";

export const portalNavInactiveClass =
  "text-[#475569] hover:text-[#0A2540] hover:bg-[#0A2540]/[0.04]";

export const portalTabActiveClass =
  "text-[#0A2540] border-b-[2px] border-[#0A2540]";

export const portalTabInactiveClass =
  "text-[#64748B] hover:text-[#0A2540] border-b-[2px] border-transparent hover:border-[#CBD5E1]";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 text-[12px] font-medium text-[#0A2540]";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0A2540] shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-full bg-[#0A2540]/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-[#334155]";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-[#E6EAF0] rounded-2xl shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_24px_64px_-16px_rgba(2,18,39,0.4)]";

export const portalModalTitleClass =
  "text-[18px] font-semibold tracking-[-0.02em] text-[#0A2540] font-sans";

export const portalModalDescClass =
  "text-[14px] text-[#64748B] leading-6 font-sans";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "size-10 rounded-xl bg-[#0A2540]/[0.05] text-[#0A2540] flex items-center justify-center ring-1 ring-inset ring-[#0A2540]/[0.08] [&_svg]:size-5";

/* ── Page interiors (section header + content) ───────────────── */

export const portalCanvasClass = "bg-white text-[#0F172A] font-sans";

export const portalPageHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between";

export const portalPageHeaderTitleClass = portalTitleClass;

export const portalPageHeaderSubtitleClass = cn(portalSubtitleClass, "mt-1 max-w-2xl");

export const portalToolbarClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#E6EAF0] bg-white p-3 shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalTableWrapClass =
  "w-full overflow-x-auto rounded-2xl border border-[#E6EAF0] bg-white shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalTableClass = "w-full text-left border-collapse font-sans";

export const portalThClass =
  "sticky top-0 z-[1] h-11 px-4 text-[12px] font-medium text-[#64748B] bg-[#F7F8FA] border-b border-[#E6EAF0] font-sans";

export const portalTdClass =
  "h-12 px-4 py-3 text-[14px] text-[#0F172A] border-b border-[#EEF1F5] align-middle tabular-nums";

export const portalTrClass = "transition-colors duration-150 motion-reduce:transition-none hover:bg-[#F7F8FA] [&:last-child>td]:border-b-0";

export const portalEmptyClass =
  "mx-auto my-4 flex max-w-md flex-col items-center gap-2 rounded-2xl border border-dashed border-[#D5DCE6] bg-white px-6 py-14 text-center text-[14px] leading-6 text-[#64748B] font-sans [&_svg]:mb-2 [&_svg]:size-10 [&_svg]:rounded-xl [&_svg]:bg-[#0A2540]/[0.05] [&_svg]:p-2.5 [&_svg]:text-[#0A2540]";

export const portalStatStripClass =
  "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4";

export const portalStatItemClass = "min-w-0 rounded-2xl border border-[#E6EAF0] bg-white p-4 md:p-5 shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)]";

export const portalStatValueClass =
  "text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A2540] leading-none font-sans";

export const portalStatLabelClass =
  "mt-2 text-[13px] font-medium text-[#64748B] font-sans";

/* ── Dashboard building blocks ───────────────────────────────── */

export const portalSectionHeaderClass =
  "flex items-end justify-between gap-4 border-b border-[#EEF1F5] pb-3";

export const portalQuickTileClass =
  "group relative flex min-h-[112px] flex-col justify-between gap-4 rounded-2xl border border-[#E6EAF0] bg-white p-4 md:p-5 text-left shadow-[0_0_0_1px_rgba(10,37,64,0.04),0_1px_2px_rgba(10,37,64,0.04),0_2px_6px_-2px_rgba(10,37,64,0.06)] transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_0_0_1px_rgba(10,37,64,0.05),0_4px_8px_-2px_rgba(10,37,64,0.06),0_16px_32px_-12px_rgba(10,37,64,0.18)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2";

export const portalIconSize = { sm: 16, md: 18, lg: 20 } as const;
