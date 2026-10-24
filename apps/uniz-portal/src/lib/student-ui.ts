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
  portalPageHeaderClass,
  portalToolbarClass,
  portalTableWrapClass,
  portalThClass,
  portalTdClass,
  portalEmptyClass,
  portalStatStripClass,
  portalCanvasClass,
  portalSidebarClass,
  portalSidebarItemClass,
  portalSidebarItemActiveClass,
  portalLogoutPillClass,
  portalPageTitleClass,
  portalDefTableClass,
  portalDefLabelClass,
  portalDefValueClass,
  portalChoiceCardClass,
} from "@/lib/portal-ui";

export {
  portalPageHeaderClass as studentPageHeaderClass,
  portalToolbarClass as studentToolbarClass,
  portalTableWrapClass as studentTableWrapClass,
  portalThClass as studentThClass,
  portalTdClass as studentTdClass,
  portalEmptyClass as studentEmptyClass,
  portalStatStripClass as studentStatStripClass,
  portalCanvasClass as studentCanvasClass,
};

/** Student portal shell — ExamCell institutional tokens. */

export const studentShellClass = cn(portalPageClass, "flex flex-col bg-white");

export const studentMainWrapClass = cn(
  portalPageWrapClass,
  "bg-white",
  portalSafeBottomClass,
);

export const studentSidebarClass = portalSidebarClass;
export const studentSidebarItemClass = portalSidebarItemClass;
export const studentSidebarItemActiveClass = portalSidebarItemActiveClass;
export const studentLogoutPillClass = portalLogoutPillClass;
export const studentPageTitleClass = portalPageTitleClass;
export const studentDefTableClass = portalDefTableClass;
export const studentDefLabelClass = portalDefLabelClass;
export const studentDefValueClass = portalDefValueClass;
export const studentChoiceCardClass = portalChoiceCardClass;

export const studentMobileHeaderClass = cn(
  portalHeaderClass,
  "md:hidden px-6 justify-between",
);

export const studentDesktopHeaderClass = cn(
  portalHeaderClass,
  "hidden md:flex px-8 md:pl-36 justify-between",
);

export const studentLogoClass =
  "uniz-logo-wordmark text-xl md:text-2xl !text-white tracking-[2px]";

export const studentCardClass = cn(portalCardClass, "p-4 md:p-5");

export const studentInfoGridClass =
  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4";

export const studentTabBarClass =
  "flex gap-6 md:gap-8 min-w-max border-b border-[#EEEEEE] overflow-x-auto no-scrollbar";

export const studentTabButtonActiveClass = cn(
  "pb-3 text-[11px] font-bold tracking-[0.14em] uppercase transition-colors relative font-sans",
  portalTabActiveClass,
);

export const studentTabButtonInactiveClass = cn(
  "pb-3 text-[11px] font-bold tracking-[0.14em] uppercase transition-colors font-sans",
  portalTabInactiveClass,
);

export const studentBadgeClass = cn(
  portalPillClass,
  "text-[10px] tracking-[0.12em] text-[#0A2540] font-bold",
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
  "flex h-11 w-11 items-center justify-center rounded-[2px] transition-colors",
  portalNavActiveClass,
);

export const studentNavInactiveIconClass = cn(
  "flex h-11 w-11 items-center justify-center rounded-[2px] text-[#5A7A94] transition-colors",
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

export const studentInsetPanelClass = portalInsetPanelClass;

export const studentSectionGapClass = portalSectionGapClass;
