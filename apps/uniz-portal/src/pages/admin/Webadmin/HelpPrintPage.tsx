import { Link } from "react-router-dom";
import { GuideArticle } from "@/components/help/GuideArticle";
import { guideBook, guidesInGroup } from "@/content/webadminGuides";
import "./help-print.css";

export default function HelpPrintPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="help-no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-bg px-4 py-3 min-[821px]:px-10">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-semibold leading-[22px] text-primary-foreground hover:bg-primary-hover"
        >
          Print
        </button>
        <a
          href={guideBook.support.pdfPath}
          className="inline-flex h-11 items-center justify-center rounded-full border border-head px-6 text-[15px] font-semibold leading-[22px] text-head hover:bg-tint"
        >
          Download the PDF
        </a>
        <Link
          to="/admin/help"
          className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[15px] font-semibold leading-[22px] text-text-2 hover:bg-tint"
        >
          Back to Help
        </Link>
      </div>
      <article className="help-sheet mx-auto w-full max-w-[800px] px-4 py-8 min-[821px]:px-10">
        <p className="text-small font-medium text-text-2">RGUKT Ongole · UniZ</p>
        <h1 className="mt-2 font-serif text-[32px] font-normal leading-10 tracking-[-0.01em] text-head">
          Webadmin guide
        </h1>
        <p className="mt-3 text-body leading-6 text-text-2">
          These steps are for the webadmin. One action per step. The words in bold are the words on the button.
        </p>
        <p className="mt-3 text-body leading-6 text-text">
          Staff sign-in: {guideBook.support.portalSignIn}
          <br />
          Public website: {guideBook.support.publicSite}
          <br />
          Emergency database page: {guideBook.support.adminer}
          <br />
          Director&apos;s office: {guideBook.support.directorPhone}
          <br />
          Administrative Officer: {guideBook.support.officerPhone}
        </p>
        {guideBook.groups.map((group) => {
          const items = guidesInGroup(group.id);
          if (items.length === 0) return null;
          return (
            <section key={group.id} className="help-group mt-10">
              <h2 className="font-serif text-[28px] font-normal leading-9 text-head">{group.title}</h2>
              <div className="mt-6 space-y-10">
                {items.map((guide) => (
                  <GuideArticle key={guide.id} guide={guide} />
                ))}
              </div>
            </section>
          );
        })}
      </article>
    </div>
  );
}
