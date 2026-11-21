import type { Guide } from "@/content/webadminGuides";
import { groupTitle } from "@/content/webadminGuides";
import { RichText } from "./RichText";

export function GuideArticle({ guide }: { guide: Guide }) {
  return (
    <article id={guide.id} className="help-article space-y-5">
      <header>
        <p className="text-small font-medium text-text-2">{groupTitle(guide.group)}</p>
        <h3 className="mt-1 font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
          {guide.title}
        </h3>
        <p className="mt-2 text-body leading-6 text-text-2">{guide.summary}</p>
      </header>
      <ol className="list-decimal space-y-2 pl-5 text-body leading-6 text-text">
        {guide.steps.map((step) => (
          <li key={step}>
            <RichText text={step} />
          </li>
        ))}
      </ol>
      <section>
        <h4 className="font-serif text-[20px] font-normal leading-7 text-head">If something goes wrong</h4>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-body leading-6 text-text">
          {guide.wrong.map((tip) => (
            <li key={tip}>
              <RichText text={tip} />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h4 className="font-serif text-[20px] font-normal leading-7 text-head">Who to call</h4>
        <p className="mt-2 text-body leading-6 text-text">
          <RichText text={guide.call} />
        </p>
      </section>
    </article>
  );
}
