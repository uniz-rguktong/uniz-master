import { cn } from "@/lib/utils";
import {
  portalBannerGradientClass,
  portalCardClass,
  portalCardHoverClass,
  portalChipClass,
  portalDangerButtonClass,
  portalEyebrowClass,
  portalGhostButtonClass,
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
   UniZ Admin — ExamCell institutional tokens (flat, no glass/mesh)
   ============================================================ */

export const adminPageClass = cn(
  portalPageClass,
  "flex overflow-hidden bg-white",
);

export const adminSidebarOpenWidth = "w-[272px]";
export const adminSidebarClosedWidth = "w-[76px]";

export const adminSidebarClass = cn(
  "portal-header-chrome text-white transition-[width] duration-300 ease-out z-50 flex flex-col h-screen",
  "border-r border-[#021227]",
);

export const adminSidebarToggleClass =
  "absolute -right-3 top-7 bg-white border border-[#EEEEEE] rounded-[1px] p-1 text-[#5A7A94] hover:text-[#0A2540] hover:border-[#9bb0c4] shadow-examcell active:scale-95 transition-colors z-50 hidden lg:flex items-center justify-center";

export const adminNavGroupLabelClass = cn(
  portalEyebrowClass,
  "!text-white/50",
);

export const adminNavActiveClass = "bg-white/15 text-white";

export const adminNavInactiveClass =
  "text-white/70 hover:bg-white/10 hover:text-white";

export const adminNavIconActiveClass = "text-white";
export const adminNavIconInactiveClass =
  "text-white/60 group-hover:text-white";

/** ExamCell 60px gradient content header */
export const adminHeaderClass = cn(
  "sticky top-0 z-40 h-[60px] flex items-center portal-header-chrome text-white px-6 md:px-10",
);

export const adminAvatarButtonClass =
  "w-9 h-9 rounded-[1px] overflow-hidden bg-white/10 ring-1 ring-white/25 hover:ring-white/40 transition-colors active:scale-95 shrink-0";

export const adminAvatarFallbackClass =
  "w-full h-full flex items-center justify-center bg-[#34495e] text-white font-bold text-[13px] font-sans uppercase";

export const adminLogoutButtonClass =
  "w-9 h-9 rounded-[1px] bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-[#EA2027] hover:border-[#EA2027] transition-colors active:scale-95";
export const adminSearchInputClass = cn(
  portalInputClass,
  "h-10 py-2 bg-[#FAFAFA] border-transparent focus:bg-white",
);

export const adminCardClass = cn(portalCardClass, "border-navy-200");

export const adminCardHoverClass = portalCardHoverClass;

export const adminHubCardClass = cn(adminCardClass, adminCardHoverClass);

export const adminEyebrowClass = portalEyebrowClass;

export const adminTitleClass = cn(
  portalTitleClass,
  "text-[1.625rem] md:text-[1.875rem] tracking-[-0.01em] leading-none",
);

export const adminSubtitleClass = cn(
  portalSubtitleClass,
  "text-[13px] md:text-sm leading-snug",
);

export const adminSectionTitleClass = portalSectionTitleClass;

export const adminStatCardClass = cn(
  adminCardClass,
  "p-5 flex flex-col gap-4 transition-colors duration-150 hover:border-navy-300",
);

export const adminStatValueClass =
  "text-[28px] font-semibold tracking-[-0.01em] text-navy-900 leading-none tabular-nums font-sans";

export const adminStatLabelClass = "text-[12.5px] font-medium text-navy-500 font-sans";

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
  "inline-flex items-center gap-1 p-1 rounded-portal-sm bg-[#FAFAFA] border border-navy-200";

export const adminSegmentActiveClass =
  "px-4 py-1.5 rounded-portal-sm text-[11px] font-semibold tracking-tight bg-white text-navy-900 shadow-whisper transition-colors font-button";

export const adminSegmentInactiveClass =
  "px-4 py-1.5 rounded-portal-sm text-[11px] font-semibold tracking-tight text-navy-500 hover:text-navy-900 transition-colors font-button";

export const adminModalShellClass = portalModalShellClass;

export const adminModalTitleClass = portalModalTitleClass;

export const adminModalDescClass = portalModalDescClass;

export const adminModalCloseClass =
  "absolute top-5 right-5 p-2 text-navy-400 hover:text-navy-900 hover:bg-[#FAFAFA] rounded-portal-sm transition-colors z-10";

export const adminWarningBannerClass =
  "flex gap-3 p-4 rounded-portal-sm border border-amber-200 bg-amber-50";

export const adminWarningTitleClass =
  "text-[12px] font-semibold text-amber-900";

export const adminWarningTextClass = "text-[12px] text-amber-800/90 leading-relaxed";

export const adminDangerInputClass =
  "w-full min-h-11 px-3.5 bg-red-50 border border-red-200 rounded-portal-sm text-[13px] font-medium text-red-800 font-form placeholder:text-red-300 focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-500/15 transition-colors";

/** Re-export for admin banners / notices */
export { portalBannerGradientClass as adminBannerGradientClass };
