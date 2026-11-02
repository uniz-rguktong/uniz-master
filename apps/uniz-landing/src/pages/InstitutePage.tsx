import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInstituteInfo } from "../types/api";
import type { InstituteData, InstitutePage as InstitutePageType } from "../types/api";
import { PersonPhoto } from "../components/common/PersonPhoto";
import { initials } from "../lib/initials";
import { usePageTitle } from "../lib/usePageTitle";
import { PageHero } from "../components/layout/PageHero";
import { CampusBoot } from "../components/CampusBoot";

const PAGE_NAMES: Record<string, string> = {
  aboutrgukt: "About RGUKT",
  campuslife: "Campus Life",
  edusys: "Education System",
  govcouncil: "Governing Council",
  rtiinfo: "RTI Information",
  scst: "SC/ST Cell",
};

// Section icon mapping for About RGUKT
const SECTION_META: Record<string, { accent: string }> = {
  "Founding of RGUKT":            { accent: "border-l-[#0A2540]" },
  "RGUKT Educational Objectives": { accent: "border-l-[#061B33]" },
  "Objectives of the University": { accent: "border-l-amber-500" },
  "Why RGUKT ?":                  { accent: "border-l-emerald-600" },
};

// ────────────────────────────────────────────────────────────
//  About RGUKT: premium dedicated render
// ────────────────────────────────────────────────────────────
function AboutRguktPage({ data }: { data: InstituteData }) {
  const sections = data?.sections ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Rajiv Gandhi University of Knowledge Technologies"
        title="About RGUKT"
        description="Residential, technology-driven higher education for gifted rural youth of Andhra Pradesh."
      />

      {/* ── Key Stats Bar ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-16 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
          {[
            { value: "2008", label: "Year founded" },
            { value: "6 years", label: "Integrated program" },
            { value: "Residential", label: "Campus model" },
            { value: "4", label: "AP campuses" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-line px-6 py-5 text-left">
              <div className="text-2xl font-medium text-navy-900 tabular-nums">{stat.value}</div>
              <div className="text-sm text-ink-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Sections ── */}
        <div className="space-y-8 pb-20">
          {sections.map((section, idx) => {
            const meta = SECTION_META[section.title] ?? { accent: "border-l-slate-400" };
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${meta.accent} p-8 md:p-10`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl md:text-3xl font-medium text-slate-900 tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.content.map((para, pIdx) => (
                    <p key={pIdx} className="text-slate-600 text-[16px] leading-[1.85] text-justify">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function GovCouncilPage({ data }: { data: InstituteData }) {
  const profiles = data?.profiles ?? [];
  // First profile is always the Chairperson/Chair
  const chair = profiles[0];
  const members = profiles.slice(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Rajiv Gandhi University of Knowledge Technologies"
        title="Governing Council"
        description="Strategic direction and policy oversight for RGUKT from academics, administrators, and industry representatives."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">

        {/* ── Chairperson Spotlight ── */}
        {chair && (
          <div className="relative -mt-10 mb-16 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-64 flex-shrink-0 bg-navy-900 flex items-center justify-center p-8">
              <PersonPhoto
              src={chair.photo}
              name={chair.name}
              className="w-36 h-36 rounded-full object-cover object-top border-4 border-white/30 shadow-lg"
              fallback={
                <div className="w-36 h-36 rounded-full bg-navy/30 border-4 border-white/20 flex items-center justify-center text-white text-5xl font-medium">
                  {initials(chair.name)}
                </div>
              }
            />
            </div>
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <span className="inline-block mb-3 px-3 py-1 text-[11px] font-medium tracking-normal text-navy bg-navy/8 border border-navy/20 rounded-full w-fit">
                Chairman · Member-Convener
              </span>
              <h2 className="text-2xl md:text-3xl font-medium text-slate-900 mb-2">{chair.name}</h2>
              <div className="space-y-1">
                {chair.text.map((line, i) => (
                  <p key={i} className="text-slate-600 text-[15px] leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Section heading ── */}
        {members.length > 0 && (
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">Council Members</h2>
            <div className="mt-3 mx-auto w-16 h-1 bg-navy rounded-full" />
          </div>
        )}

        {/* ── Members Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              {/* Photo strip */}
              <div className="relative h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                <PersonPhoto
              src={member.photo}
              name={member.name}
              className="w-full h-full object-contain group- transition-transform duration-500"
              fallback={
                <div className="w-24 h-24 rounded-full bg-navy-900 flex items-center justify-center text-white text-4xl font-medium shadow-lg">
                    {initials(member.name)}
                  </div>
              }
            />
                {/* Gradient overlay at bottom only */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-100/80 to-transparent pointer-events-none" />
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-[17px] font-medium text-slate-900 leading-snug mb-2 group-hover:text-navy transition-colors">
                  {member.name}
                </h3>
                <div className="space-y-0.5">
                  {member.text.filter(t => t.trim()).map((line, i) => (
                    <p key={i} className="text-slate-600 text-sm leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Generic Institute Page — upgraded premium render
//  Handles: Campus Life, Education System, RTI Info, SC/ST Cell
// ────────────────────────────────────────────────────────────
function GenericInstitutePage({ data, displayName }: { data: InstituteData; displayName: string; pageName?: string }) {

  // Only show sections that have content and are not the address block (shown separately)
  const meaningfulSections = (data?.sections ?? []).filter(
    s => s.content.some(c => c.trim()) && !s.title.toLowerCase().includes("address")
  );
  const profiles = data?.profiles ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero eyebrow="RGUKT Ongole campus" title={displayName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">

        {/* ── Text Sections ── */}
        {meaningfulSections.length > 0 && (
          <div className="space-y-6 mt-10">
            {meaningfulSections.map((section, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#0A2540] p-8 md:p-10"
              >
                {section.title.trim() && (
                  <h2 className="text-xl md:text-2xl font-medium text-slate-900 mb-5 tracking-tight">
                    {section.title.trim()}
                  </h2>
                )}
                <div className="space-y-4">
                  {section.content.filter(c => c.trim()).map((para, pIdx) => (
                    <p key={pIdx} className="text-slate-600 text-[15.5px] leading-[1.85] text-justify whitespace-pre-line">
                      {para.replace(/\n\s+/g, " ").trim()}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Profiles (RTI / SC/ST style contact cards) ── */}
        {profiles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl md:text-3xl font-medium text-slate-900 mb-8 tracking-tight">Key Personnel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profiles.map((profile, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Photo */}
                  <div className="h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <PersonPhoto
              src={profile.photo}
              name={profile.name}
              className="w-full h-full object-contain group- transition-transform duration-500"
              fallback={
                <div className="w-24 h-24 rounded-full bg-navy-900 flex items-center justify-center text-white text-4xl font-medium shadow-lg">
                        {initials(profile.name)}
                      </div>
              }
            />
                  </div>

                  {/* Info */}
                  <div className="p-5 border-t border-slate-100">
                    <h3 className="text-[15px] font-medium text-slate-900 mb-1 group-hover:text-navy transition-colors">
                      {profile.name}
                    </h3>
                    <div className="space-y-1 mt-2">
                      {profile.text.filter(t => t.trim()).map((line, i) => {
                        // Auto-detect phone and email
                        const isPhone = /^\d[\d\s-]{7,}$/.test(line.trim());
                        const isEmail = line.includes("@");
                        return (
                          <p key={i} className={`text-sm leading-relaxed ${isEmail || isPhone ? "font-medium text-navy" : "text-slate-500"}`}>
                            {isEmail ? (
                              <a href={`mailto:${line.trim()}`} className="hover:underline">{line.trim()}</a>
                            ) : isPhone ? (
                              <a href={`tel:${line.trim().replace(/\s/g, "")}`} className="hover:underline">{line.trim()}</a>
                            ) : line.trim()}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Office Address block (for RTI / SC/ST) ── */}
        {(data?.sections ?? []).filter(s => s.title.toLowerCase().includes("address")).map((s, i) => (
          <div key={i} className="mt-10 bg-navy-900/5 border border-navy-900/10 rounded-2xl p-7">
            <h3 className="text-lg font-medium text-navy-900 mb-3">Office Address</h3>
            <address className="not-italic text-slate-600 text-[15px] leading-relaxed space-y-1">
              {s.content.filter(c => c.trim()).map((line, idx) => (
                <p key={idx}>{line.trim()}</p>
              ))}
            </address>
          </div>
        ))}

      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Main export
// ────────────────────────────────────────────────────────────
export function InstitutePage() {
  const { pageName } = useParams<{ pageName: string }>();
  const [data, setData] = useState<InstituteData | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = PAGE_NAMES[pageName?.toLowerCase() ?? ""] ?? (pageName?.replace(/([A-Z])/g, " $1").trim() ?? "");
  usePageTitle(`${displayName || "Institute"} · RGUKT Ongole`);

  useEffect(() => {
    async function fetchData() {
      if (pageName) {
        setLoading(true);
        const res = await getInstituteInfo(pageName as InstitutePageType);
        setData(res);
        setLoading(false);
      }
    }
    fetchData();
  }, [pageName]);

  if (loading) {
    return (
      <CampusBoot label={`Loading ${displayName}`} className="min-h-[50vh]" />
    );
  }

  if (!data && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-medium text-slate-900 mb-4">{displayName}</h1>
          <p className="text-slate-500 text-lg">Detailed information is not available for this section.</p>
        </div>
      </div>
    );
  }

  // Route to govcouncil-specific premium page
  if (pageName?.toLowerCase() === "govcouncil" && data) {
    return <GovCouncilPage data={data} />;
  }

  // Route to about-specific premium page
  if (pageName?.toLowerCase() === "aboutrgukt" && data) {
    return <AboutRguktPage data={data} />;
  }

  return <GenericInstitutePage data={data!} displayName={displayName} pageName={pageName} />;
}

