import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { ESTABLISHMENT } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

const KINDS = [
  "joined",
  "promotion",
  "transfer",
  "increment",
  "deputation",
  "retired",
  "other",
];

/** Staff master, designations and service events. */
export default function EstablishmentAdmin() {
  const f = (u: string, i?: RequestInit) => modFetch(`${ESTABLISHMENT}${u}`, i);
  const [rows, setRows] = useState<any[]>([]);
  const [desig, setDesig] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [ev, setEv] = useState({
    kind: "promotion",
    date: "",
    toValue: "",
    details: "",
  });
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (query = "") => {
    try {
      const [s, d] = await Promise.all([
        f(`/staff${query ? `?q=${encodeURIComponent(query)}` : ""}`),
        f("/designations"),
      ]);
      setRows(s.staff || []);
      setDesig(d.designations || {});
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Establishment is turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (!isModuleEnabled("ESTABLISHMENT"))
    return <DisabledState reason="Establishment is turned off" />;
  const open = async (r: any) => {
    try {
      const rec = r.record
        ? r.record
        : (
            await f("/staff", {
              method: "PUT",
              body: JSON.stringify({
                personType: r.personType,
                personId: r.personId,
                designation: r.designation,
                department: r.department,
              }),
            })
          ).record;
      setSel((await f(`/staff/${rec.id}`)).record);
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const addEvent = async () => {
    try {
      await f(`/staff/${sel.id}/events`, post({ ...ev }));
      toast.success("Event added");
      setSel((await f(`/staff/${sel.id}`)).record);
      load(q);
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <ModulePage
      title="Establishment"
      description="Staff master, designations and service history."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={cardCls}>
        {Object.entries(desig)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" . ")}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search name, username, designation"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className={btnCls} onClick={() => load(q)}>
          Search
        </button>
      </div>
      {sel && (
        <div className={`${cardCls} space-y-2`}>
          <div className="font-semibold">
            {sel.profile?.name || sel.personId} . {sel.designation || "-"} .{" "}
            {sel.department || "-"} . {sel.status}
          </div>
          <div className="text-sm">
            Leave this year:{" "}
            {sel.leave?.length
              ? sel.leave
                  .map((l: any) => `${l.leaveType} ${l.used}/${l.total}`)
                  .join(", ")
              : "none"}
          </div>
          {(sel.events || []).map((e: any) => (
            <div key={e.id} className="text-sm">
              {day(e.date)} . {e.kind} {e.fromValue && `from ${e.fromValue}`}{" "}
              {e.toValue && `to ${e.toValue}`} {e.details}
            </div>
          ))}
          <div className="grid gap-2 md:grid-cols-5">
            <select
              className={inputCls}
              value={ev.kind}
              onChange={(e) => setEv({ ...ev, kind: e.target.value })}
            >
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <input
              className={inputCls}
              type="date"
              value={ev.date}
              onChange={(e) => setEv({ ...ev, date: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="New value"
              value={ev.toValue}
              onChange={(e) => setEv({ ...ev, toValue: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Details"
              value={ev.details}
              onChange={(e) => setEv({ ...ev, details: e.target.value })}
            />
            <button type="button" className={btnCls} onClick={addEvent}>
              Add event
            </button>
          </div>
        </div>
      )}
      {rows.map((r) => (
        <div
          key={`${r.personType}:${r.personId}`}
          className={`${cardCls} flex flex-wrap justify-between gap-2`}
        >
          <span>
            {r.name} . {r.personId} . {r.personType} . {r.designation || "-"} .{" "}
            {r.department || "-"}
          </span>
          <button type="button" className={btnCls} onClick={() => open(r)}>
            {r.record ? "Open" : "Create record"}
          </button>
        </div>
      ))}
    </ModulePage>
  );
}
