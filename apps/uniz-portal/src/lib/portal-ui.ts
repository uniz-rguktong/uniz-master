import { cn } from "@/lib/utils";

/**
 * UniZ portal design system — navy + white institutional palette.
 * Used by student, admin, faculty, and auth surfaces (.portal-theme).
 *
 * Spacing rhythm: 4 / 8 / 12 / 16 / 24 / 32 (Tailwind 1–8)
 * Radii: portal-lg (12) · portal-xl (16) · portal-2xl (20)
 */

/* ── Page & layout ───────────────────────────────────────────── */

export const portalPageClass =
  "min-h-screen bg-white text-navy-900 selection:bg-navy-100 selection:text-navy-900";

export const portalPageWrapClass = "px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8";

export const portalSectionGapClass = "space-y-4 md:space-y-6";

export const portalSafeBottomClass = "pb-[max(1rem,env(safe-area-inset-bottom))]";

/* ── Surfaces ────────────────────────────────────────────────── */

export const portalCardClass =
  "rounded-portal-2xl border border-navy-200 bg-white shadow-whisper";

export const portalCardHoverClass =
  "transition-[border-color,box-shadow] duration-150 hover:border-navy-300 hover:shadow-whisper-md";

export const portalCardInteractiveClass = cn(portalCardClass, portalCardHoverClass);

export const portalInsetPanelClass =
  "rounded-portal-xl border border-navy-200 bg-navy-50/60 p-4 md:p-5";

export const portalBannerGradientClass = "bg-navy-900 text-white";

/* ── Typography ──────────────────────────────────────────────── */

export const portalEyebrowClass =
  "text-[12px] font-medium text-navy-500";

export const portalTitleClass =
  "text-[clamp(1.35rem,3vw,1.875rem)] font-semibold tracking-[-0.02em] text-navy-900 leading-tight";

export const portalSubtitleClass = "text-sm text-navy-500 leading-relaxed";

export const portalSectionTitleClass =
  "text-[15px] font-semibold tracking-[-0.01em] text-navy-900";

export const portalBodyClass = "text-[14px] font-medium text-navy-700 leading-relaxed";

export const portalMutedClass = "text-[12px] text-navy-400";

/* ── Buttons (min 44px touch targets) ──────────────────────── */

export const portalPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-lg bg-navy-900 text-white text-[13px] font-medium hover:bg-navy-800 active:scale-[0.98] transition-[color,background-color,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

export const portalSecondaryButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-lg border border-navy-900 bg-white text-navy-900 text-[13px] font-medium hover:bg-navy-900 hover:text-white active:scale-[0.98] transition-[color,background-color,border-color,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

export const portalGhostButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-white border border-navy-200 text-navy-600 text-[13px] font-medium hover:text-navy-900 hover:border-navy-300 hover:bg-navy-50 active:scale-[0.98] transition-[color,background-color,border-color,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

export const portalDangerButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg bg-white border border-navy-200 text-navy-500 text-[13px] font-medium hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 active:scale-[0.98] transition-[color,background-color,border-color,transform] duration-150";

/* ── Forms ───────────────────────────────────────────────────── */

export const portalLabelClass =
  "block text-[12px] font-medium text-navy-500 mb-1.5";

export const portalInputClass =
  "w-full min-h-11 px-3.5 bg-white border border-navy-200 rounded-lg text-[15px] font-medium text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-900/10 transition-[border-color,box-shadow] duration-150";

export const portalTextareaClass =
  "w-full min-h-[88px] px-3.5 py-3 bg-white border border-navy-200 rounded-lg text-[14px] font-medium text-navy-900 placeholder:text-navy-300 focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-900/10 transition-[border-color,box-shadow] duration-150 resize-none";

export const portalSelectClass =
  "w-full min-h-11 pl-3.5 pr-10 bg-white border border-navy-200 rounded-lg text-[13px] font-medium text-navy-900 appearance-none cursor-pointer focus:outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-900/10 transition-[border-color,box-shadow] duration-150 disabled:opacity-50";

/* ── Navigation & chrome ─────────────────────────────────────── */

export const portalHeaderClass =
  "sticky top-0 z-40 h-14 flex items-center bg-white border-b border-navy-200";

export const portalNavActiveClass =
  "bg-navy-900 text-white";

export const portalNavInactiveClass =
  "text-navy-400 hover:text-navy-700 hover:bg-navy-50";

export const portalTabActiveClass =
  "text-navy-900 border-b-2 border-navy-900";

export const portalTabInactiveClass =
  "text-navy-400 hover:text-navy-600 border-b-2 border-transparent";

/* ── Pills & badges ──────────────────────────────────────────── */

export const portalPillClass =
  "inline-flex items-center gap-1.5 rounded-md border border-navy-200 bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700";

export const portalLivePillClass =
  "inline-flex items-center gap-2 rounded-md border border-navy-200 bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-800";

export const portalChipClass =
  "inline-flex items-center gap-1.5 rounded-md border border-navy-200 bg-white px-2 py-0.5 text-[11px] font-medium text-navy-500";

/* ── Modals ──────────────────────────────────────────────────── */

export const portalModalShellClass =
  "overflow-hidden bg-white border border-navy-200 rounded-portal-2xl shadow-whisper-lg";

export const portalModalTitleClass =
  "text-[20px] font-semibold text-navy-900 tracking-[-0.02em]";

export const portalModalDescClass = "text-[13px] text-navy-500 leading-relaxed";

/* ── Utilities ─────────────────────────────────────────────── */

export const portalNumsClass = "tabular-nums [font-feature-settings:'tnum']";

export const portalIconTileClass =
  "w-10 h-10 rounded-portal-xl bg-navy-50 text-navy-700 flex items-center justify-center border border-navy-200";
