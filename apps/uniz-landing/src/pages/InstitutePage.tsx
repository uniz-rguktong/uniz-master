import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInstituteInfo } from "../types/api";
import type { InstituteData, InstitutePage as InstitutePageType, InstituteProfile } from "../types/api";
import { PersonPhoto } from "../components/common/PersonPhoto";
import { initials } from "../lib/initials";
import { usePageTitle } from "../lib/usePageTitle";
import { PageHero } from "../components/layout/PageHero";
import { CampusBoot } from "../components/CampusBoot";
import { Wrap } from "../components/layout/Wrap";

const PAGE_NAMES: Record<string, string> = {
  aboutrgukt: "About RGUKT",
  campuslife: "Campus Life",
  edusys: "Education System",
  govcouncil: "Governing Council",
  rtiinfo: "RTI Information",
  scst: "SC/ST Cell",
};

function Portrait({
  person,
  size,
}: {
  person: InstituteProfile;
  size: 56 | 96;
}) {
  const box = size === 96 ? "size-24 text-[18px]" : "size-14 text-[13px]";
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-navy-100 dark:bg-surface-2 ${size === 96 ? "size-24" : "size-14"}`}>
      <PersonPhoto
        src={person.photo}
        name={person.name}
        className="size-full object-cover object-top"
        fallback={
          <div className={`flex size-full items-center justify-center font-medium text-navy-900 dark:text-text ${box}`}>
            {initials(person.name)}
          </div>
        }
      />
    </div>
  );
}

function ContactLines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1">
      {lines.filter((line) => line.trim()).map((line, i) => {
        // Auto-detect phone and email
        const trimmed = line.trim();
        const isPhone = /^\d[\d\s-]{7,}$/.test(trimmed);
        const isEmail = trimmed.includes("@");
        return (
          <p key={i} className="text-[15px] leading-6 text-text-2">
            {isEmail ? (
              <a href={`mailto:${trimmed}`} className="text-link hover:underline">{trimmed}</a>
            ) : isPhone ? (
              <a href={`tel:${trimmed.replace(/\s/g, "")}`} className="text-link hover:underline">{trimmed}</a>
            ) : trimmed}
          </p>
        );
      })}
    </div>
  );
}

// Section icon mapping for About RGUKT
// ────────────────────────────────────────────────────────────
//  About RGUKT: premium dedicated render
// ────────────────────────────────────────────────────────────
function AboutRguktPage({ data }: { data: InstituteData }) {
  const sections = data?.sections ?? [];

  return (
    <div>
      <PageHero
        eyebrow="Rajiv Gandhi University of Knowledge Technologies"
        title="About RGUKT"
        description="Residential, technology-driven higher education for gifted rural youth of Andhra Pradesh."
      />

      {/* ── Key Stats Bar ── */}
      <Wrap className="pb-16">
        {/* ── Sections ── */}
        <div className="mt-8">
          {sections.map((section, idx) => (
            <section key={idx} className="border-t border-border py-8">
              {section.title.trim() && (
                <h2 className="u-h2 text-head">
                  {section.title}
                </h2>
              )}
              <div className="mt-4 space-y-4">
                {section.content.map((para, pIdx) => (
                  <p key={pIdx} className="u-prose whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Wrap>
    </div>
  );
}


function GovCouncilPage({ data }: { data: InstituteData }) {
  const profiles = data?.profiles ?? [];
  // First profile is always the Chairperson/Chair
  const chair = profiles[0];
  const members = profiles.slice(1);

  return (
    <div>
      <PageHero
        eyebrow="Rajiv Gandhi University of Knowledge Technologies"
        title="Governing Council"
        description="Strategic direction and policy oversight for RGUKT from academics, administrators, and industry representatives."
      />

      <Wrap className="pb-16">
        {/* ── Chairperson Spotlight ── */}
        {chair && (
          <div className="mt-8 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-start">
            <Portrait person={chair} size={96} />
            <div className="min-w-0">
              <h2 className="u-h2 text-head">{chair.name}</h2>
              <div className="mt-3 max-w-[65ch]">
                {chair.text.map((line, i) => (
                  <p key={i} className="text-[15px] leading-6 text-text-2">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Section heading ── */}
        {members.length > 0 && (
          <h2 className="u-h2 mt-12 text-head">Council members</h2>
        )}

        {/* ── Members Grid ── */}
        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, idx) => (
            <div key={idx} className="min-w-0 border-t border-border pt-6">
              {/* Photo */}
              <Portrait person={member} size={96} />
              {/* Gradient overlay at bottom only */}
              {/* Info */}
              <h3 className="mt-4 text-[17px] font-semibold leading-6 text-head">
                {member.name}
              </h3>
              <div className="mt-2">
                {member.text.filter(t => t.trim()).map((line, i) => (
                  <p key={i} className="text-[15px] leading-6 text-text-2">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Wrap>
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
    <div>
      <PageHero eyebrow="RGUKT Ongole campus" title={displayName} />

      <Wrap className="pb-16">
        {/* ── Text Sections ── */}
        {meaningfulSections.length > 0 && (
          <div className="mt-4">
            {meaningfulSections.map((section, idx) => (
              <section key={idx} className="border-t border-border py-8">
                {section.title.trim() && (
                  <h2 className="u-h2 text-head">
                    {section.title.trim()}
                  </h2>
                )}
                <div className="mt-4 space-y-4">
                  {section.content.filter(c => c.trim()).map((para, pIdx) => (
                    <p key={pIdx} className="u-prose whitespace-pre-line">
                      {para.replace(/\n\s+/g, " ").trim()}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Profiles (RTI / SC/ST style contact cards) ── */}
        {profiles.length > 0 && (
          <div className="mt-12">
            <h2 className="u-h2 text-head">Key personnel</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
              {profiles.map((profile, idx) => (
                <div key={idx} className="min-w-0 border-t border-border pt-6">
                  {/* Photo */}
                  <Portrait person={profile} size={96} />
                  {/* Info */}
                  <h3 className="mt-4 text-[17px] font-semibold leading-6 text-head">
                    {profile.name}
                  </h3>
                  <div className="mt-2">
                    <ContactLines lines={profile.text} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Office Address block (for RTI / SC/ST) ── */}
        {(data?.sections ?? []).filter(s => s.title.toLowerCase().includes("address")).map((s, i) => (
          <div key={i} className="mt-10 max-w-[65ch] border-t border-border pt-6">
            <h2 className="u-h2 text-head">Office address</h2>
            <address className="mt-4 space-y-1 text-[16px] leading-[26px] text-text not-italic">
              {s.content.filter(c => c.trim()).map((line, idx) => (
                <p key={idx}>{line.trim()}</p>
              ))}
            </address>
          </div>
        ))}
      </Wrap>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  Main export
// ────────────────────────────────────────────────────────────
export function InstitutePage({
  page,
  title,
}: {
  page?: string;
  title?: string;
} = {}) {
  const params = useParams<{ pageName?: string }>();
  const pageName = page ?? params.pageName;
  const [data, setData] = useState<InstituteData | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = title
    ?? PAGE_NAMES[pageName?.toLowerCase() ?? ""]
    ?? (pageName?.replace(/([A-Z])/g, " $1").trim() ?? "");
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
      <Wrap className="py-16">
        <h1 className="u-page text-head">{displayName}</h1>
        <p className="mt-4 text-[15px] leading-6 text-text-2">Detailed information is not available for this section.</p>
      </Wrap>
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
