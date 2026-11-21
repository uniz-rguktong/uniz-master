import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAcademicPage } from "../types/api";
import type { AcademicSection, AcademicPageType } from "../types/api";
import { FileText } from "lucide-react";
import { PageHero } from "../components/layout/PageHero";
import { usePageTitle } from "../lib/usePageTitle";
import { CampusBoot } from "../components/CampusBoot";
import { Wrap } from "../components/layout/Wrap";

// ── Page metadata ──────────────────────────────────────────────────
const PAGE_META: Record<string, {
  displayName: string;
  subtitle: string;
  eyebrow: string;
}> = {
  academicprograms: {
    displayName: "Academic Programs",
    subtitle: "Undergraduate and integrated programs offered at RGUKT Ongole for gifted rural youth.",
    eyebrow: "RGUKT Ongole · Academics",
  },
  academiccalender: {
    displayName: "Academic Calendar",
    subtitle: "Semester calendars with examination schedules and holidays for each academic year.",
    eyebrow: "RGUKT Ongole · Academics",
  },
  academicregulations: {
    displayName: "Academic Regulations",
    subtitle: "Rules and guidelines governing student conduct and evaluation at RGUKT Ongole.",
    eyebrow: "RGUKT Ongole · Academics",
  },
  curicula: {
    displayName: "Curricula",
    subtitle: "Department-wise curriculum documents, credit requirements, and syllabi.",
    eyebrow: "RGUKT Ongole · Academics",
  },
  timetable: {
    displayName: "Time table",
    subtitle: "The campus publishes examination time tables with the academic calendar.",
    eyebrow: "RGUKT Ongole · Academics",
  },
};

// The official menu labels Time table separately, and points it at the calendar.
const FETCH_AS: Record<string, AcademicPageType> = {
  timetable: "AcademicCalender",
};

function HeroBanner({ meta }: { meta: typeof PAGE_META[string] }) {
  return (
    <PageHero
      eyebrow={meta.eyebrow}
      title={meta.displayName}
      description={meta.subtitle}
    />
  );
}

// Source data says "Semister"; show the right spelling.
function fixSpelling(s: string) {
  return s.replace(/semister/gi, (m) => (m[0] === "S" ? "Semester" : "semester"));
}

// ── Link row — always renders as a clickable link ─────────────────
function LinkRow({ label, url }: { label: string; url: string | null }) {
  const cleanLabel = fixSpelling(label.replace(/\n\s+/g, " ").trim());
  return (
    <a
      href={url ?? "#"}
      target={url ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline"
    >
      {cleanLabel}
    </a>
  );
}

function SectionBlock({ section }: { section: AcademicSection }) {
  return (
    <section className="border-t border-border py-8">
      <h2 className="u-h2 text-head">
        {fixSpelling(section.header.replace(/\n\s+/g, " ").trim())}
      </h2>
      <ul className="mt-4 max-w-[65ch]">
        {section.links.map((link, i) => (
          <li key={i}>
            <LinkRow label={link.label} url={link.url} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── ACADEMIC CALENDAR layout ───────────────────────────────────────
function CalendarLayout({ sections }: { sections: AcademicSection[] }) {
  const years = sections.filter(s => s.links && s.links.length > 0);

  return (
    <div>
      {years.map((section, idx) => (
        <SectionBlock key={idx} section={section} />
      ))}
    </div>
  );
}

// ── CURRICULA layout — clean dept list ─────────────────────────────
function CurriculaLayout({ sections }: { sections: AcademicSection[] }) {
  const depts = sections.filter(s => s.links && s.links.length > 0);
  if (depts.length === 0) return <EmptyState />;

  return (
    <div>
      {depts.map((section, idx) => (
        <SectionBlock key={idx} section={section} />
      ))}
    </div>
  );
}

// ── GENERIC sections layout (Programs, Regulations) ────────────────
function GenericLayout({ sections }: { sections: AcademicSection[] }) {
  const meaningful = sections.filter(s => s.links && s.links.length > 0);
  if (meaningful.length === 0) return <EmptyState />;

  return (
    <div>
      {meaningful.map((section, idx) => (
        <SectionBlock key={idx} section={section} />
      ))}
    </div>
  );
}

// Same departments the site header lists.
const DEPT_LINKS = [
  { code: "CSE", name: "CSE" },
  { code: "ECE", name: "ECE" },
  { code: "EEE", name: "EEE" },
  { code: "CIVIL", name: "Civil" },
  { code: "ME", name: "Mechanical" },
];

// ── Empty state ────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-tint-2">
        <FileText className="text-accent" size={32} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <p className="mt-6 font-serif text-[22px] font-normal leading-[30px] tracking-[-0.01em] text-head">Nothing published here yet</p>
      <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-6 text-text-2">Check back later, or browse the department pages for course and faculty details.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 px-6">
        {DEPT_LINKS.map((d) => (
          <Link key={d.code} to={`/departments/${d.code}`} className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline">
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────
export function AcademicsPage() {
  const { pageName } = useParams<{ pageName: string }>();
  const [data, setData] = useState<AcademicSection[]>([]);
  const [loading, setLoading] = useState(true);

  const key = pageName?.toLowerCase() ?? "";
  const meta = PAGE_META[key] ?? {
    displayName: pageName?.replace(/([A-Z])/g, " $1").trim() ?? "Academics",
    subtitle: "Academic resources and information at RGUKT Ongole.",
    eyebrow: "RGUKT Ongole · Academics",
  };

  usePageTitle(`${meta.displayName} · RGUKT Ongole`);

  useEffect(() => {
    async function fetchPage() {
      if (pageName) {
        setLoading(true);
        const res = await getAcademicPage((FETCH_AS[pageName.toLowerCase()] ?? pageName) as AcademicPageType);
        setData(res);
        setLoading(false);
      }
    }
    fetchPage();
  }, [pageName]);

  if (loading) {
    return (
      <CampusBoot label={`Loading ${meta.displayName}`} className="min-h-[50vh]" />
    );
  }

  return (
    <div>
      <HeroBanner meta={meta} />

      <Wrap className="pb-16">
        {/* Route to specific layout based on page */}
        {(key === "academiccalender" || key === "timetable") && <CalendarLayout sections={data} />}
        {key === "curicula"         && <CurriculaLayout sections={data} />}
        {(key === "academicprograms" || key === "academicregulations") && <GenericLayout sections={data} />}
        {!["academiccalender", "timetable", "curicula", "academicprograms", "academicregulations"].includes(key) && (
          <GenericLayout sections={data} />
        )}
      </Wrap>
    </div>
  );
}
