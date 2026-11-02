import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { PLACEMENT } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

const STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

/** Placement cell view: companies, drives, applicant pipeline, offer stats. */
export default function PlacementAdmin() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<Record<string, any[]>>({});
  const [company, setCompany] = useState("");
  const [d, setD] = useState({
    companyId: "",
    title: "",
    jobRole: "",
    ctcLpa: "",
    location: "",
    branches: "",
    minCgpa: "",
    maxBacklogs: "",
    deadline: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const f = (u: string, i?: RequestInit) => modFetch(`${PLACEMENT}${u}`, i);

  const load = useCallback(async () => {
    try {
      const [c, dr, s] = await Promise.all([
        f("/companies"),
        f("/drives"),
        f("/stats"),
      ]);
      setCompanies(c.companies || []);
      setDrives(dr.drives || []);
      setStats(s.stats);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Placement is turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("PLACEMENT"))
    return <DisabledState reason="Placement is turned off" />;

  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      const r = await fn();
      toast.success(ok);
      load();
      return r;
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const openApps = async (id: string) => {
    try {
      const r = await f(`/drives/${id}/applications`);
      setApps((p) => ({ ...p, [id]: r.applications || [] }));
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const createDrive = () =>
    run(
      () =>
        f(
          "/drives",
          post({
            companyId: d.companyId,
            title: d.title,
            jobRole: d.jobRole,
            ctcLpa: Number(d.ctcLpa || 0),
            location: d.location || undefined,
            description: d.description || undefined,
            branches: d.branches
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
            minCgpa: Number(d.minCgpa || 0),
            maxBacklogs: d.maxBacklogs === "" ? 99 : Number(d.maxBacklogs),
            deadline: d.deadline,
          }),
        ),
      "Drive created",
    );

  return (
    <ModulePage
      title="Placements"
      description="Companies, drives with eligibility, applicant status and offers."
    >
 {error && <p className="text-sm text-red-600">{error}</p>}
      {stats && (
        <div className={cardCls}>
          {stats.placedStudents} students placed . {stats.offers} offers . avg{" "}
          {stats.avgCtcLpa} LPA . max {stats.maxCtcLpa} LPA
          {Object.keys(stats.byCompany || {}).length > 0 && (
 <p className="text-slate-600">
              {Object.entries(stats.byCompany)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" . ")}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder="New company name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button
          type="button"
          className={btnCls}
          onClick={() =>
            run(
              () => f("/companies", post({ name: company })),
              "Company added",
            ).then(() => setCompany(""))
          }
        >
          Add company
        </button>
      </div>
      <div className={`${cardCls} grid gap-2 md:grid-cols-3`}>
        <select
          className={inputCls}
          value={d.companyId}
          onChange={(e) => setD({ ...d, companyId: e.target.value })}
        >
          <option value="">Company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={inputCls}
          placeholder="Drive title"
          value={d.title}
          onChange={(e) => setD({ ...d, title: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Job role"
          value={d.jobRole}
          onChange={(e) => setD({ ...d, jobRole: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="CTC (LPA)"
          value={d.ctcLpa}
          onChange={(e) => setD({ ...d, ctcLpa: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Location"
          value={d.location}
          onChange={(e) => setD({ ...d, location: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Branches, e.g. CSE,ECE (blank = all)"
          value={d.branches}
          onChange={(e) => setD({ ...d, branches: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Min CGPA"
          value={d.minCgpa}
          onChange={(e) => setD({ ...d, minCgpa: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Max backlogs"
          value={d.maxBacklogs}
          onChange={(e) => setD({ ...d, maxBacklogs: e.target.value })}
        />
        <input
          className={inputCls}
          type="date"
          value={d.deadline}
          onChange={(e) => setD({ ...d, deadline: e.target.value })}
        />
        <textarea
          className={`${inputCls} md:col-span-3`}
          placeholder="Description"
          value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })}
        />
        <button
          type="button"
          className={`${btnCls} md:col-span-3`}
          onClick={createDrive}
        >
          Create drive
        </button>
      </div>
      {drives.map((dr) => (
        <div key={dr.id} className={`${cardCls} space-y-2`}>
          <div className="flex flex-wrap justify-between gap-2">
            <span>
              {dr.company} . {dr.title} . {dr.status} . deadline{" "}
              {day(dr.deadline)}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
 className="rounded-md border px-2 py-1"
                onClick={() => openApps(dr.id)}
              >
                Applicants
              </button>
              {dr.status === "open" && (
                <button
                  type="button"
 className="rounded-md border px-2 py-1"
                  onClick={() =>
                    run(
                      () => f(`/drives/${dr.id}/close`, post()),
                      "Drive closed",
                    )
                  }
                >
                  Close
                </button>
              )}
            </span>
          </div>
          {(apps[dr.id] || []).map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t pt-1"
            >
              <span>
                {a.username} .{" "}
                <a
 className="text-blue-700 underline"
                  href={a.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  resume
                </a>
              </span>
              <select
                className={inputCls}
                value={a.status}
                onChange={(e) =>
                  run(
                    () =>
                      f(
                        `/applications/${a.id}/status`,
                        post({ status: e.target.value }),
                      ),
                    "Updated",
                  ).then(() => openApps(dr.id))
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}
    </ModulePage>
  );
}
