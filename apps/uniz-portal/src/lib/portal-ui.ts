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
  "rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(10,37,64,0.05),0_1px_3px_rgba(10,37,64,0.04)]";

export const portalCardHoverClass =
  "transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[#D8E0EA] hover:shadow-[0_12px_32px_-16px_rgba(10,37,64,0.35)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:p-5";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-[#F8FAFC] border-t border-[#E2E8F0] text-[#061B33] font-form";

export const portalNoticeClass =
  "rounded-lg border border-[#E2E8F0] border-l-[3px] border-l-[#EA2027] bg-white px-4 py-3 text-[13px] text-[#0F172A] font-sans shadow-[0_1px_2px_rgba(10,37,64,0.05)]";

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
  "inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-md bg-[#0A2540] text-white text-[14px] font-semibold font-form shadow-[0_8px_20px_-10px_rgba(10,37,64,0.7)] hover:bg-[#021227] active:translate-y-px transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A2540] disabled:bg-[#5A7A94] disabled:shadow-none disabled:cursor-not-allowed";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md border border-[#E2E8F0] bg-white text-[#0A2540] text-[14px] font-semibold font-form shadow-[0_1px_2px_rgba(10,37,64,0.05)] hover:border-[#0A2540] hover:bg-[#F8FAFC] active:translate-y-px transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A2540] disabled:opacity-50 disabled:cursor-not-allowed";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-md bg-transparent text-[#475569] text-[13px] font-semibold font-button hover:text-[#0A2540] hover:bg-[#F1F5F9] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A2540] disabled:opacity-50 disabled:cursor-not-allowed";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-md bg-white border border-[#EA2027]/30 text-[#C81A20] text-[13px] font-semibold font-button hover:bg-[#EA2027] hover:border-[#EA2027] hover:text-white transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA2027]";

/* ── Forms (Cabin Condensed; 2px radius; crisp borders) ──────── */

export const portalLabelClass =
  "block text-[13px] font-semibold tracking-[0.01em] text-[#0A2540] mb-1.5 font-form";

export const portalInputClass =
  "w-full min-h-11 px-3.5 bg-white border border-[#E2E8F0] rounded-[4px] text-[15px] font-medium text-[#0F172A] font-form placeholder:text-[#64748B] placeholder:font-normal shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#D8E0EA] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/10 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] disabled:bg-[#F8FAFC] disabled:text-[#64748B]";

export const portalTextareaClass =
  "w-full min-h-[96px] px-3.5 py-3 bg-white border border-[#E2E8F0] rounded-[4px] text-[14px] font-normal text-[#0F172A] font-form placeholder:text-[#64748B] shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#D8E0EA] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/10 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 bg-white border border-[#E2E8F0] rounded-[4px] text-[14px] font-semibold text-[#0A2540] font-form appearance-none cursor-pointer shadow-[0_1px_2px_rgba(10,37,64,0.04)] hover:border-[#D8E0EA] focus:outline-none focus:border-[#0A2540] focus:ring-4 focus:ring-[#0A2540]/10 transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] disabled:opacity-50";

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
  "relative mb-6 border-b border-[#E2E8F0] pb-3.5 text-left text-[22px] font-bold tracking-[-0.01em] text-[#0A2540] font-sans after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-10 after:bg-[#EA2027]";

export const portalDefTableClass =
  "w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white text-[13.5px] text-[#0F172A] shadow-[0_1px_2px_rgba(10,37,64,0.05)]";

export const portalDefLabelClass =
  "w-[38%] border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#475569]";

export const portalDefValueClass =
  "border-b border-[#E2E8F0] bg-white px-4 py-3 text-[14px] font-medium text-[#0F172A]";

export const portalChoiceCardClass =
  "flex min-h-[120px] min-w-[180px] items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-6 py-8 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0A2540] shadow-[0_1px_2px_rgba(10,37,64,0.05)] hover:border-[#0A2540] hover:shadow-[0_12px_32px_-16px_rgba(10,37,64,0.35)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";

export const portalHeaderLightClass =
  "sticky top-0 z-40 h-[60px] flex items-center bg-white border-b border-[#E2E8F0]";

export const portalNavActiveClass = "bg-[#0A2540] text-white";

export const portalNavInactiveClass =
  "text-[#475569] hover:text-[#0A2540] hover:bg-[#F8FAFC]";

export const portalTabActiveClass =
  "text-[#0A2540] border-b-[2px] border-[#EA2027]";

export const portalTabInactiveClass =
  "text-[#64748B] hover:text-[#0A2540] border-b-[2px] border-transparent";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-full border border-[#D8E0EA] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0A2540]";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-full border border-[#D8E0EA] bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#0A2540] shadow-[0_1px_2px_rgba(10,37,64,0.05)]";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#475569]";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-[#E2E8F0] rounded-xl shadow-[0_24px_64px_-16px_rgba(2,18,39,0.45)]";

export const portalModalTitleClass =
  "text-[18px] font-bold tracking-[-0.01em] text-[#0A2540] font-sans";

export const portalModalDescClass =
  "text-[13.5px] text-[#475569] leading-relaxed font-sans";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "w-10 h-10 rounded-lg bg-[#0A2540]/[0.06] text-[#0A2540] flex items-center justify-center ring-1 ring-inset ring-[#0A2540]/10";

/* ── Page interiors (section header + content) ───────────────── */

export const portalCanvasClass = "bg-white text-[#0F172A] font-sans";

export const portalPageHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between";

export const portalPageHeaderTitleClass = portalTitleClass;

export const portalPageHeaderSubtitleClass = cn(portalSubtitleClass, "mt-1 max-w-2xl");

export const portalToolbarClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-[0_1px_2px_rgba(10,37,64,0.05)]";

export const portalTableWrapClass =
  "w-full overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(10,37,64,0.05)]";

export const portalTableClass = "w-full text-left border-collapse font-sans";

export const portalThClass =
  "sticky top-0 z-[1] h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#475569] bg-[#F8FAFC] border-b border-[#E2E8F0] font-form";

export const portalTdClass =
  "h-11 px-4 py-3 text-[14px] text-[#0F172A] border-b border-[#E2E8F0] align-middle";

export const portalTrClass = "transition-colors duration-150 hover:bg-[#F8FAFC] [&:last-child>td]:border-b-0";

export const portalEmptyClass =
  "mx-auto my-4 max-w-md rounded-lg border border-dashed border-[#D8E0EA] bg-[#F8FAFC] px-6 py-12 text-center text-[14px] text-[#475569] font-sans";

export const portalStatStripClass =
  "grid grid-cols-2 gap-3 sm:flex sm:flex-wrap";

export const portalStatItemClass = "min-w-[9rem] rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(10,37,64,0.05)] border-t-2 border-t-[#0A2540]";

export const portalStatValueClass =
  "text-[26px] font-bold tabular-nums text-[#0A2540] leading-none font-sans";

export const portalStatLabelClass =
  "mt-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#64748B] font-form";
