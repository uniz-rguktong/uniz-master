import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInstituteInfo } from "../types/api";
import type { InstituteData, InstitutePage as InstitutePageType } from "../types/api";

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
  "Founding of RGUKT":            { accent: "border-l-[#800000]" },
  "RGUKT Educational Objectives": { accent: "border-l-[#000035]" },
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

      {/* ── Hero Banner ── */}
      <div className="relative bg-[#000035] overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, #800000 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, #1d4ed8 0%, transparent 50%)" }}
        />
        {/* Faint grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="inline-block px-5 py-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full">
            Rajiv Gandhi University of Knowledge Technologies
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            About RGUKT
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
            Established to provide world-class education to the gifted rural youth of Andhra Pradesh — a bold, unique experiment in residential, technology-driven higher education.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      {/* ── Key Stats Bar ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 mb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "2008", label: "Year Founded" },
            { value: "6 Yrs", label: "Integrated Program" },
            { value: "Top 1%", label: "Rural Students" },
            { value: "4 Campuses", label: "Across AP" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-md border border-slate-100 px-6 py-5 text-center">
              <div className="text-2xl font-extrabold text-[#000035]">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
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
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
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

      {/* ── Hero Banner ── */}
      <div className="relative bg-[#000035] overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #800000 0%, transparent 60%), radial-gradient(circle at 80% 50%, #4f46e5 0%, transparent 60%)" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-block px-5 py-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-[#800000] bg-[#800000]/10 border border-[#800000]/30 rounded-full">
            Rajiv Gandhi University of Knowledge Technologies
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Governing Council
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
            The Governing Council is the apex body that provides strategic direction and policy oversight to RGUKT, comprising distinguished academics, administrators, and industry experts.
          </p>
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Chairperson Spotlight ── */}
        {chair && (
          <div className="relative -mt-10 mb-16 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-64 flex-shrink-0 bg-gradient-to-br from-[#000035] to-[#1e1b6e] flex items-center justify-center p-8">
              {chair.photo ? (
                <img
                  src={chair.photo}
                  alt={chair.name}
                  className="w-36 h-36 rounded-full object-cover object-top border-4 border-white/30 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(chair.name)}&background=800000&color=fff&size=144`;
                  }}
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-[#800000]/30 border-4 border-white/20 flex items-center justify-center text-white text-5xl font-extrabold">
                  {chair.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <span className="inline-block mb-3 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-[#800000] bg-[#800000]/8 border border-[#800000]/20 rounded-full w-fit">
                Chairman · Member-Convener
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">{chair.name}</h2>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Council Members</h2>
            <div className="mt-3 mx-auto w-16 h-1 bg-[#800000] rounded-full" />
          </div>
        )}

        {/* ── Members Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Photo strip */}
              <div className="relative h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=000035&color=fff&size=208`;
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#000035] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
                    {member.name.charAt(0)}
                  </div>
                )}
                {/* Gradient overlay at bottom only */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-100/80 to-transparent pointer-events-none" />
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-[17px] font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#800000] transition-colors">
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
function GenericInstitutePage({ data, displayName, pageName }: { data: InstituteData; displayName: string; pageName?: string }) {

  // Page-specific hero accent colour
  const PAGE_ACCENT: Record<string, { pill: string; pillBg: string; pillBorder: string }> = {
    campuslife: { pill: "text-sky-300",   pillBg: "bg-sky-400/10",    pillBorder: "border-sky-400/30" },
    edusys:     { pill: "text-violet-300",pillBg: "bg-violet-400/10", pillBorder: "border-violet-400/30" },
    rtiinfo:    { pill: "text-amber-300", pillBg: "bg-amber-400/10",  pillBorder: "border-amber-400/30" },
    scst:       { pill: "text-emerald-300",pillBg:"bg-emerald-400/10",pillBorder:"border-emerald-400/30" },
  };
  const accent = PAGE_ACCENT[pageName?.toLowerCase() ?? ""] ?? {
    pill: "text-slate-300", pillBg: "bg-slate-400/10", pillBorder: "border-slate-400/30"
  };

  // Only show sections that have content and are not the address block (shown separately)
  const meaningfulSections = (data?.sections ?? []).filter(
    s => s.content.some(c => c.trim()) && !s.title.toLowerCase().includes("address")
  );
  const profiles = data?.profiles ?? [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero Banner ── */}
      <div className="relative bg-[#000035] overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(ellipse at 30% 60%, #800000 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #1e3a8a 0%, transparent 55%)" }}
        />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className={`inline-block px-5 py-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase ${accent.pill} ${accent.pillBg} border ${accent.pillBorder} rounded-full`}>
            RGUKT Ongole Campus
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {displayName}
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Text Sections ── */}
        {meaningfulSections.length > 0 && (
          <div className="space-y-6 mt-10">
            {meaningfulSections.map((section, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#800000] p-8 md:p-10"
              >
                {section.title.trim() && (
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-5 tracking-tight">
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
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Key Personnel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profiles.map((profile, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Photo */}
                  <div className="h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {profile.photo ? (
                      <img
                        src={profile.photo}
                        alt={profile.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=000035&color=fff&size=208`;
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#000035] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 border-t border-slate-100">
                    <h3 className="text-[15px] font-bold text-slate-900 mb-1 group-hover:text-[#800000] transition-colors">
                      {profile.name}
                    </h3>
                    <div className="space-y-1 mt-2">
                      {profile.text.filter(t => t.trim()).map((line, i) => {
                        // Auto-detect phone and email
                        const isPhone = /^\d[\d\s-]{7,}$/.test(line.trim());
                        const isEmail = line.includes("@");
                        return (
                          <p key={i} className={`text-sm leading-relaxed ${isEmail || isPhone ? "font-medium text-[#800000]" : "text-slate-500"}`}>
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
          <div key={i} className="mt-10 bg-[#000035]/5 border border-[#000035]/10 rounded-2xl p-7">
            <h3 className="text-lg font-bold text-[#000035] mb-3">Office Address</h3>
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
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent"></div>
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading {displayName}...</p>
        </div>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{displayName}</h1>
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

