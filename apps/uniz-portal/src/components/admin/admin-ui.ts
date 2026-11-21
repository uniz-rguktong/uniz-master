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

/* UniZ admin chrome. Extends portal-ui. Sidebar is 248px, collapsed rail 72px. */

export const adminPageClass = cn(portalPageClass, "flex overflow-hidden");

export const adminSidebarOpenWidth = "w-[248px]";
export const adminSidebarClosedWidth = "w-[72px]";

export const adminSidebarClass = cn(
  "z-50 flex h-screen flex-col border-r bg-navy-900 text-navy-300 transition-[width] duration-150 ease-out",
  "border-[var(--sb-border)]",
);

export const adminSidebarToggleClass =
  "absolute -right-3 top-7 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--sb-div)] bg-navy-900 text-navy-300 hover:text-white min-[821px]:flex";

export const adminNavGroupLabelClass =
  "px-3 pb-2 pt-6 text-small font-medium text-navy-300";

export const adminNavActiveClass = "bg-navy-800 font-semibold text-white";

export const adminNavInactiveClass = "font-medium text-navy-300 hover:bg-white/[0.06] hover:text-white";

export const adminNavIconActiveClass = "text-white";
export const adminNavIconInactiveClass = "text-navy-300 group-hover:text-white";

export const adminHeaderClass = cn(portalHeaderClass, "px-4 min-[821px]:px-10");

export const adminAvatarButtonClass =
  "h-9 w-9 shrink-0 overflow-hidden rounded-full bg-navy-100 text-navy-900 transition-opacity duration-150 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-surface-2 dark:text-text";

export const adminAvatarFallbackClass =
  "flex h-full w-full items-center justify-center bg-navy-100 text-[13px] font-semibold text-navy-900 dark:bg-surface-2 dark:text-text";

export const adminLogoutButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full text-navy-300 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const adminSearchInputClass = cn(
  portalInputClass,
  "h-10 min-h-10 bg-surface-2",
);

export const adminCardClass = portalCardClass;

export const adminCardHoverClass = portalCardHoverClass;

export const adminHubCardClass = cn(adminCardClass, adminCardHoverClass);

export const adminEyebrowClass = portalEyebrowClass;

export const adminTitleClass = portalTitleClass;

export const adminSubtitleClass = portalSubtitleClass;

export const adminSectionTitleClass = portalSectionTitleClass;

export const adminStatCardClass = cn(
  "flex min-h-[148px] flex-col gap-3 rounded-lg border border-border bg-tile p-6",
);

export const adminStatValueClass =
  "font-sans text-[28px] font-semibold leading-9 tracking-[-0.01em] text-head tabular-nums";

export const adminStatLabelClass = "text-dense font-medium text-text-2";

export const adminIconTileClass = portalIconTileClass;

export const adminChipClass = portalChipClass;

export const adminNumsClass = portalNumsClass;

export const adminPageWrapClass = cn(portalPageWrapClass, "text-text");

export const adminLabelClass = portalLabelClass;

export const adminInputClass = portalInputClass;

export const adminSelectClass = portalSelectClass;

export const adminTextareaClass = portalTextareaClass;

export const adminPrimaryButtonClass = portalPrimaryButtonClass;

export const adminGhostButtonClass = portalGhostButtonClass;

export const adminDangerButtonClass = portalDangerButtonClass;

export const adminSegmentWrapClass = "flex items-center gap-0 overflow-x-auto border-b border-border";

export const adminSegmentActiveClass =
  "-mb-px border-b-2 border-head px-4 py-3 text-[15px] font-medium leading-[22px] text-head";

export const adminSegmentInactiveClass =
  "border-b-2 border-transparent px-4 py-3 text-[15px] font-medium leading-[22px] text-text-2 hover:text-head";

export const adminModalShellClass = portalModalShellClass;

export const adminModalTitleClass = portalModalTitleClass;

export const adminModalDescClass = portalModalDescClass;

export const adminModalCloseClass =
  "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-2 transition-colors duration-150 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const adminWarningBannerClass =
  "flex gap-3 rounded-lg p-4 px-5 text-warning [background:color-mix(in_srgb,var(--warning)_8%,var(--surface))]";

export const adminWarningTitleClass = "text-dense font-medium text-warning";

export const adminWarningTextClass = "text-small leading-[18px] text-warning";

export const adminDangerInputClass =
  "h-11 min-h-11 w-full rounded-md border border-error bg-surface px-4 text-body text-error placeholder:text-text-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring";

export { portalBannerGradientClass as adminBannerGradientClass };
