import { Link, useLocation } from "react-router-dom";
import { officialDoc } from "@/data/official";
import type { OfficialDoc, PersonCard } from "@/data/official";
import { siblingsOf } from "@/data/nav";
import { usePageTitle } from "@/lib/usePageTitle";
import { PageHero } from "@/components/layout/PageHero";
import { Wrap } from "@/components/layout/Wrap";
import { PersonPhoto } from "@/components/common/PersonPhoto";
import { initials } from "@/lib/initials";
import { buttonVariants } from "@/components/ui/button-variants";

function RichValue({ value }: { value: string }) {
  const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) {
    return (
      <a href={`mailto:${email[0]}`} className="text-link hover:underline">
        {value}
      </a>
    );
  }
  const phone = value.match(/(?:\+?\d[\d\s-]{7,}\d)/);
  if (phone && !/[a-z]/i.test(value.replace(/phone|mobile|email/gi, ""))) {
    return (
      <a href={`tel:${phone[0].replace(/[\s-]/g, "")}`} className="text-link hover:underline">
        {value}
      </a>
    );
  }
  return <>{value}</>;
}

function PersonBlock({ person }: { person: PersonCard }) {
  return (
    <article className="border-t border-border py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="size-24 shrink-0 overflow-hidden rounded-full bg-navy-100 dark:bg-surface-2">
          <PersonPhoto
            src={person.photo}
            name={person.name}
            className="size-full object-cover object-top"
            fallback={
              <div className="flex size-full items-center justify-center text-[18px] font-medium text-navy-900 dark:text-text">
                {initials(person.name)}
              </div>
            }
          />
        </div>
        <div className="min-w-0">
          <h2 className="u-h2 text-head">{person.name}</h2>
          {person.role && <p className="mt-2 max-w-[65ch] text-[15px] leading-6 text-text-2">{person.role}</p>}
          {person.lines.length > 0 && (
            <ul className="mt-3 space-y-1">
              {person.lines.map((line) => (
                <li key={line} className="text-[15px] leading-6 text-text-2">
                  <RichValue value={line} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {person.bio.length > 0 && (
        <div className="mt-5 max-w-[65ch] space-y-4">
          {person.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="u-prose">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

function ExternalLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const external = /^https?:/i.test(href);
  if (!external) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Related({ path }: { path: string }) {
  const related = siblingsOf(path);
  if (!related) return null;
  return (
    <nav aria-label={`Also in ${related.group}`} className="mt-12 border-t border-border pt-8">
      <h2 className="text-[15px] font-semibold leading-6 text-head">Also in {related.group}</h2>
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {related.links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              aria-current={link.to === path ? "page" : undefined}
              className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline aria-[current=page]:font-semibold aria-[current=page]:text-head"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PeopleBody({ doc }: { doc: OfficialDoc }) {
  return (
    <>
      {(doc.people ?? []).map((person) => (
        <PersonBlock key={`${person.name}-${person.role}`} person={person} />
      ))}
      {(doc.address ?? []).length > 0 && (
        <div className="border-t border-border py-8">
          <h2 className="u-h2 text-head">{doc.addressTitle || "Office address"}</h2>
          <address className="mt-4 space-y-1 text-[16px] leading-[26px] text-text not-italic">
            {doc.address?.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
        </div>
      )}
    </>
  );
}

function ContactBody({ doc }: { doc: OfficialDoc }) {
  return (
    <>
      {(doc.sections ?? []).map((section) => (
        <section key={section.title} className="border-t border-border py-8" aria-labelledby={`contact-${section.title}`}>
          <h2 id={`contact-${section.title}`} className="u-h2 text-head">
            {section.title}
          </h2>
          {section.headers.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px] leading-6">
                <caption className="sr-only">{section.title}</caption>
                <thead>
                  <tr className="border-b border-border text-text-3">
                    {section.headers.map((header) => (
                      <th key={header} scope="col" className="py-3 pr-4 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, index) => (
                    <tr key={`${section.title}-${index}`} className="border-b border-border">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="py-3 pr-4 align-top text-text">
                          {cell ? <RichValue value={cell} /> : <span className="text-text-3">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <dl className="mt-4 max-w-[65ch]">
              {section.rows.map((row, index) => (
                <div key={`${section.title}-${index}`} className="grid grid-cols-1 gap-1 border-b border-border py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <dt className="text-[14px] leading-5 text-text-3">{row[0]}</dt>
                  <dd className="text-[15px] leading-6 text-text">{row[1] ? <RichValue value={row[1]} /> : "—"}</dd>
                </div>
              ))}
            </dl>
          )}
          {section.address.length > 0 && (
            <address className="mt-4 space-y-1 text-[16px] leading-[26px] text-text not-italic">
              {section.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          )}
        </section>
      ))}
    </>
  );
}

function GalleryBody({ doc }: { doc: OfficialDoc }) {
  return (
    <>
      {(doc.groups ?? []).map((group) => (
        <section key={group.group} className="border-t border-border py-8">
          <h2 className="u-h2 text-head">{group.group}</h2>
          {group.note && <p className="mt-3 text-[15px] leading-6 text-text-2">{group.note}</p>}
          {(group.items ?? []).length > 0 && (
            <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 min-[821px]:grid-cols-3">
              {(group.items ?? []).map((item) => (
                <li key={item.href + (item.title ?? "")}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title || "Campus photograph"}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-end rounded-xl bg-tint-2 p-4 text-[15px] leading-6 text-text-2">
                        Photograph not published
                      </div>
                    )}
                    <span className="mt-3 block text-[15px] font-medium leading-6 text-head group-hover:underline">
                      {item.title}
                      <span className="sr-only"> (opens the album in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

function LinksBody({ doc }: { doc: OfficialDoc }) {
  return (
    <div className="border-t border-border py-8">
      <div className="max-w-[65ch] space-y-4">
        {(doc.paragraphs ?? []).map((paragraph) => (
          <p key={paragraph.text.slice(0, 40)} className="u-prose">
            {paragraph.text}
          </p>
        ))}
      </div>
      <div className={doc.plainLinks ? "mt-4 flex flex-col items-start" : "mt-6 flex flex-col items-start gap-3"}>
        {(doc.links ?? []).map((link) => (
          <ExternalLink
            key={link.href + link.label}
            href={link.href}
            label={link.label}
            className={
              doc.plainLinks
                ? "inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline"
                : buttonVariants({ variant: link.external ? "outline" : "primary", size: "default" })
            }
          />
        ))}
      </div>
    </div>
  );
}

function DepartmentsBody({ doc }: { doc: OfficialDoc }) {
  return (
    <>
      {(doc.groups ?? []).map((group) => (
        <section key={group.title} className="border-t border-border py-8">
          <h2 className="u-h2 text-head">{group.title}</h2>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2">
            {(group.items ?? []).map((item) => (
              <li key={item.href}>
                <Link to={item.href || "/"} className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function OfficialPage() {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const doc = officialDoc(path);
  usePageTitle(`${doc?.title ?? "Page"} · RGUKT Ongole`);

  if (!doc) {
    return (
      <Wrap className="py-16">
        <h1 className="u-page text-head">Page not found</h1>
        <p className="mt-4 text-[15px] leading-6 text-text-2">This section is not on the campus site.</p>
        <Link to="/" className={`${buttonVariants({ variant: "primary" })} mt-8`}>
          Go back home
        </Link>
      </Wrap>
    );
  }

  return (
    <div>
      <PageHero eyebrow={doc.eyebrow} title={doc.title} description={doc.description} />
      <Wrap className="pb-16">
        {doc.kind === "figure" && doc.image && (
          <img
            src={doc.image}
            alt={doc.imageAlt || doc.title}
            width={1200}
            height={800}
            decoding="async"
            className="mt-8 w-full max-w-3xl rounded-xl"
          />
        )}
        {doc.kind === "people" && <PeopleBody doc={doc} />}
        {doc.kind === "contact" && <ContactBody doc={doc} />}
        {doc.kind === "gallery" && <GalleryBody doc={doc} />}
        {doc.kind === "links" && <LinksBody doc={doc} />}
        {doc.kind === "departments" && <DepartmentsBody doc={doc} />}
        <Related path={path} />
      </Wrap>
    </div>
  );
}
