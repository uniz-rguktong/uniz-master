import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAcademicPage } from "../types/api";
import type { AcademicSection, AcademicPageType } from "../types/api";
import { Download, ExternalLink, FileText, BookOpen, Calendar, GraduationCap } from "lucide-react";

// ── Page metadata ──────────────────────────────────────────────────
const PAGE_META: Record<string, {
  displayName: string;
  subtitle: string;
  pill: string;
  pillBg: string;
  pillBorder: string;
  icon: React.ReactNode;
}> = {
  academicprograms: {
    displayName: "Academic Programs",
    subtitle: "Explore the undergraduate and integrated programs offered at RGUKT Ongole, designed to empower gifted rural youth with world-class technical education.",
    pill: "text-sky-300", pillBg: "bg-sky-400/10", pillBorder: "border-sky-400/30",
    icon: <GraduationCap className="w-5 h-5" />,
  },
  academiccalender: {
    displayName: "Academic Calendar",
    subtitle: "Access semester-wise academic calendars with key dates, examination schedules, and holiday information for each academic year.",
    pill: "text-amber-300", pillBg: "bg-amber-400/10", pillBorder: "border-amber-400/30",
    icon: <Calendar className="w-5 h-5" />,
  },
  academicregulations: {
    displayName: "Academic Regulations",
    subtitle: "Official academic rules, regulations, and guidelines governing the conduct and evaluation of students at RGUKT Ongole.",
    pill: "text-violet-300", pillBg: "bg-violet-400/10", pillBorder: "border-violet-400/30",
    icon: <FileText className="w-5 h-5" />,
  },
  curicula: {
    displayName: "Curricula",
    subtitle: "Download department-wise curriculum documents covering course structures, credit requirements, and syllabi for each engineering discipline.",
    pill: "text-emerald-300", pillBg: "bg-emerald-400/10", pillBorder: "border-emerald-400/30",
    icon: <BookOpen className="w-5 h-5" />,
  },
};

// ── Shared hero banner ─────────────────────────────────────────────
function HeroBanner({ meta }: { meta: typeof PAGE_META[string] }) {
  return (
    <div className="relative bg-[#000035] overflow-hidden">
      <div
        className="absolute inset-0 opacity-15"
        style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, #800000 0%, transparent 55%), radial-gradient(ellipse at 15% 80%, #1e3a8a 0%, transparent 55%)" }}
      />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className={`inline-flex items-center gap-2 px-5 py-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase ${meta.pill} ${meta.pillBg} border ${meta.pillBorder} rounded-full`}>
          {meta.icon}
          RGUKT Ongole · Academics
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-5">
          {meta.displayName}
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
          {meta.subtitle}
        </p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
    </div>
  );
}

// ── Link row — always renders as a clickable link ─────────────────
function LinkRow({ label, url }: { label: string; url: string | null }) {
  const cleanLabel = label.replace(/\n\s+/g, " ").trim();
  return (
    <a
      href={url ?? "#"}
      target={url ? "_blank" : "_self"}
      rel="noreferrer"
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#000035]/5 hover:bg-[#800000] text-[#000035] hover:text-white font-semibold text-sm transition-all duration-200 group"
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
            <div className="w-2 h-2 rounded-full bg-[#800000]" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {section.header.replace(/\n\s+/g, " ").trim()}
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
          className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#800000] shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Dept header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-[15px] font-extrabold text-slate-900 leading-snug">
              {section.header.replace(/\n\s+/g, " ").trim()}
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
        <div key={idx} className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#800000] shadow-sm p-7 md:p-9">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-5 tracking-tight">
            {section.header.replace(/\n\s+/g, " ").trim()}
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

// ── Empty state ────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <FileText className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-500 font-semibold text-lg">Content Coming Soon</p>
      <p className="text-slate-400 text-sm mt-2">This section will be updated shortly.</p>
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent" />
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">
            Loading {meta.displayName}...
          </p>
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
