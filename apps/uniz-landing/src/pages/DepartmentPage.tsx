import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { DepartmentData, FacultyMember, DeptCode } from "../types/api";
import { Mail, Phone, Users } from "lucide-react";
import { PersonPhoto } from "../components/common/PersonPhoto";
import { initials } from "../lib/initials";
import { usePageTitle } from "../lib/usePageTitle";
import { PageHero } from "../components/layout/PageHero";
import { Wrap } from "../components/layout/Wrap";
import { buttonVariants } from "../components/ui/button-variants";

// ── Full department names ──────────────────────────────────────────
const DEPT_NAMES: Record<string, string> = {
  CSE:         "Computer Science & Engineering",
  CIVIL:       "Civil Engineering",
  ECE:         "Electronics & Communication Engineering",
  EEE:         "Electrical & Electronics Engineering",
  ME:          "Mechanical Engineering",
  MATHEMATICS: "Mathematics",
  PHYSICS:     "Physics",
  CHEMISTRY:   "Chemistry",
  IT:          "Information Technology",
  BIOLOGY:     "Biology",
  ENGLISH:     "English",
  LIB:         "Central Library",
  MANAGEMENT:  "Management Studies",
  PED:         "Physical Education",
  TELUGU:      "Telugu",
  YOGA:        "Yoga",
};

// ── Bio helpers ────────────────────────────────────────────────────
function bioStr(bio: Record<string, unknown>, key: string): string {
  const v = bio?.[key];
  if (!v) return "";
  const s = Array.isArray(v) ? (v as unknown[]).filter(Boolean).join(", ") : String(v);
  return s.toLowerCase() === "null" ? "" : s.trim();
}

function allBioEntries(bio: Record<string, unknown>) {
  return Object.entries(bio ?? {})
    .map(([key, val]) => {
      const display = Array.isArray(val)
        ? (val as unknown[]).filter(Boolean).join("\n")
        : String(val ?? "");
      return { key, display: display.trim() };
    })
    .filter(e => e.display && e.display.toLowerCase() !== "null");
}

function FacultyPortrait({ faculty }: { faculty: FacultyMember }) {
  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-full bg-navy-100 dark:bg-surface-2">
      <PersonPhoto
        src={faculty.photo}
        name={faculty.name}
        className="size-full object-cover object-top"
        fallback={
          <div className="flex size-full items-center justify-center text-[13px] font-medium text-navy-900 dark:text-text">
            {initials(faculty.name)}
          </div>
        }
      />
    </div>
  );
}

// ── Faculty card — reference-style: photo left, info right ─────────
function FacultyCard({ faculty, href }: { faculty: FacultyMember; href: string }) {
  const bio = faculty.bio as Record<string, unknown> ?? {};
  const designation   = bioStr(bio, "Additional Responsibilities") || "Faculty";
  const specialization = bioStr(bio, "Specialization");
  const phone = bioStr(bio, "Phone") || bioStr(bio, "Mobile") || bioStr(bio, "Contact");
  const hasFullProfile = allBioEntries(bio).length > 0;

  return (
    <article className="flex min-w-0 gap-4 border-t border-border py-6">
      {/* ── Photo ── */}
      <FacultyPortrait faculty={faculty} />

      {/* ── Info ── */}
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-[17px] font-semibold leading-6 text-head">
          {faculty.name}
        </h3>
        <p className="mt-1 text-[14px] leading-5 text-text-2">
          {designation}
        </p>
        {specialization && (
          <p className="mt-2 text-[14px] leading-5 text-text-2">
            {specialization}
          </p>
        )}
        <div className="mt-3 space-y-1">
          <a href={`mailto:${faculty.email}`} className="inline-flex min-h-11 items-center gap-2 break-all text-[14px] leading-5 text-link hover:underline min-[640px]:min-h-0">
            <Mail className="shrink-0 text-accent" size={16} strokeWidth={1.75} aria-hidden="true" />
            {faculty.email}
          </a>
          {phone && (
            <p className="flex items-center gap-2 text-[14px] leading-5 text-text-2">
              <Phone className="shrink-0 text-accent" size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{phone}</span>
            </p>
          )}
        </div>
        {hasFullProfile && (
          <Link to={href} className={`${buttonVariants({ variant: "outline", size: "compact" })} mt-4`}>
            View profile
          </Link>
        )}
      </div>
    </article>
  );
}

// ── Main export ────────────────────────────────────────────────────
export function DepartmentPage() {
  const { deptCode } = useParams<{ deptCode: string }>();
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);

  const code     = deptCode?.toUpperCase() ?? "";
  const deptName = DEPT_NAMES[code] ?? `Department of ${code}`;
  usePageTitle(`${deptName} · RGUKT Ongole`);

  useEffect(() => {
    async function fetchData() {
      if (deptCode) {
        setLoading(true);
        const res = await getDepartmentStaff(deptCode.toUpperCase() as DeptCode);
        setData(res);
        setLoading(false);
      }
    }
    fetchData();
  }, [deptCode]);

  if (loading) {
    return (
      <div className="w-full" aria-busy="true">
        <span className="sr-only">Loading {deptName}</span>
        <Wrap className="py-12">
          <div className="skeleton h-8 w-72 max-w-full" />
          <div className="skeleton mt-4 h-4 w-48" />
          <div className="mt-10 grid grid-cols-1 gap-x-10 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-t border-border py-6">
                <div className="skeleton size-14 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Wrap>
      </div>
    );
  }

  const faculties = data?.faculties ?? [];

  return (
    <div>
      <PageHero
        eyebrow={`RGUKT Ongole · ${code}`}
        title={deptName}
        description={
          faculties.length > 0
            ? `${faculties.length} faculty member${faculties.length !== 1 ? "s" : ""} listed for this department.`
            : undefined
        }
      />

      {/* ── Faculty List ── */}
      <Wrap className="pb-16">
        {faculties.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-tint-2">
              <Users className="text-accent" size={32} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="mt-6 font-serif text-[22px] font-normal leading-[30px] tracking-[-0.01em] text-head">No faculty information available</p>
            <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-6 text-text-2">Faculty details for this department will be updated soon.</p>
          </div>
        ) : (
          <>
            <h2 className="u-h2 mt-8 text-head">
              Faculty
            </h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
              {faculties.map((faculty, index) => (
                <FacultyCard
                  key={index}
                  faculty={faculty}
                  href={`/departments/${deptCode}/faculty/${index}`}
                />
              ))}
            </div>
          </>
        )}
      </Wrap>
    </div>
  );
}
