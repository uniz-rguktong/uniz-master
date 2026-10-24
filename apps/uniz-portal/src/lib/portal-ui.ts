import { cn } from "@/lib/utils";

/**
 * UniZ portal design system — ExamCell-faithful
 * (https://examcell.rguktrkv.ac.in/)
 *
 * Fonts: Open Sans (UI) · Nunito (buttons) · Cabin (forms/footer)
 * Chrome: flat navy header · light-gray sidebar · white canvas · gray footer
 * No pure black, no zinc, no glass, no dock.
 */

export const EXAMCELL_HOME_GRADIENT =
  "radial-gradient(circle farthest-corner at 16.5% 37.3%, rgba(10,37,64,1) 0.1%, rgba(2,18,39,1) 90%)";

export const EXAMCELL_CTA = "#34495e";
export const EXAMCELL_ERROR = "#EA2027";
export const EXAMCELL_FOOTER = "#EEEEEE";
export const EXAMCELL_DEEP = "#061B33";

/* ── Page & layout ───────────────────────────────────────────── */

export const portalPageClass =
  "min-h-screen bg-white text-[#061B33] selection:bg-[#EEEEEE] selection:text-[#0A2540] font-sans";

export const portalPageWrapClass = "px-6 py-8 md:px-10 md:py-10 space-y-8";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-[2px] border border-[#E8E8E8] bg-white shadow-[0_8px_24px_rgba(10,37,64,0.06)]";

export const portalCardHoverClass =
  "transition-colors duration-150 hover:border-[#9bb0c4]";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-[2px] border border-[#EEEEEE] bg-[#FAFAFA] p-4 md:p-5";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-[#EEEEEE] border-t border-[#EEEEEE] text-[#061B33] font-form";

export const portalNoticeClass =
  "rounded-[10px] bg-[#EEEEEE] px-5 py-2.5 text-[13px] italic tracking-[1px] text-[#061B33] font-sans";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass =
  "text-[10px] font-bold tracking-[0.14em] uppercase text-[#5A7A94] font-sans";

export const portalTitleClass =
  "text-[clamp(1.25rem,3vw,1.75rem)] font-bold tracking-[0.04em] uppercase text-[#0A2540] leading-tight font-sans";

export const portalSubtitleClass =
  "text-sm text-[#5A7A94] leading-relaxed font-sans tracking-[0.5px]";

export const portalSectionTitleClass =
  "text-[15px] font-bold tracking-[0.08em] uppercase text-[#0A2540] font-sans";

export const portalBodyClass =
  "text-[14px] font-medium text-[#222222] leading-relaxed font-sans";

export const portalMutedClass = "text-[12px] text-[#5A7A94] font-sans tracking-[0.5px]";

/* ── Buttons (ExamCell #34495e CTA; Nunito/Cabin) ─────────────── */

export const portalPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-8 rounded-[1px] bg-[#34495e] text-white text-[13px] font-bold tracking-[2px] uppercase font-form shadow-examcell hover:bg-[#2c3e50] active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-5 rounded-[1px] border border-[#0A2540] bg-white text-[#0A2540] text-[13px] font-bold tracking-[1px] uppercase font-form hover:bg-[#0A2540] hover:text-white active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-[1px] bg-white border border-[#EEEEEE] text-[#5A7A94] text-[12px] font-semibold tracking-[0.5px] font-button hover:text-[#0A2540] hover:border-[#9bb0c4] hover:bg-[#FAFAFA] active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-[1px] bg-white border border-[#EEEEEE] text-[#EA2027] text-[12px] font-semibold font-button hover:bg-red-50 hover:border-[#EA2027]/40 active:opacity-95 transition-colors";

/* ── Forms (Cabin; 1–2px radius) ─────────────────────────────── */

export const portalLabelClass =
  "block text-[12px] font-bold tracking-[1px] uppercase text-[#0A2540] mb-1.5 font-form";

export const portalInputClass =
  "w-full min-h-11 px-3.5 bg-white border-0 rounded-[1px] text-[15px] font-bold tracking-[1px] text-[#0A2540] font-form placeholder:text-[#9bb0c4] placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20 transition-shadow";

export const portalTextareaClass =
  "w-full min-h-[88px] px-3.5 py-3 bg-[#FAFAFA] border-2 border-[#EEEEEE] rounded-[2px] text-[14px] font-medium text-[#0A2540] font-form placeholder:text-[#9bb0c4] focus:outline-none focus:border-[#0A2540] focus:bg-white transition-colors resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 bg-[#FAFAFA] border-2 border-[#EEEEEE] rounded-[2px] text-[13px] font-bold uppercase tracking-[1px] text-[#0A2540] font-form appearance-none cursor-pointer focus:outline-none focus:border-[#0A2540] focus:bg-white transition-colors disabled:opacity-50";

/* ── Navigation & chrome (fixed 60px gradient header) ────────── */

export const portalHeaderClass =
  "sticky top-0 z-40 h-[52px] flex items-center bg-[#0A2540] text-white";

export const portalSidebarClass =
  "flex w-[220px] shrink-0 flex-col bg-[#E8E8E8] text-[#0A2540]";

export const portalSidebarItemClass =
  "flex w-full items-center gap-3 px-5 py-3 text-left text-[13px] font-medium text-[#3d4f63] transition-colors hover:bg-white/70 hover:text-[#0A2540]";

export const portalSidebarItemActiveClass =
  "bg-white text-[#0A2540] font-semibold";

export const portalLogoutPillClass =
  "mx-4 mb-6 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0A2540] px-5 text-[12px] font-bold uppercase tracking-[1.5px] text-white hover:bg-[#021227] transition-colors";

export const portalPageTitleClass =
  "mb-6 border-b border-[#E8E8E8] pb-3 text-center text-[15px] font-bold uppercase tracking-[0.12em] text-[#0A2540] font-sans";

export const portalDefTableClass =
  "w-full border-collapse text-[13px] text-[#0A2540]";

export const portalDefLabelClass =
  "w-[38%] border border-[#E4E4E4] bg-[#E8E8E8] px-3 py-2 text-left text-[12px] font-bold uppercase tracking-[0.04em] text-[#0A2540]";

export const portalDefValueClass =
  "border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#222222]";

export const portalChoiceCardClass =
  "flex min-h-[120px] min-w-[180px] items-center justify-center bg-white px-6 py-8 text-center text-[13px] font-bold uppercase tracking-[0.08em] text-[#0A2540] shadow-[0_10px_28px_rgba(10,37,64,0.08)]";

export const portalHeaderLightClass =
  "sticky top-0 z-40 h-[60px] flex items-center bg-white border-b border-[#EEEEEE]";

export const portalNavActiveClass = "bg-[#0A2540] text-white";

export const portalNavInactiveClass =
  "text-[#5A7A94] hover:text-[#0A2540] hover:bg-[#FAFAFA]";

export const portalTabActiveClass =
  "text-[#0A2540] border-b-[2px] border-[#0A2540]";

export const portalTabInactiveClass =
  "text-[#5A7A94] hover:text-[#0A2540] border-b-[2px] border-transparent";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-[2px] border border-[#EEEEEE] bg-[#FAFAFA] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-[#0A2540]";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-[2px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-[#0A2540]";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-[2px] border border-[#EEEEEE] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#5A7A94]";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-[#EEEEEE] rounded-[2px] shadow-examcell-lg";

export const portalModalTitleClass =
  "text-[18px] font-bold uppercase tracking-[2px] text-[#0A2540] font-sans";

export const portalModalDescClass =
  "text-[13px] text-[#5A7A94] leading-relaxed font-sans tracking-[0.5px]";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "w-10 h-10 rounded-[2px] bg-[#FAFAFA] text-[#0A2540] flex items-center justify-center border border-[#EEEEEE]";

/* ── Page interiors (section header + content, not card decks) ─ */

export const portalCanvasClass = "bg-white text-[#061B33] font-sans";

export const portalPageHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between";

export const portalPageHeaderTitleClass = portalTitleClass;

export const portalPageHeaderSubtitleClass = cn(portalSubtitleClass, "mt-1 max-w-2xl");

export const portalToolbarClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEEEEE] pb-4";

export const portalTableWrapClass =
  "w-full overflow-x-auto border border-[#EEEEEE] bg-white rounded-[2px]";

export const portalTableClass = "w-full text-left border-collapse font-sans";

export const portalThClass =
  "px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5A7A94] bg-[#FAFAFA] border-b border-[#EEEEEE] font-form";

export const portalTdClass =
  "px-4 py-3 text-[13px] text-[#222222] border-b border-[#EEEEEE] align-middle";

export const portalTrClass = "hover:bg-[#FAFAFA] transition-colors";

export const portalEmptyClass =
  "px-6 py-12 text-center text-[13px] text-[#5A7A94] font-sans tracking-[0.4px]";

export const portalStatStripClass =
  "flex flex-wrap gap-x-8 gap-y-3 border-b border-[#EEEEEE] pb-4";

export const portalStatItemClass = "min-w-[7rem]";

export const portalStatValueClass =
  "text-[22px] font-bold tabular-nums text-[#0A2540] leading-none font-sans";

export const portalStatLabelClass =
  "mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5A7A94] font-form";
