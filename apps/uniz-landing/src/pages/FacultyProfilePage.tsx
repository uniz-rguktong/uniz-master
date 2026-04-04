import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { FacultyMember, DeptCode } from "../types/api";
import { Mail, ArrowLeft, BookOpen, Briefcase, FlaskConical, Award, FileText } from "lucide-react";

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

// Section icon hint map
const SECTION_ICONS: Record<string, React.ReactNode> = {
  "Specialization":            <FlaskConical className="w-4 h-4" />,
  "Research Areas":            <BookOpen className="w-4 h-4" />,
  "Experience":                <Briefcase className="w-4 h-4" />,
  "Additional Responsibilities": <Award className="w-4 h-4" />,
};

function bioStr(bio: Record<string, unknown>, key: string): string {
  const v = bio?.[key];
  if (!v) return "";
  const s = Array.isArray(v) ? (v as unknown[]).filter(Boolean).join(", ") : String(v);
  return s.toLowerCase() === "null" ? "" : s.trim();
}

function allBioEntries(bio: Record<string, unknown>) {
  return Object.entries(bio ?? {})
    .filter(([, val]) => {
      if (!val) return false;
      const s = String(val).trim();
      return s !== "" && s.toLowerCase() !== "null";
    })
    .map(([key, val]) => {
      let items: string[] = [];
      if (Array.isArray(val)) {
        items = val.filter(Boolean).map(String);
      } else {
        items = String(val).split("\n").filter(Boolean);
      }
      return { key, items: items.map(i => i.trim()).filter(Boolean) };
    })
    .filter(e => e.items.length > 0);
}

export function FacultyProfilePage() {
  const { deptCode, facultyIndex } = useParams<{ deptCode: string; facultyIndex: string }>();
  const navigate = useNavigate();

  const [faculty, setFaculty] = useState<FacultyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const code = deptCode?.toUpperCase() ?? "";
  const deptName = DEPT_NAMES[code] ?? code;

  useEffect(() => {
    async function load() {
      if (!deptCode || facultyIndex === undefined) return;
      setLoading(true);
      const res = await getDepartmentStaff(deptCode.toUpperCase() as DeptCode);
      const idx = parseInt(facultyIndex, 10);
      setFaculty(res?.faculties?.[idx] ?? null);
      setLoading(false);
    }
    load();
  }, [deptCode, facultyIndex]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#000035] border-t-transparent" />
          <p className="text-slate-600 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg font-semibold">Profile not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-[#800000] text-sm font-bold hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const bio = faculty.bio as Record<string, unknown> ?? {};
  const entries = allBioEntries(bio);
  const specialization = bioStr(bio, "Specialization");
  const experience     = bioStr(bio, "Experience");
  const role           = bioStr(bio, "Additional Responsibilities");

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top Nav Bar ── */}
      <div className="border-b border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/departments/${deptCode}`)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#800000] text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {deptName}
          </button>
          <span className="hidden sm:inline-block px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase text-[#800000] bg-[#800000]/5 border border-[#800000]/10 rounded-full">
            RGUKT Ongole · {code}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
          {/* Photo */}
          <div className="w-full md:w-56 flex-shrink-0 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
            {faculty.photo ? (
              <img
                src={faculty.photo}
                alt={faculty.name}
                className="w-full max-w-[200px] h-auto object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=000035&color=fff&size=200`;
                }}
              />
            ) : (
              <div className="w-full aspect-square max-w-[200px] rounded-xl bg-[#000035] flex items-center justify-center text-white text-6xl font-extrabold shadow-sm">
                {faculty.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">
              {faculty.name}
            </h1>
            {role && (
              <p className="text-lg text-[#800000] font-semibold mb-6">{role}</p>
            )}

            <div className="space-y-4 max-w-2xl">
              {specialization && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-slate-50 border border-slate-100 flex-shrink-0">
                    <FlaskConical className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Specialization</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{specialization}</p>
                  </div>
                </div>
              )}
              
              {experience && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-slate-50 border border-slate-100 flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Experience</p>
                    <p className="text-slate-700 text-sm">{experience} {experience.toLowerCase().includes('year') ? '' : 'years overall experience'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-md bg-rose-50 border border-rose-100 flex-shrink-0">
                  <Mail className="w-4 h-4 text-[#800000]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Contact</p>
                  <a href={`mailto:${faculty.email}`} className="text-[#800000] text-sm font-semibold hover:underline">
                    {faculty.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bio Sections ── */}
        {entries.length > 0 && (
          <div className="border-t border-slate-100 pt-12">
            <h2 className="text-xl font-extrabold text-slate-900 mb-8 tracking-tight">
              Detailed Profile
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
              {entries.map(({ key, items }) => (
                <div key={key}>
                  <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#000035] mb-3 border-b border-slate-100 pb-2">
                    <span className="text-[#800000]/60">
                      {SECTION_ICONS[key] ?? <FileText className="w-4 h-4" />}
                    </span>
                    {key}
                  </h3>
                  {items.length === 1 && !items[0].match(/^[0-9]+\./) ? (
                    <p className="text-slate-700 text-sm leading-relaxed">{items[0]}</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {items.map((item, i) => {
                        // Strip leading manual list numbers like "1.", "1. ", "12."
                        const cleanItem = item.replace(/^[0-9]+\.\s*/, "");
                        return (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                            <span className="text-[#800000]/40 font-bold mt-0.5 flex-shrink-0">•</span>
                            <span>{cleanItem}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
