import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { CLUBS } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

const STATUSES = ["proposed", "ongoing", "completed", "cancelled"];

/** Consultancy register: faculty, client, value, status. */
export default function ConsultancyAdmin() {
  const f = (u: string, i?: RequestInit) =>
    modFetch(`${CLUBS}/consultancy${u}`, i);
  const [rows, setRows] = useState<any[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [d, setD] = useState({
    title: "",
    client: "",
    faculty: "",
    department: "",
    valueInr: "",
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await f("");
      setRows(r.projects || []);
      setTotals(r.totals || {});
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Consultancy is turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (!isModuleEnabled("CLUBS"))
    return <DisabledState reason="Consultancy is turned off" />;
  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const inr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
  return (
    <ModulePage
      title="Consultancy"
      description="Consultancy projects with faculty, client, value and status."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={cardCls}>
        {STATUSES.map((s) => `${s}: ${inr(totals[s] || 0)}`).join(" . ")}
      </div>
      <div className={`${cardCls} grid gap-2 md:grid-cols-4`}>
        {(
          ["title", "client", "faculty", "department", "valueInr"] as const
        ).map((k) => (
          <input
            key={k}
            className={inputCls}
            placeholder={
              k === "valueInr"
                ? "Value (Rs)"
                : k === "faculty"
                  ? "Faculty usernames"
                  : k
            }
            value={d[k]}
            onChange={(e) => setD({ ...d, [k]: e.target.value })}
          />
        ))}
        <input
          className={inputCls}
          type="date"
          value={d.startDate}
          onChange={(e) => setD({ ...d, startDate: e.target.value })}
        />
        <input
          className={inputCls}
          type="date"
          value={d.endDate}
          onChange={(e) => setD({ ...d, endDate: e.target.value })}
        />
        <button
          type="button"
          className={btnCls}
          onClick={() =>
            run(
              () =>
                f(
                  "",
                  post({
                    title: d.title,
                    client: d.client,
                    faculty: d.faculty || undefined,
                    department: d.department || undefined,
                    valueInr: Number(d.valueInr || 0),
                    startDate: d.startDate || undefined,
                    endDate: d.endDate || undefined,
                  }),
                ),
              "Project added",
            )
          }
        >
          Add project
        </button>
      </div>
      {rows.map((p) => (
        <div
          key={p.id}
          className={`${cardCls} flex flex-wrap justify-between gap-2`}
        >
          <span>
            {p.title} . {p.client} . {p.faculty || "-"} . {inr(p.valueInr)} .{" "}
            {day(p.startDate)} to {day(p.endDate)}
          </span>
          <select
            className={inputCls}
            value={p.status}
            onChange={(e) =>
              run(
                () =>
                  f(`/${p.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ status: e.target.value }),
                  }),
                "Updated",
              )
            }
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      ))}
    </ModulePage>
  );
}
