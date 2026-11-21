import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  pageLabel,
  description,
  onRefresh,
  loading,
  sectionId,
  pageKey,
}: LiveEditorChromeProps) {
  const liveUrl = SECTION_LIVE_URL[sectionId]?.(pageKey);

  return (
    <div className="mb-8 rounded-lg border border-border bg-surface">
      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
            {pageLabel}
          </h2>
          <p className="mt-2 max-w-xl text-body leading-6 text-text-2">{description}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="compact"
          onClick={onRefresh}
          title="Refresh from server"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      {liveUrl && (
        <div className="flex items-center gap-2 border-t border-border px-6 py-3 text-small text-text-2">
          <ExternalLink size={14} className="shrink-0 text-text-3" />
          <span className="min-w-0 truncate">
            Edits publish to{" "}
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-head hover:underline"
            >
              {liveUrl.replace("https://", "")}
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
