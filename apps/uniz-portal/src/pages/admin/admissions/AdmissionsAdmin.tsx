import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { ADMISSIONS } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

const STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "rejected",
];

/** Admission cycles, application review, export accepted to the Add Students upload. */
export default function AdmissionsAdmin() {
  const f = (u: string, i?: RequestInit) => modFetch(`${ADMISSIONS}${u}`, i);
  const [cycles, setCycles] = useState<any[]>([]);
  const [cid, setCid] = useState("");
  const [apps, setApps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<any>(null);
  const [nc, setNc] = useState({
    name: "",
    academicYear: "",
    programs: "",
    opensAt: "",
    closesAt: "",
    feeInr: "",
  });
  const [batch, setBatch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loadCycles = useCallback(async () => {
    try {
      const r = await f("/cycles");
      setCycles(r.cycles || []);
      setCid((c) => c || r.cycles?.[0]?.id || "");
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Admissions are turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const loadApps = useCallback(async () => {
    if (!cid) return;
    try {
      const [a, s] = await Promise.all([
        f(`/cycles/${cid}/applications${filter ? `?status=${filter}` : ""}`),
        f(`/cycles/${cid}/stats`),
      ]);
      setApps(a.applications || []);
      setStats(s.stats);
    } catch (e: any) {
      toast.error(e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, filter]);
  useEffect(() => {
    loadCycles();
  }, [loadCycles]);
  useEffect(() => {
    loadApps();
  }, [loadApps]);
  if (!isModuleEnabled("ADMISSIONS"))
    return <DisabledState reason="Admissions are turned off" />;
  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      const r = await fn();
      toast.success(ok);
      loadCycles();
      loadApps();
      return r;
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const exportCsv = async (mark: boolean) => {
    const r = await run(
      () => f(`/cycles/${cid}/export`, post({ batch, mark })),
      mark ? "Exported and marked converted" : "Exported",
    );
    if (!r) return;
    const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `admitted-${batch || "batch"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <ModulePage
      title="Admissions"
      description="Cycles, applications, review. Public form at /admissions."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={`${cardCls} grid gap-2 md:grid-cols-3`}>
        <input
          className={inputCls}
          placeholder="Cycle name"
          value={nc.name}
          onChange={(e) => setNc({ ...nc, name: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Academic year, e.g. 2027-28"
          value={nc.academicYear}
          onChange={(e) => setNc({ ...nc, academicYear: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Programs, comma separated"
          value={nc.programs}
          onChange={(e) => setNc({ ...nc, programs: e.target.value })}
        />
        <input
          className={inputCls}
          type="date"
          value={nc.opensAt}
          onChange={(e) => setNc({ ...nc, opensAt: e.target.value })}
        />
        <input
          className={inputCls}
          type="date"
          value={nc.closesAt}
          onChange={(e) => setNc({ ...nc, closesAt: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Application fee (Rs)"
          value={nc.feeInr}
          onChange={(e) => setNc({ ...nc, feeInr: e.target.value })}
        />
        <button
          type="button"
          className={`${btnCls} md:col-span-3`}
          onClick={() =>
            run(
              () =>
                f(
                  "/cycles",
                  post({
                    ...nc,
                    feeInr: Number(nc.feeInr || 0),
                    programs: nc.programs
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }),
                ),
              "Cycle created",
            )
          }
        >
          Create cycle
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className={inputCls}
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({day(c.opensAt)} to {day(c.closesAt)})
              {c.active ? "" : " . closed"}
            </option>
          ))}
        </select>
        {cid && (
          <button
            type="button"
            className="rounded-md border px-2"
            onClick={() => {
              const c = cycles.find((x) => x.id === cid);
              run(
                () =>
                  f(`/cycles/${cid}`, {
                    method: "PUT",
                    body: JSON.stringify({ active: !c?.active }),
                  }),
                "Saved",
              );
            }}
          >
            Open or close
          </button>
        )}
        <select
          className={inputCls}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {[...STATUSES, "converted"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {stats && (
        <div className={cardCls}>
          {stats.total} applications .{" "}
          {Object.entries(stats.byStatus)
            .map(([k, v]) => `${k} ${v}`)
            .join(" . ")}
        </div>
      )}
      {cid && (
        <div className={`${cardCls} flex flex-wrap items-center gap-2`}>
          <span>
            Accepted to students: download the Add Students CSV, fill the ID
            column, upload it in Students.
          </span>
          <input
            className={inputCls}
            placeholder="Batch, e.g. O27"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border px-2 py-1"
            onClick={() => exportCsv(false)}
          >
            Download
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() => exportCsv(true)}
          >
            Download and mark converted
          </button>
        </div>
      )}
      {apps.map((a) => (
        <div key={a.id} className={`${cardCls} space-y-1`}>
          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              className="text-left"
              onClick={async () =>
                setOpen(
                  open?.id === a.id
                    ? null
                    : (await f(`/applications/${a.id}`)).application,
                )
              }
            >
              {a.refNo} . {a.name} . {a.program} . {a.percentage}% . {a.status}{" "}
              . fee {a.feeStatus}
            </button>
            {a.status !== "converted" && (
              <select
                className={inputCls}
                value={a.status}
                onChange={(e) =>
                  run(
                    () =>
                      f(
                        `/applications/${a.id}/review`,
                        post({ status: e.target.value }),
                      ),
                    "Updated",
                  )
                }
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
          {open?.id === a.id && (
            <div className="text-slate-600">
              {open.email} . {open.phone} . {open.gender} . {open.category} .{" "}
              {open.board} . DOB {open.dob} . {open.guardian}
              <p>{open.address}</p>
              {open.documents.map((d: any) => (
                <a
                  key={d.id}
                  className="mr-3 text-blue-700 underline"
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.kind}
                </a>
              ))}
              <button
                type="button"
                className="ml-2 rounded-md border px-2"
                onClick={() =>
                  run(
                    () =>
                      f(
                        `/applications/${a.id}/review`,
                        post({ status: a.status, feeStatus: "waived" }),
                      ),
                    "Fee waived",
                  )
                }
              >
                Waive fee
              </button>
            </div>
          )}
        </div>
      ))}
    </ModulePage>
  );
}
