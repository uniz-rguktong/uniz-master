import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { DepartmentData, FacultyMember, DeptCode } from "../types/api";
import { Mail, Phone, Users, ChevronRight } from "lucide-react";
import { PersonPhoto } from "../components/common/PersonPhoto";
import { initials } from "../lib/initials";
import { usePageTitle } from "../lib/usePageTitle";
import { PageIntro } from "../components/layout/PageIntro";

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

// ── Faculty card — reference-style: photo left, info right ─────────
function FacultyCard({ faculty, onOpen }: { faculty: FacultyMember; onOpen: () => void }) {
  const bio = faculty.bio as Record<string, unknown> ?? {};
  const designation   = bioStr(bio, "Additional Responsibilities") || "Faculty";
  const specialization = bioStr(bio, "Specialization");
  const phone = bioStr(bio, "Phone") || bioStr(bio, "Mobile") || bioStr(bio, "Contact");
  const hasFullProfile = allBioEntries(bio).length > 0;

  return (
    <div className="relative bg-white rounded-lg border border-line shadow-xs hover:border-navy-200 hover:shadow-[0_12px_32px_-16px_rgba(10,37,64,0.35)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-[box-shadow,transform,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group flex gap-0 overflow-hidden">

      {/* ── Photo ── */}
      <div className="w-28 sm:w-36 flex-shrink-0 bg-gradient-to-b from-surface-2 to-navy-200/40 flex items-center justify-center relative overflow-hidden border-r border-line" style={{ minHeight: "150px" }}>
        <PersonPhoto
              src={faculty.photo}
              name={faculty.name}
              className="w-full h-full object-contain" style={{ maxHeight: "150px" }}
              fallback={
                <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-navy text-white ring-4 ring-white flex items-center justify-center text-2xl font-bold">
              {initials(faculty.name)}
            </div>
          </div>
              }
            />
        {/* Subtle left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* ── Info ── */}
      <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0 min-h-[130px]">
        <div>
          {/* Name */}
          <h3 className="font-bold text-ink text-base leading-snug mb-0.5 group-hover:text-navy transition-colors">
            {faculty.name}
          </h3>

          {/* Designation */}
          <p className="inline-flex max-w-full rounded-full bg-navy-200/50 px-2 py-0.5 text-navy text-[11px] font-semibold mb-3 mt-1">
            {designation}
          </p>

          {/* Specialization */}
          {specialization && (
            <p className="text-ink-muted text-xs mb-3 line-clamp-2">
              {specialization}
            </p>
          )}

          {/* Contact info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Mail className="w-3.5 h-3.5 text-navy flex-shrink-0" />
              <a href={`mailto:${faculty.email}`} className="hover:text-navy hover:underline truncate">
                {faculty.email}
              </a>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Phone className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        {hasFullProfile && (
          <div className="mt-3 pt-3 border-t border-line">
            <button
              onClick={onOpen}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-md bg-navy px-3 text-[12px] font-semibold text-white hover:bg-brand-red transition-colors duration-150"
            >
              View Profile <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────
export function DepartmentPage() {
  const { deptCode } = useParams<{ deptCode: string }>();
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="min-h-[60vh] w-full bg-surface cursor-wait" aria-busy="true">
        <div className="bg-navy-950 h-56 sm:h-64 flex items-end">
          <p className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 text-white/70 font-semibold tracking-widest text-sm animate-pulse motion-reduce:animate-none">
            Loading {deptName}...
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-36 overflow-hidden rounded-lg border border-line bg-white shadow-xs">
              <div className="w-28 sm:w-36 bg-surface-2 animate-pulse motion-reduce:animate-none" />
              <div className="flex-1 p-5 space-y-3">
                <div className="h-3 w-1/2 rounded bg-surface-2" />
                <div className="h-3 w-1/3 rounded bg-surface-2" />
                <div className="h-3 w-2/3 rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const faculties = data?.faculties ?? [];

  return (
    <div className="min-h-screen bg-surface">

      <PageIntro
        kicker={`RGUKT Ongole · ${code}`}
        title={deptName}
        lede={
          faculties.length > 0
            ? `${faculties.length} faculty member${faculties.length === 1 ? "" : "s"}`
            : undefined
        }
      />

      <div className="relative z-20 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {faculties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-line shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-navy-200/50 ring-8 ring-surface-2 flex items-center justify-center">
              <Users className="w-8 h-8 text-navy-400" />
            </div>
            <p className="text-ink font-semibold text-lg">No Faculty Information Available</p>
            <p className="text-ink-subtle text-sm mt-2">Faculty details for this department will be updated soon.</p>
          </div>
        ) : (
          <>
            <h2 className="inline-flex items-center gap-2.5 rounded-lg border border-line bg-white px-4 py-2.5 shadow-xs text-sm font-semibold uppercase tracking-[0.16em] text-navy mb-6">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full inline-block" />
              Faculties
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faculties.map((faculty, index) => (
                <FacultyCard
                  key={index}
                  faculty={faculty}
                  onOpen={() => navigate(`/departments/${deptCode}/faculty/${index}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
