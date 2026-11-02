import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAcademicPage } from "../types/api";
import type { AcademicSection, AcademicPageType } from "../types/api";
import { Download, ExternalLink, FileText, GraduationCap } from "lucide-react";
import { PageHero } from "../components/layout/PageHero";
import { usePageTitle } from "../lib/usePageTitle";

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
      rel="noreferrer"
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-navy-900/5 hover:bg-navy text-navy-900 hover:text-white font-semibold text-sm transition-all duration-200 group"
    >
      <span className="flex items-center gap-2">
        <Download className="w-4 h-4 flex-shrink-0" />
        {cleanLabel}
      </span>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
    </a>
  );
}

// ── ACADEMIC CALENDAR layout ───────────────────────────────────────
function CalendarLayout({ sections }: { sections: AcademicSection[] }) {
  const years = sections.filter(s => s.links && s.links.length > 0);

  return (
    <div className="space-y-6">
      {years.map((section, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Year header */}
          <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100 bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-navy" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {fixSpelling(section.header.replace(/\n\s+/g, " ").trim())}
            </h2>
          </div>
          {/* Semester links */}
          <div className="px-6 py-5 flex flex-col items-start gap-3">
            {section.links.map((link, i) => (
              <LinkRow key={i} label={link.label} url={link.url} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CURRICULA layout — clean dept list ─────────────────────────────
function CurriculaLayout({ sections }: { sections: AcademicSection[] }) {
  const depts = sections.filter(s => s.links && s.links.length > 0);
  if (depts.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {depts.map((section, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#0A2540] shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Dept header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-[15px] font-extrabold text-slate-900 leading-snug">
              {fixSpelling(section.header.replace(/\n\s+/g, " ").trim())}
            </h2>
          </div>
          {/* Curriculum links */}
          <div className="px-5 py-4 flex flex-col gap-2">
            {section.links.map((link, i) => (
              <LinkRow key={i} label={link.label} url={link.url} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── GENERIC sections layout (Programs, Regulations) ────────────────
function GenericLayout({ sections }: { sections: AcademicSection[] }) {
  const meaningful = sections.filter(s => s.links && s.links.length > 0);
  if (meaningful.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      {meaningful.map((section, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#0A2540] shadow-sm p-7 md:p-9">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-5 tracking-tight">
            {fixSpelling(section.header.replace(/\n\s+/g, " ").trim())}
          </h2>
          <div className="flex flex-col gap-2">
            {section.links.map((link, i) => (
              <LinkRow key={i} label={link.label} url={link.url} />
            ))}
          </div>
        </div>
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
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <FileText className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-600 font-semibold text-lg">Nothing published here yet</p>
      <p className="text-ink-subtle text-sm mt-2">Check back later, or browse the department pages for course and faculty details.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 px-6">
        {DEPT_LINKS.map((d) => (
          <Link key={d.code} to={`/departments/${d.code}`} className="px-3 py-1.5 rounded-full bg-navy-900/5 hover:bg-navy hover:text-white text-navy-900 text-sm font-semibold transition-colors">
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
    pill: "text-slate-300", pillBg: "bg-slate-400/10", pillBorder: "border-slate-400/30",
    icon: <GraduationCap className="w-5 h-5" />,
  };

  usePageTitle(`${meta.displayName} · RGUKT Ongole`);

  useEffect(() => {
    async function fetchPage() {
      if (pageName) {
        setLoading(true);
        const res = await getAcademicPage(pageName as AcademicPageType);
        setData(res);
        setLoading(false);
      }
    }
    fetchPage();
  }, [pageName]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
          <p className="text-sm text-ink-muted">Loading {meta.displayName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroBanner meta={meta} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Route to specific layout based on page */}
        {key === "academiccalender" && <CalendarLayout sections={data} />}
        {key === "curicula"         && <CurriculaLayout sections={data} />}
        {(key === "academicprograms" || key === "academicregulations") && <GenericLayout sections={data} />}
        {!["academiccalender", "curicula", "academicprograms", "academicregulations"].includes(key) && (
          <GenericLayout sections={data} />
        )}
      </div>
    </div>
  );
}
