import { cn } from "@/lib/utils";

/**
 * UniZ Institutional Design System — Harvard (my.harvard.edu) & MIT Standard
 *
 * Palette: Deep Navy (#0A2540 / #061B33) · Crisp White (#FFFFFF) · Slate (#F8FAFC)
 * Rules: Hairline (#E2E8F0 / #D8E0EA)
 * Typography: Cabin Condensed / Cabin
 */

export const EXAMCELL_HOME_GRADIENT =
  "linear-gradient(180deg, #061527 0%, #0A2540 100%)";

export const EXAMCELL_CTA = "#0A2540";
export const EXAMCELL_ERROR = "#DC2626";
export const EXAMCELL_FOOTER = "#F8FAFC";
export const EXAMCELL_DEEP = "#061B33";

/* ── Page & layout ───────────────────────────────────────────── */

export const portalPageClass =
  "min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0A2540] selection:text-white font-sans";

export const portalPageWrapClass = "px-5 py-7 md:px-10 md:py-9 space-y-7";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-[2px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(10,37,64,0.04)]";

export const portalCardHoverClass =
  "transition-colors duration-150 hover:border-[#94A3B8]";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-[2px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:p-5";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-[#F8FAFC] border-t border-[#E2E8F0] text-[#061B33] font-form";

export const portalNoticeClass =
  "rounded-[2px] border-l-[3px] border-l-[#0A2540] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#0F172A] font-sans";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass =
  "text-[11px] font-semibold tracking-[0.14em] uppercase text-[#475569] font-sans";

export const portalTitleClass =
  "text-[clamp(1.35rem,2.6vw,1.85rem)] font-bold tracking-[-0.01em] text-[#0A2540] leading-tight font-sans";

export const portalSubtitleClass =
  "text-[14px] text-[#475569] leading-relaxed font-sans";

export const portalSectionTitleClass =
  "text-[15px] font-bold tracking-[0.04em] uppercase text-[#0A2540] font-sans";

export const portalBodyClass =
  "text-[14px] font-normal text-[#1E293B] leading-relaxed font-sans";

export const portalMutedClass = "text-[12px] text-[#64748B] font-sans";

/* ── Buttons (Harvard/MIT Institutional Solid Navy & Hairline) ─ */

export const portalPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-6 rounded-[2px] bg-[#0A2540] text-white text-[13px] font-semibold tracking-[0.04em] font-form shadow-[0_1px_2px_rgba(10,37,64,0.12)] hover:bg-[#061B33] active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-5 rounded-[2px] border border-[#0A2540] bg-white text-[#0A2540] text-[13px] font-semibold tracking-[0.03em] font-form hover:bg-[#0A2540] hover:text-white active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-[2px] bg-white border border-[#CBD5E1] text-[#334155] text-[12px] font-semibold font-button hover:text-[#0A2540] hover:border-[#0A2540] hover:bg-[#F8FAFC] active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-[2px] bg-white border border-[#FECACA] text-[#DC2626] text-[12px] font-semibold font-button hover:bg-red-50 hover:border-[#DC2626]/40 active:opacity-95 transition-colors";

/* ── Forms (Cabin Condensed; 2px radius; crisp borders) ──────── */

export const portalLabelClass =
  "block text-[13px] font-semibold tracking-[0.01em] text-[#0A2540] mb-1.5 font-form";

export const portalInputClass =
  "w-full min-h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-[2px] text-[15px] font-medium text-[#0F172A] font-form placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/12 transition-all";

export const portalTextareaClass =
  "w-full min-h-[88px] px-3.5 py-3 bg-white border border-[#CBD5E1] rounded-[2px] text-[14px] font-normal text-[#0F172A] font-form placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/12 transition-colors resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 bg-white border border-[#CBD5E1] rounded-[2px] text-[13px] font-semibold text-[#0A2540] font-form appearance-none cursor-pointer focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/12 transition-colors disabled:opacity-50";

/* ── Navigation & chrome (Institutional Masthead & Sidebar) ──── */

export const portalHeaderClass =
  "sticky top-0 z-40 h-[56px] flex items-center bg-[#0A2540] border-b border-[#061527] text-white";

export const portalSidebarClass =
  "flex w-[240px] shrink-0 flex-col bg-[#F8FAFC] border-r border-[#E2E8F0] text-[#0A2540]";

export const portalSidebarItemClass =
  "flex w-full items-center gap-3 px-5 py-3 text-left text-[13.5px] font-medium text-[#334155] border-l-[3px] border-transparent transition-colors hover:bg-[#F1F5F9] hover:text-[#0A2540]";

export const portalSidebarItemActiveClass =
  "bg-white text-[#0A2540] font-semibold border-l-[3px] border-l-[#0A2540] shadow-[0_1px_2px_rgba(10,37,64,0.04)]";

export const portalLogoutPillClass =
  "mx-4 mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-[2px] bg-[#0A2540] px-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#061B33] transition-colors";

export const portalPageTitleClass =
  "mb-6 border-b border-[#E2E8F0] pb-3.5 text-left text-[18px] font-bold tracking-[-0.01em] text-[#0A2540] font-sans";

export const portalDefTableClass =
  "w-full border-collapse text-[13.5px] text-[#0F172A]";

export const portalDefLabelClass =
  "w-[38%] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.04em] text-[#475569]";

export const portalDefValueClass =
  "border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#0F172A]";

export const portalChoiceCardClass =
  "flex min-h-[120px] min-w-[180px] items-center justify-center border border-[#E2E8F0] rounded-[2px] bg-white px-6 py-8 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0A2540] shadow-[0_1px_3px_rgba(10,37,64,0.05)] hover:border-[#0A2540] transition-colors";

export const portalHeaderLightClass =
  "sticky top-0 z-40 h-[60px] flex items-center bg-white border-b border-[#E2E8F0]";

export const portalNavActiveClass = "bg-[#0A2540] text-white";

export const portalNavInactiveClass =
  "text-[#475569] hover:text-[#0A2540] hover:bg-[#F8FAFC]";

export const portalTabActiveClass =
  "text-[#0A2540] border-b-[2px] border-[#0A2540]";

export const portalTabInactiveClass =
  "text-[#64748B] hover:text-[#0A2540] border-b-[2px] border-transparent";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-[2px] border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0A2540]";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-[2px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#0A2540]";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-[2px] border border-[#E2E8F0] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#475569]";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-[#E2E8F0] rounded-[2px] shadow-[0_20px_50px_rgba(6,21,39,0.18)]";

export const portalModalTitleClass =
  "text-[18px] font-bold tracking-[-0.01em] text-[#0A2540] font-sans";

export const portalModalDescClass =
  "text-[13.5px] text-[#475569] leading-relaxed font-sans";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "w-10 h-10 rounded-[2px] bg-[#F8FAFC] text-[#0A2540] flex items-center justify-center border border-[#E2E8F0]";

/* ── Page interiors (section header + content) ───────────────── */

export const portalCanvasClass = "bg-white text-[#0F172A] font-sans";

export const portalPageHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between";

export const portalPageHeaderTitleClass = portalTitleClass;

export const portalPageHeaderSubtitleClass = cn(portalSubtitleClass, "mt-1 max-w-2xl");

export const portalToolbarClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-4";

export const portalTableWrapClass =
  "w-full overflow-x-auto border border-[#E2E8F0] bg-white rounded-[2px]";

export const portalTableClass = "w-full text-left border-collapse font-sans";

export const portalThClass =
  "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#475569] bg-[#F8FAFC] border-b border-[#E2E8F0] font-form";

export const portalTdClass =
  "px-4 py-3 text-[13.5px] text-[#0F172A] border-b border-[#E2E8F0] align-middle";

export const portalTrClass = "hover:bg-[#F8FAFC] transition-colors";

export const portalEmptyClass =
  "px-6 py-12 text-center text-[13.5px] text-[#64748B] font-sans";

export const portalStatStripClass =
  "flex flex-wrap gap-x-8 gap-y-3 border-b border-[#E2E8F0] pb-4";

export const portalStatItemClass = "min-w-[7rem]";

export const portalStatValueClass =
  "text-[22px] font-bold tabular-nums text-[#0A2540] leading-none font-sans";

export const portalStatLabelClass =
  "mt-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#64748B] font-form";
