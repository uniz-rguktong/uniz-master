import { cn } from "@/lib/utils";
import {
  portalBannerGradientClass,
  portalCardClass,
  portalCardHoverClass,
  portalChipClass,
  portalDangerButtonClass,
  portalEyebrowClass,
  portalGhostButtonClass,
  portalHeaderClass,
  portalIconTileClass,
  portalInputClass,
  portalLabelClass,
  portalModalDescClass,
  portalModalShellClass,
  portalModalTitleClass,
  portalNumsClass,
  portalPageClass,
  portalPageWrapClass,
  portalPrimaryButtonClass,
  portalSectionTitleClass,
  portalSelectClass,
  portalSubtitleClass,
  portalTextareaClass,
  portalTitleClass,
} from "@/lib/portal-ui";

/* ============================================================
   UniZ Admin — extends portal-ui tokens
   Premium, minimal. Inspired by Linear / Vercel / Raycast.
   ============================================================ */

export const adminPageClass = cn(portalPageClass, "flex overflow-hidden");

export const adminSidebarOpenWidth = "w-[272px]";
export const adminSidebarClosedWidth = "w-[76px]";

export const adminSidebarClass = cn(
  "bg-white transition-[width] duration-300 ease-out z-50 flex flex-col h-screen",
  "border-r border-navy-200",
);

export const adminSidebarToggleClass =
  "absolute -right-3 top-7 bg-white border border-navy-200 rounded-full p-1 text-navy-400 hover:text-navy-900 hover:border-navy-300 shadow-whisper active:scale-95 transition-all z-50 hidden lg:flex items-center justify-center";

export const adminNavGroupLabelClass = portalEyebrowClass;

export const adminNavActiveClass =
  "bg-navy-900 text-white shadow-whisper-navy";

export const adminNavInactiveClass =
  "text-navy-500 hover:bg-navy-50 hover:text-navy-900";

export const adminNavIconActiveClass = "text-white";
export const adminNavIconInactiveClass =
  "text-navy-400 group-hover:text-navy-700";

export const adminHeaderClass = cn(portalHeaderClass, "px-6 md:px-10");

export const adminAvatarButtonClass =
  "w-9 h-9 rounded-full overflow-hidden bg-navy-50 ring-1 ring-navy-200 hover:ring-navy-300 transition-all active:scale-95 shrink-0";

export const adminAvatarFallbackClass =
  "w-full h-full flex items-center justify-center bg-navy-900 text-white font-semibold text-[13px]";

export const adminLogoutButtonClass =
  "w-9 h-9 rounded-full bg-white border border-navy-200 flex items-center justify-center text-navy-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95";

export const adminSearchInputClass = cn(
  portalInputClass,
  "h-10 py-2 bg-navy-50/70 border-transparent focus:bg-white",
);

export const adminCardClass = cn(portalCardClass, "border-navy-200/80");

export const adminCardHoverClass = portalCardHoverClass;

export const adminHubCardClass = cn(adminCardClass, adminCardHoverClass);

export const adminEyebrowClass = portalEyebrowClass;

export const adminTitleClass = cn(
  portalTitleClass,
  "text-[1.625rem] md:text-[1.875rem] tracking-[-0.03em] leading-none",
);

export const adminSubtitleClass = cn(
  portalSubtitleClass,
  "text-[13px] md:text-sm leading-snug",
);

export const adminSectionTitleClass = portalSectionTitleClass;

export const adminStatCardClass = cn(
  adminCardClass,
  "p-5 flex flex-col gap-4 transition-all duration-200 hover:border-navy-300",
);

export const adminStatValueClass =
  "text-[28px] font-semibold tracking-[-0.02em] text-navy-900 leading-none tabular-nums";

export const adminStatLabelClass = "text-[12.5px] font-medium text-navy-500";

export const adminIconTileClass = portalIconTileClass;

export const adminChipClass = portalChipClass;

export const adminNumsClass = portalNumsClass;

export const adminPageWrapClass = cn(portalPageWrapClass, "space-y-8 text-navy-900");

export const adminLabelClass = portalLabelClass;

export const adminInputClass = portalInputClass;

export const adminSelectClass = portalSelectClass;

export const adminTextareaClass = portalTextareaClass;

export const adminPrimaryButtonClass = portalPrimaryButtonClass;

export const adminGhostButtonClass = portalGhostButtonClass;

export const adminDangerButtonClass = portalDangerButtonClass;

export const adminSegmentWrapClass =
  "inline-flex items-center gap-1 p-1 rounded-portal-xl bg-navy-50 border border-navy-200/80";

export const adminSegmentActiveClass =
  "px-4 py-1.5 rounded-portal-lg text-[11px] font-semibold tracking-tight bg-white text-navy-900 shadow-whisper transition-all";

export const adminSegmentInactiveClass =
  "px-4 py-1.5 rounded-portal-lg text-[11px] font-semibold tracking-tight text-navy-500 hover:text-navy-900 transition-all";

export const adminModalShellClass = portalModalShellClass;

export const adminModalTitleClass = portalModalTitleClass;

export const adminModalDescClass = portalModalDescClass;

export const adminModalCloseClass =
  "absolute top-5 right-5 p-2 text-navy-400 hover:text-navy-900 hover:bg-navy-50 rounded-full transition-all z-10";

export const adminWarningBannerClass =
  "flex gap-3 p-4 rounded-portal-xl border border-amber-200/70 bg-amber-50/80";

export const adminWarningTitleClass =
  "text-[12px] font-semibold text-amber-900";

export const adminWarningTextClass = "text-[12px] text-amber-800/90 leading-relaxed";

export const adminDangerInputClass =
  "w-full min-h-11 px-3.5 bg-rose-50/60 border border-rose-200 rounded-portal-xl text-[13px] font-medium text-rose-800 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/10 transition-all";

/** Re-export for admin banners / notices */
export { portalBannerGradientClass as adminBannerGradientClass };
