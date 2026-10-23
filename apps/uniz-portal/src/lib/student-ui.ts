import { cn } from "@/lib/utils";
import {
  portalCardClass,
  portalGhostButtonClass,
  portalHeaderClass,
  portalInsetPanelClass,
  portalNavActiveClass,
  portalNavInactiveClass,
  portalPageClass,
  portalPageWrapClass,
  portalPillClass,
  portalPrimaryButtonClass,
  portalSafeBottomClass,
  portalSectionGapClass,
  portalTabActiveClass,
  portalTabInactiveClass,
} from "@/lib/portal-ui";

/** Student portal shell — ExamCell institutional tokens. */

export const studentShellClass = cn(portalPageClass, "flex flex-col");

export const studentMainWrapClass = cn(
  portalPageWrapClass,
  "pb-32 md:pb-10 md:ml-28",
  portalSafeBottomClass,
);

export const studentMobileHeaderClass = cn(
  portalHeaderClass,
  "md:hidden px-6 justify-between",
);

export const studentDesktopHeaderClass = cn(
  portalHeaderClass,
  "hidden md:flex px-8 md:pl-36 justify-between",
);

export const studentLogoClass =
  "uniz-logo-wordmark text-xl md:text-2xl text-white";

export const studentCardClass = cn(portalCardClass, "p-4 md:p-5");

export const studentInfoGridClass =
  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4";

export const studentTabBarClass =
  "flex gap-6 md:gap-8 min-w-max border-b border-navy-200 overflow-x-auto no-scrollbar";

export const studentTabButtonActiveClass = cn(
  "pb-3 text-[11px] font-bold tracking-[0.14em] capitalize transition-colors relative font-sans",
  portalTabActiveClass,
);

export const studentTabButtonInactiveClass = cn(
  "pb-3 text-[11px] font-bold tracking-[0.14em] capitalize transition-colors font-sans",
  portalTabInactiveClass,
);

export const studentBadgeClass = cn(
  portalPillClass,
  "text-[10px] tracking-[0.12em] text-navy-900 font-bold",
);

export const studentEditButtonClass = cn(
  portalGhostButtonClass,
  "h-auto min-h-9 px-3.5 py-2 text-[11px] !w-auto",
);

export const studentSaveButtonClass = cn(
  portalPrimaryButtonClass,
  "flex-1 max-w-[160px] !w-auto py-2.5 text-xs",
);

export const studentCancelButtonClass = cn(
  portalGhostButtonClass,
  "flex-1 max-w-[140px] !w-auto py-2.5 text-xs",
);

export const studentNavActiveIconClass = cn(
  "flex h-11 w-11 items-center justify-center rounded-portal-sm transition-colors",
  portalNavActiveClass,
);

export const studentNavInactiveIconClass = cn(
  "flex h-11 w-11 items-center justify-center rounded-portal-sm text-navy-400 transition-colors",
  portalNavInactiveClass,
);

export const studentUpdatesPanelClass = cn(
  portalInsetPanelClass,
  "overflow-hidden p-0",
);

export const studentProfileSectionClass = cn(
  studentCardClass,
  portalSectionGapClass,
);
