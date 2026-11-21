import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { GuideArticle } from "@/components/help/GuideArticle";
import {
  guideBook,
  guidesInGroup,
  searchGuides,
} from "@/content/webadminGuides";
import { cn } from "@/lib/utils";
import { adminInputClass, adminPageWrapClass } from "@/components/admin/admin-ui";
import "./help-print.css";

export default function HelpSection() {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const matches = useMemo(() => searchGuides(query), [query]);
  const matchIds = useMemo(() => new Set(matches.map((guide) => guide.id)), [matches]);

  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    if (!guideBook.guides.some((guide) => guide.id === id)) return;
    setOpenId(id);
  }, [location.hash]);

  useEffect(() => {
    if (!openId) return;
    document.getElementById(openId)?.scrollIntoView({ block: "start" });
  }, [openId]);

  return (
    <div className={cn(adminPageWrapClass, "help-sheet")}>
      <PageHeader
        title="Help"
        meta="Step by step for the webadmin. Search, or press How to? on any page."
      />
      <div className="help-no-print mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search guides</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search, for example notice, student, undo"
            className={adminInputClass}
          />
        </label>
        <Link
          to={guideBook.support.printPath}
          className="inline-flex h-11 items-center justify-center rounded-full border border-head px-6 text-[15px] font-semibold leading-[22px] text-head hover:bg-tint"
        >
          Open the print page
        </Link>
        <a
          href={guideBook.support.pdfPath}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-semibold leading-[22px] text-primary-foreground hover:bg-primary-hover"
        >
          Download the PDF
        </a>
      </div>
      {matches.length === 0 ? (
        <p className="text-body leading-6 text-text-2">No guides match those words. Clear the search and try one word.</p>
      ) : null}
      <div className="space-y-10">
        {guideBook.groups.map((group) => {
          const items = guidesInGroup(group.id).filter((guide) => matchIds.has(guide.id));
          if (items.length === 0) return null;
          return (
            <section key={group.id} className="help-group">
              <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
                {group.title}
              </h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {items.map((guide) => {
                  const open = openId === guide.id;
                  return (
                    <li key={guide.id}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-4 py-4 text-left"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : guide.id)}
                      >
                        <span>
                          <span className="block text-body font-semibold text-head">{guide.title}</span>
                          <span className="mt-1 block text-dense leading-5 text-text-2">{guide.summary}</span>
                        </span>
                        <span className="shrink-0 text-dense font-semibold text-text-2">{open ? "Hide" : "Open"}</span>
                      </button>
                      {open ? (
                        <div className="pb-6">
                          <GuideArticle guide={guide} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
