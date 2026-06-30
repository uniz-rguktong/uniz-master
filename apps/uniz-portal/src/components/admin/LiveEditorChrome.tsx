import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/utils/cn";
import { adminGhostButtonClass } from "@/components/admin/admin-ui";

const SECTION_LIVE_URL: Record<string, (page: string | null) => string> = {
  home: () => "https://rguktong.in/",
  institute: (p) => `https://rguktong.in/institute/${p ?? ""}`,
  academics: (p) => `https://rguktong.in/academics/${p ?? ""}`,
  departments: (p) => `https://rguktong.in/departments/${p ?? ""}`,
  notifications: (p) => `https://rguktong.in/notifications/${p ?? ""}`,
};

type LiveEditorChromeProps = {
  sectionLabel: string;
  pageLabel: string;
  description: string;
  onRefresh: () => void;
  loading?: boolean;
  sectionId: string;
  pageKey: string | null;
};

export function LiveEditorChrome({
  sectionLabel,
  pageLabel,
  description,
  onRefresh,
  loading,
  sectionId,
  pageKey,
}: LiveEditorChromeProps) {
  const liveUrl = SECTION_LIVE_URL[sectionId]?.(pageKey);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8">
      <div className="px-6 py-7 md:px-9 md:py-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#800000]/70 mb-2">
              RGUKT Ongole · {sectionLabel}
            </p>
            <h2 className="text-2xl md:text-[1.75rem] font-bold text-slate-900 tracking-tight">
              {pageLabel}
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#800000]/5 text-[#800000] border border-[#800000]/10 text-[11px] font-semibold">
              <Sparkles size={12} />
              Live editor
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className={cn(adminGhostButtonClass, "h-9")}
              title="Refresh from server"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>
      {liveUrl && (
        <div className="px-6 py-3 md:px-9 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <ExternalLink size={12} className="text-[#800000]/60 shrink-0" />
          <span>
            Edits publish to{" "}
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#800000] hover:underline"
            >
              {liveUrl.replace("https://", "")}
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
