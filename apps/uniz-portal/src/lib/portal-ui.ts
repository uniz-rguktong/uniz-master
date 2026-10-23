import { cn } from "@/lib/utils";

/**
 * UniZ portal design system — ExamCell institutional (navy + flat surfaces).
 * Used by student, admin, faculty, and auth surfaces (.portal-theme).
 *
 * Spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32 (Tailwind 1–8)
 * Radii: portal-sm (2) forms · portal-lg (4) · portal-xl (6) · portal-2xl (8)
 * Chrome: 60px navy header · #eee footer · full-width navy CTAs
 */

/* ── Page & layout ───────────────────────────────────────────── */

export const portalPageClass =
  "min-h-screen bg-[#FAFAFA] text-navy-900 selection:bg-navy-200 selection:text-navy-900 font-sans";

export const portalPageWrapClass = "px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-portal-lg border border-navy-200 bg-white shadow-whisper";

export const portalCardHoverClass =
  "transition-colors duration-150 hover:border-navy-300";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-portal-lg border border-navy-200 bg-[#FAFAFA] p-4 md:p-5";

export const portalBannerGradientClass = "portal-banner-gradient text-white";

export const portalFooterClass =
  "bg-[#EEEEEE] border-t border-navy-200 text-navy-600 font-form";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass =
  "text-[10px] font-semibold tracking-[0.14em] uppercase text-navy-400 font-sans";

export const portalTitleClass =
  "text-[clamp(1.25rem,3vw,1.75rem)] font-semibold tracking-[-0.01em] text-navy-900 leading-tight font-sans";

export const portalSubtitleClass = "text-sm text-navy-500 leading-relaxed font-sans";

export const portalSectionTitleClass =
  "text-[15px] font-semibold tracking-[-0.01em] text-navy-900 font-sans";

export const portalBodyClass = "text-[14px] font-medium text-navy-700 leading-relaxed font-sans";

export const portalMutedClass = "text-[12px] text-navy-400 font-sans";

/* ── Buttons (min 44px touch targets; Nunito; full-width navy CTAs) ─ */

export const portalPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 w-full px-5 rounded-portal-sm bg-navy-900 text-white text-[14px] font-semibold tracking-tight font-button hover:bg-navy-800 active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 w-full px-5 rounded-portal-sm border border-navy-900 bg-white text-navy-900 text-[14px] font-bold font-button hover:bg-navy-900 hover:text-white active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-portal-sm bg-white border border-navy-200 text-navy-600 text-[13px] font-semibold font-button hover:text-navy-900 hover:border-navy-300 hover:bg-[#FAFAFA] active:opacity-95 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-portal-sm bg-white border border-navy-200 text-[#EA2027] text-[13px] font-semibold font-button hover:bg-red-50 hover:border-[#EA2027]/40 active:opacity-95 transition-colors";

/* ── Forms (Cabin; 2px radius) ───────────────────────────────── */

export const portalLabelClass =
  "block text-[11px] font-semibold tracking-[0.04em] text-navy-500 mb-1.5 font-form";

export const portalInputClass =
  "w-full min-h-11 px-3.5 bg-white border border-navy-200 rounded-portal-sm text-[15px] font-medium text-navy-900 font-form placeholder:text-navy-300 focus:outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-900/15 transition-colors";

export const portalTextareaClass =
  "w-full min-h-[88px] px-3.5 py-3 bg-white border border-navy-200 rounded-portal-sm text-[14px] font-medium text-navy-900 font-form placeholder:text-navy-300 focus:outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-900/15 transition-colors resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 bg-white border border-navy-200 rounded-portal-sm text-[13px] font-semibold text-navy-900 font-form appearance-none cursor-pointer focus:outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-900/15 transition-colors disabled:opacity-50";

/* ── Navigation & chrome (fixed 60px navy header) ────────────── */

export const portalHeaderClass =
  "sticky top-0 z-40 h-[60px] flex items-center portal-header-chrome text-white border-b border-[#021227]";

export const portalHeaderLightClass =
  "sticky top-0 z-40 h-[60px] flex items-center bg-white border-b border-navy-200";

export const portalNavActiveClass =
  "bg-navy-900 text-white";

export const portalNavInactiveClass =
  "text-navy-400 hover:text-navy-700 hover:bg-[#FAFAFA]";

export const portalTabActiveClass =
  "text-navy-900 border-b-[2px] border-navy-900";

export const portalTabInactiveClass =
  "text-navy-400 hover:text-navy-600 border-b-[2px] border-transparent";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-portal-sm border border-navy-200 bg-[#FAFAFA] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-navy-700";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-portal-sm border border-navy-200 bg-[#FAFAFA] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-navy-800";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-portal-sm border border-navy-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-navy-500";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-navy-200 rounded-portal-lg shadow-whisper-lg";

export const portalModalTitleClass =
  "text-[20px] font-semibold text-navy-900 tracking-[-0.01em] font-sans";

export const portalModalDescClass = "text-[13px] text-navy-500 leading-relaxed font-sans";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "w-10 h-10 rounded-portal-lg bg-[#FAFAFA] text-navy-700 flex items-center justify-center border border-navy-200";
