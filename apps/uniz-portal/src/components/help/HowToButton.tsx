import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideArticle } from "@/components/help/GuideArticle";
import {
  WEBADMIN_SCREEN_LABELS,
  guideBook,
  guidesForScreen,
  type Guide,
} from "@/content/webadminGuides";
import { cn } from "@/lib/utils";

type HowToButtonProps = {
  screen: string;
  tone?: "page" | "chrome";
};

export function HowToButton({ screen, tone = "page" }: HowToButtonProps) {
  const guides = useMemo(() => guidesForScreen(screen), [screen]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Guide | null>(guides.length === 1 ? guides[0] : null);
  const titleId = useId();
  const screenLabel = WEBADMIN_SCREEN_LABELS[screen] || "This page";

  useEffect(() => {
    setPicked(guides.length === 1 ? guides[0] : null);
  }, [guides]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const showing = picked ?? (guides.length === 1 ? guides[0] : null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-dense font-semibold leading-5",
          tone === "chrome"
            ? "border-navy-300 text-white hover:bg-white/10"
            : "border-head bg-transparent text-head hover:bg-tint",
        )}
      >
        <CircleHelp size={16} strokeWidth={1.75} aria-hidden />
        How to?
      </button>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="Close the guide"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-border bg-surface text-text"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="text-small font-medium text-text-2">How to?</p>
                <h2 id={titleId} className="font-serif text-[24px] font-normal leading-8 text-head">
                  {screenLabel}
                </h2>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {guides.length === 0 ? (
                <p className="text-body leading-6 text-text-2">
                  This page has no separate guide yet. Open Help and search for the job.
                </p>
              ) : null}
              {guides.length > 1 && !showing ? (
                <ul className="space-y-2">
                  {guides.map((guide) => (
                    <li key={guide.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(guide)}
                        className="w-full rounded-lg border border-border px-4 py-3 text-left hover:bg-tint"
                      >
                        <span className="block text-body font-semibold text-head">{guide.title}</span>
                        <span className="mt-1 block text-dense leading-5 text-text-2">{guide.summary}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {showing ? (
                <div className="space-y-4">
                  {guides.length > 1 ? (
                    <button
                      type="button"
                      className="text-dense font-semibold text-head underline-offset-[1px] hover:underline"
                      onClick={() => setPicked(null)}
                    >
                      All guides for this page
                    </button>
                  ) : null}
                  <GuideArticle guide={showing} />
                  <p>
                    <Link
                      to={`/admin/help#${showing.id}`}
                      className="text-body font-semibold text-head underline-offset-[1px] hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Open in Help
                    </Link>
                  </p>
                </div>
              ) : null}
            </div>
            <footer className="border-t border-border px-5 py-4">
              <a
                href={guideBook.support.pdfPath}
                className="text-dense font-semibold text-head underline-offset-[1px] hover:underline"
              >
                Download the PDF
              </a>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
