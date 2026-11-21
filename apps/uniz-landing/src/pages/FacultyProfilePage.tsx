import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDepartmentStaff } from "../types/api";
import type { FacultyMember, DeptCode } from "../types/api";
import { ArrowLeft } from "lucide-react";
import { PersonPhoto } from "../components/common/PersonPhoto";
import { initials } from "../lib/initials";
import { splitFacultyName } from "../lib/facultyName";
import { usePageTitle } from "../lib/usePageTitle";
import { CampusBoot } from "../components/CampusBoot";
import { Wrap } from "../components/layout/Wrap";

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

  const [faculty, setFaculty] = useState<FacultyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const code = deptCode?.toUpperCase() ?? "";
  const deptName = DEPT_NAMES[code] ?? code;
  const { name, qualification } = splitFacultyName(faculty?.name ?? "");
  usePageTitle(
    faculty ? `${name} · ${deptName}` : `${deptName} · RGUKT Ongole`,
  );

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
      <CampusBoot label="Loading profile" className="min-h-[50vh]" />
    );
  }

  if (!faculty) {
    return (
      <Wrap className="py-20 text-center">
        <p className="font-serif text-[22px] font-normal leading-[30px] text-head">Profile not found.</p>
        <Link to={`/departments/${deptCode}`} className="mt-4 inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline">
          Go back
        </Link>
      </Wrap>
    );
  }

  const bio = faculty.bio as Record<string, unknown> ?? {};
  const entries = allBioEntries(bio);
  const specialization = bioStr(bio, "Specialization");
  const experience     = bioStr(bio, "Experience");
  const role           = bioStr(bio, "Additional Responsibilities");

  return (
    <div>
      <Wrap className="pt-8">
        <Link
          to={`/departments/${deptCode}`}
          className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium leading-5 text-link hover:underline"
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Back to {deptName}
        </Link>
      </Wrap>

      <Wrap className="py-8 pb-16">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="size-24 shrink-0 overflow-hidden rounded-full bg-navy-100 dark:bg-surface-2">
            <PersonPhoto
              src={faculty.photo}
              name={faculty.name}
              className="size-full object-cover object-top"
              fallback={
                <div className="flex size-full items-center justify-center text-[18px] font-medium text-navy-900 dark:text-text">
                  {initials(faculty.name)}
                </div>
              }
            />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] leading-6 text-text-2">RGUKT Ongole · {code}</p>
            <h1 className="u-page mt-2 text-head">
              {name}
            </h1>
            {qualification && (
              <p className="mt-2 text-[15px] leading-6 text-text-2">{qualification}</p>
            )}
            {role && (
              <p className="mt-3 text-[17px] leading-[26px] text-text-2">{role}</p>
            )}
          </div>
        </div>

        <dl className="mt-10 max-w-[640px] border-t border-border">
          {specialization && (
            <div className="grid gap-1 border-b border-border py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
              <dt className="text-[14px] font-medium leading-5 text-text-2">Specialization</dt>
              <dd className="text-[15px] leading-6 text-text">{specialization}</dd>
            </div>
          )}
          {experience && (
            <div className="grid gap-1 border-b border-border py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
              <dt className="text-[14px] font-medium leading-5 text-text-2">Experience</dt>
              <dd className="text-[15px] leading-6 text-text">
                {experience} {experience.toLowerCase().includes('year') ? '' : 'years overall experience'}
              </dd>
            </div>
          )}
          <div className="grid gap-1 border-b border-border py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
            <dt className="text-[14px] font-medium leading-5 text-text-2">Contact</dt>
            <dd>
              <a href={`mailto:${faculty.email}`} className="inline-flex min-h-11 items-center break-all text-[15px] leading-6 text-link hover:underline min-[640px]:min-h-0">
                {faculty.email}
              </a>
            </dd>
          </div>
        </dl>

        {entries.length > 0 && (
          <div className="mt-12 border-t border-border pt-10">
            <h2 className="u-h2 text-head">
              Detailed profile
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
              {entries.map(({ key, items }) => (
                <div key={key} className="min-w-0">
                  <h3 className="text-[18px] font-semibold leading-[26px] tracking-[-0.01em] text-head">
                    {key}
                  </h3>
                  {items.length === 1 && !items[0].match(/^[0-9]+\./) ? (
                    <p className="mt-3 text-[15px] leading-6 text-text">{items[0]}</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {items.map((item, i) => {
                        // Strip leading manual list numbers like "1.", "1. ", "12."
                        const cleanItem = item.replace(/^[0-9]+\.\s*/, "");
                        return (
                          <li key={i} className="text-[15px] leading-6 text-text">
                            {cleanItem}
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
      </Wrap>
    </div>
  );
}
