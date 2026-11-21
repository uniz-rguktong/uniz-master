import { cn } from "@/lib/utils";
import {
  portalCardClass,
  portalGhostButtonClass,
  portalHeaderClass,
  portalInsetPanelClass,
  portalNavActiveClass,
  portalPageClass,
  portalPageWrapClass,
  portalPillClass,
  portalPrimaryButtonClass,
  portalSafeBottomClass,
  portalSectionGapClass,
  portalTabActiveClass,
  portalTabInactiveClass,
} from "@/lib/portal-ui";

/** Student portal shell — extends shared portal tokens. */

export const studentShellClass = cn(portalPageClass, "flex min-h-screen flex-col");

export const studentMainWrapClass = cn(
  portalPageWrapClass,
  "pb-[calc(68px+16px+env(safe-area-inset-bottom))] min-[821px]:pb-10 min-[821px]:pl-0",
  portalSafeBottomClass,
);

export const studentMobileHeaderClass = cn(
  "flex h-[60px] items-center justify-between bg-navy-900 px-4 text-white min-[821px]:hidden",
);

export const studentDesktopHeaderClass = cn(
  portalHeaderClass,
  "hidden justify-end px-10 min-[821px]:flex",
);

export const studentLogoClass =
  "font-serif text-[18px] font-semibold leading-none tracking-[-0.01em] text-white";

export const studentCardClass = cn(portalCardClass, "p-6 min-[821px]:p-8");

export const studentInfoGridClass =
  "grid grid-cols-1 gap-4 md:grid-cols-2";

export const studentTabBarClass =
  "flex min-w-max gap-0 overflow-x-auto border-b border-border no-scrollbar";

export const studentTabButtonActiveClass = cn(
  "px-4 py-3 text-[15px] font-medium leading-[22px] transition-colors duration-150",
  portalTabActiveClass,
);

export const studentTabButtonInactiveClass = cn(
  "px-4 py-3 text-[15px] font-medium leading-[22px] transition-colors duration-150",
  portalTabInactiveClass,
);

export const studentBadgeClass = cn(portalPillClass, "text-text-2");

export const studentEditButtonClass = cn(
  portalGhostButtonClass,
  "h-9 min-h-9 px-4 text-dense",
);

export const studentSaveButtonClass = cn(portalPrimaryButtonClass, "max-w-[200px]");

export const studentCancelButtonClass = cn(portalGhostButtonClass, "max-w-[180px]");

export const studentNavActiveIconClass = cn(
  "flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-150",
  portalNavActiveClass,
);

export const studentNavInactiveIconClass =
  "flex h-7 w-14 items-center justify-center text-navy-300 transition-colors duration-150";

export const studentUpdatesPanelClass = cn(portalInsetPanelClass, "overflow-hidden p-0");

export const studentProfileSectionClass = cn(studentCardClass, portalSectionGapClass);
