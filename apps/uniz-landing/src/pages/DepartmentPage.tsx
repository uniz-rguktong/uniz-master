import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { DepartmentData, FacultyMember, DeptCode } from "../types/api";
import { Mail, Phone, Users, ChevronRight } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-slate-200 hover:border-[#800000]/30 hover:shadow-md transition-all duration-200 group flex gap-0 overflow-hidden">

      {/* ── Photo ── */}
      <div className="w-36 flex-shrink-0 bg-white flex items-center justify-center relative overflow-hidden border-r border-slate-100" style={{ minHeight: "150px" }}>
        {faculty.photo ? (
          <img
            src={faculty.photo}
            alt={faculty.name}
            className="w-full h-full object-contain"
            style={{ maxHeight: "150px" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=e2e8f0&color=475569&size=112`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-extrabold">
              {faculty.name.charAt(0)}
            </div>
          </div>
        )}
        {/* Subtle left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#800000] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* ── Info ── */}
      <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0 min-h-[130px]">
        <div>
          {/* Name */}
          <h3 className="font-extrabold text-slate-900 text-[15px] leading-snug mb-0.5 group-hover:text-[#800000] transition-colors">
            {faculty.name}
          </h3>

          {/* Designation */}
          <p className="text-slate-500 text-xs mb-3 font-medium">
            {designation}
          </p>

          {/* Specialization */}
          {specialization && (
            <p className="text-slate-500 text-xs mb-3 line-clamp-2 italic">
              {specialization}
            </p>
          )}

          {/* Contact info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 text-[#800000] flex-shrink-0" />
              <a href={`mailto:${faculty.email}`} className="hover:text-[#800000] hover:underline truncate">
                {faculty.email}
              </a>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        {hasFullProfile && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#000035] hover:text-[#800000] transition-colors uppercase tracking-wide"
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
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white cursor-wait">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent" />
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">
            Loading {deptName}...
          </p>
        </div>
      </div>
    );
  }

  const faculties = data?.faculties ?? [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero Banner ── */}
      <div className="relative bg-[#000035] overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 60%, #800000 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, #1e3a8a 0%, transparent 55%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-block px-5 py-2 mb-5 text-xs font-bold tracking-[0.2em] uppercase text-[#800000] bg-[#800000]/10 border border-[#800000]/30 rounded-full">
            RGUKT Ongole · {code}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {deptName}
          </h1>
          {faculties.length > 0 && (
            <p className="mt-4 text-slate-400 text-sm">
              {faculties.length} Faculty Member{faculties.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      {/* ── Faculty List ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {faculties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold text-lg">No Faculty Information Available</p>
            <p className="text-slate-400 text-sm mt-2">Faculty details for this department will be updated soon.</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-slate-900 mb-6 tracking-tight flex items-center gap-2 uppercase">
              <span className="w-1 h-5 bg-[#800000] rounded-full inline-block" />
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
