import { cn } from "@/lib/utils";

/** Page shell — zinc-50 base with frosted selection */
export const adminPageClass =
  "flex min-h-screen bg-zinc-50 relative overflow-hidden text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900";

export const adminSidebarOpenWidth = "w-[315px]";
export const adminSidebarClosedWidth = "w-24";

export const adminSidebarClass = cn(
  "bg-white/80 backdrop-blur-xl transition-all duration-300 z-50 flex flex-col h-screen border-r border-zinc-100/80",
  "shadow-[4px_0_24px_rgba(0,0,0,0.03)]",
);

export const adminSidebarToggleClass =
  "absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-zinc-200/80 rounded-full p-1.5 shadow-md text-zinc-400 hover:text-zinc-600 hover:scale-110 active:scale-95 transition-all z-50 hidden lg:block";

export const adminNavGroupLabelClass =
  "px-4 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5 opacity-80";

export const adminNavActiveClass =
  "bg-zinc-950 text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]";

export const adminNavInactiveClass =
  "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900";

export const adminNavIconActiveClass = "text-white";
export const adminNavIconInactiveClass =
  "text-zinc-400 group-hover:text-zinc-600";

export const adminHeaderClass =
  "sticky top-0 z-40 px-6 md:px-10 py-4 md:py-5 flex items-center bg-white/80 backdrop-blur-md border-b border-zinc-100/80";

export const adminAvatarButtonClass =
  "w-12 h-12 rounded-full overflow-hidden bg-zinc-200 border-[3px] border-white hover:ring-2 hover:ring-zinc-950 transition-all active:scale-95 shrink-0 shadow-md ring-1 ring-zinc-200/50";

export const adminAvatarFallbackClass =
  "w-full h-full flex items-center justify-center bg-zinc-950 text-white font-bold text-sm";

export const adminLogoutButtonClass =
  "w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-sm border border-zinc-200/80 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 shadow-sm";

export const adminSearchInputClass =
  "w-full bg-zinc-50/80 border border-zinc-200/60 rounded-xl py-2 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all font-medium";

export const adminCardClass =
  "rounded-2xl border border-zinc-100/80 bg-white/80 backdrop-blur-sm shadow-sm";

export const adminCardHoverClass =
  "hover:border-zinc-200 hover:bg-white hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300";

export const adminHubCardClass = cn(adminCardClass, adminCardHoverClass);
