import { cn } from "@/lib/utils";

/* ============================================================
   UniZ Admin — Design System
   Premium, minimal, monochrome. Inspired by Linear / Vercel /
   Raycast. Hairline borders, soft elevation, restrained type.
   ============================================================ */

/** Page shell — soft paper base, ink text, ink selection. */
export const adminPageClass =
  "flex min-h-screen bg-[#fafafa] relative overflow-hidden text-zinc-900 selection:bg-zinc-900 selection:text-white";

export const adminSidebarOpenWidth = "w-[272px]";
export const adminSidebarClosedWidth = "w-[76px]";

/** Sidebar — crisp white rail, single hairline divider, no heavy glow. */
export const adminSidebarClass = cn(
  "bg-white transition-[width] duration-300 ease-out z-50 flex flex-col h-screen",
  "border-r border-zinc-200/70",
);

export const adminSidebarToggleClass =
  "absolute -right-3 top-7 bg-white border border-zinc-200 rounded-full p-1 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 shadow-[0_1px_2px_rgba(10,10,10,0.06)] active:scale-95 transition-all z-50 hidden lg:flex items-center justify-center";

/** Group label — small, quiet, wide tracking (no heavy weight). */
export const adminNavGroupLabelClass =
  "px-3 mb-1.5 text-[10px] font-semibold text-zinc-400 tracking-[0.02em]";

/** Active nav — uniZ maroon, paper text, whisper-soft shadow. */
export const adminNavActiveClass =
  "bg-[#800000] text-white shadow-[0_1px_2px_rgba(128,0,0,0.22)]";

export const adminNavInactiveClass =
  "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900";

export const adminNavIconActiveClass = "text-white";
export const adminNavIconInactiveClass =
  "text-zinc-400 group-hover:text-zinc-700";

/** Header — flush paper bar, single hairline base. */
export const adminHeaderClass =
  "sticky top-0 z-40 px-6 md:px-10 h-16 flex items-center bg-[#fafafa]/85 backdrop-blur-md border-b border-zinc-200/60";

export const adminAvatarButtonClass =
  "w-9 h-9 rounded-full overflow-hidden bg-zinc-100 ring-1 ring-zinc-200/70 hover:ring-zinc-300 transition-all active:scale-95 shrink-0";

export const adminAvatarFallbackClass =
  "w-full h-full flex items-center justify-center bg-[#800000] text-white font-semibold text-[13px]";

export const adminLogoutButtonClass =
  "w-9 h-9 rounded-full bg-white border border-zinc-200/70 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95";

export const adminSearchInputClass =
  "w-full bg-zinc-100/70 border border-transparent rounded-lg py-2 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5 transition-all font-medium";

/** Card — paper surface, hairline border, whisper shadow. */
export const adminCardClass =
  "rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgba(10,10,10,0.03)]";

/** Interactive card — subtle lift + border darken on hover. */
export const adminCardHoverClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_4px_16px_-6px_rgba(10,10,10,0.10)]";

export const adminHubCardClass = cn(adminCardClass, adminCardHoverClass);

/* ── Reusable primitives ─────────────────────────────────────── */

/** Eyebrow / kicker — quiet uppercase label above a heading. */
export const adminEyebrowClass =
  "inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 tracking-[0.02em]";

/** Page / section title — tight, medium weight, no shout. */
export const adminTitleClass =
  "text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-zinc-900 leading-tight";

export const adminSubtitleClass = "text-sm text-zinc-500 leading-relaxed";

/** Section header inside cards. */
export const adminSectionTitleClass =
  "text-[15px] font-semibold tracking-[-0.01em] text-zinc-900";

/** KPI / stat card. */
export const adminStatCardClass = cn(
  adminCardClass,
  "p-5 flex flex-col gap-4 transition-all duration-200 hover:border-zinc-300",
);

export const adminStatValueClass =
  "text-[28px] font-semibold tracking-[-0.02em] text-zinc-900 leading-none tabular-nums";

export const adminStatLabelClass = "text-[12.5px] font-medium text-zinc-500";

/** Icon tile — neutral, inset feel. */
export const adminIconTileClass =
  "w-9 h-9 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center ring-1 ring-inset ring-zinc-900/5";

/** Pill / chip — quiet status badge. */
export const adminChipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500";

/** Tabular numbers helper. */
export const adminNumsClass = "tabular-nums [font-feature-settings:'tnum']";

/* ── Layout + form primitives (shared across every section) ───── */

/** Standard section page wrapper — consistent padding + rhythm. */
export const adminPageWrapClass = "p-6 md:p-8 space-y-8 text-zinc-900";

/** Field label — quiet, restrained (replaces loud font-semibold labels). */
export const adminLabelClass =
  "block text-[10px] font-semibold tracking-[0.02em] text-zinc-400";

/** Text input. */
export const adminInputClass =
  "w-full h-11 px-3.5 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all";

/** Select (pair with a ChevronDown overlay). */
export const adminSelectClass =
  "w-full h-11 pl-3.5 pr-10 bg-white border border-zinc-200 rounded-xl text-[12px] font-semibold tracking-tight text-zinc-900 appearance-none cursor-pointer focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all disabled:opacity-50";

/** Textarea. */
export const adminTextareaClass =
  "w-full px-3.5 py-3 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 transition-all resize-none";

/** Primary (ink) button. */
export const adminPrimaryButtonClass =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-zinc-900 text-white text-[12px] font-semibold tracking-tight shadow-[0_1px_2px_rgba(10,10,10,0.16)] hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed";

/** Secondary (paper) button. */
export const adminGhostButtonClass =
  "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:text-zinc-900 hover:border-zinc-300 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed";

/** Destructive (subtle) button. */
export const adminDangerButtonClass =
  "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-[12px] font-semibold active:scale-[0.98] transition-all";

/** Segmented control wrapper + segment states. */
export const adminSegmentWrapClass =
  "inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/70";
export const adminSegmentActiveClass =
  "px-4 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight bg-white text-zinc-900 shadow-[0_1px_2px_rgba(10,10,10,0.06)] transition-all";
export const adminSegmentInactiveClass =
  "px-4 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight text-zinc-500 hover:text-zinc-900 transition-all";

/* ── Modal / dialog primitives (match UpdatesSection) ─────────── */

export const adminModalShellClass =
  "p-0 overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-xl";

export const adminModalTitleClass =
  "text-[20px] font-semibold text-zinc-900 tracking-[-0.01em]";

export const adminModalDescClass = "text-[13px] text-zinc-500 leading-relaxed";

export const adminModalCloseClass =
  "absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10";

export const adminWarningBannerClass = cn(
  "flex gap-3 p-4 rounded-xl border border-amber-200/70 bg-amber-50/80",
);

export const adminWarningTitleClass =
  "text-[12px] font-semibold text-amber-900";

export const adminWarningTextClass = "text-[12px] text-amber-800/90 leading-relaxed";

export const adminDangerInputClass =
  "w-full h-11 px-3.5 bg-rose-50/60 border border-rose-200 rounded-xl text-[13px] font-medium text-rose-800 placeholder:text-rose-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/10 transition-all";
