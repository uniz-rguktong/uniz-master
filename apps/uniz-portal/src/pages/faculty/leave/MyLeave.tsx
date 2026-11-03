import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import {
  LEAVE_APPLY,
  LEAVE_BALANCE,
  LEAVE_CANCEL,
  LEAVE_MINE,
  LEAVE_STATUS,
  DUTY_MINE,
} from "@/api/endpoints";
import { leaveFetch, LEAVE_TYPE_LABELS, STATUS_LABELS, fmtDate } from "./api";

type Balance = {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
};

/** Faculty view: balances, apply, my requests, my duties. */
export default function MyLeave() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [smsNote, setSmsNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leaveType: "CL",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, m, d, s] = await Promise.all([
        leaveFetch(LEAVE_BALANCE),
        leaveFetch(LEAVE_MINE),
        leaveFetch(DUTY_MINE),
        leaveFetch(LEAVE_STATUS),
      ]);
      setBalances(b.balances || []);
      setLeaves(m.leaves || []);
      setDuties(d.duties || []);
      setSmsNote(
        s?.notifications?.sms === "enabled"
          ? null
          : s?.notifications?.sms || null,
      );
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Faculty leave is turned off" : e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("FACULTY"))
    return <DisabledState reason="Faculty leave is turned off" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leaveFetch(LEAVE_APPLY, {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Leave request sent");
      setForm({ leaveType: "CL", fromDate: "", toDate: "", reason: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await leaveFetch(LEAVE_CANCEL(id), { method: "POST" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <ModulePage
      title="Leave and duties"
      description="Apply for leave, track approvals and see your duties."
      disabledReason={error ?? undefined}
    >
      {smsNote ? (
 <p className="text-xs text-slate-500">
          {smsNote}. You will still get app and inbox alerts.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {balances.map((b) => (
          <div
            key={b.leaveType}
 className="rounded-lg border border-slate-200 bg-white p-3"
          >
 <p className="text-xs text-slate-500">
              {LEAVE_TYPE_LABELS[b.leaveType] || b.leaveType}
            </p>
 <p className="text-lg font-semibold text-slate-900">
              {b.remaining}
 <span className="text-xs font-normal text-slate-400">
                {" "}
                / {b.total}
              </span>
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={submit}
 className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4"
      >
        <select
 className="rounded border p-2 text-sm"
          value={form.leaveType}
          onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
        >
          {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          required
          type="date"
 className="rounded border p-2 text-sm"
          value={form.fromDate}
          onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
        />
        <input
          required
          type="date"
 className="rounded border p-2 text-sm"
          value={form.toDate}
          onChange={(e) => setForm({ ...form, toDate: e.target.value })}
        />
        <button
          disabled={saving}
 className="rounded bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Sending..." : "Apply"}
        </button>
        <textarea
          required
          minLength={5}
          placeholder="Reason"
 className="rounded border p-2 text-sm md:col-span-4"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
      </form>

 <div className="rounded-lg border border-slate-200 bg-white">
 <h2 className="border-b px-4 py-3 text-sm font-semibold">
          My requests
        </h2>
        {leaves.length === 0 ? (
 <p className="p-4 text-sm text-slate-500">No leave requests yet.</p>
        ) : (
          <ul className="divide-y">
            {leaves.map((l) => (
              <li
                key={l.id}
 className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType},{" "}
                  {fmtDate(l.fromDate)} to {fmtDate(l.toDate)} ({l.days}d)
                </span>
                <span className="flex items-center gap-3">
 <span className="text-slate-600">
                    {STATUS_LABELS[l.status] || l.status}
                  </span>
                  {l.status.startsWith("pending") ? (
                    <button
                      type="button"
                      onClick={() => cancel(l.id)}
 className="text-xs text-red-600 underline"
                    >
                      Cancel
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

 <div className="rounded-lg border border-slate-200 bg-white">
 <h2 className="border-b px-4 py-3 text-sm font-semibold">My duties</h2>
        {duties.length === 0 ? (
 <p className="p-4 text-sm text-slate-500">No duties assigned.</p>
        ) : (
          <ul className="divide-y">
            {duties.map((d) => (
 <li key={d.id} className="px-4 py-3 text-sm">
                {fmtDate(d.date)}{" "}
                {d.startTime ? `${d.startTime}-${d.endTime || ""}` : ""}{" "}
                {d.title} ({d.dutyType}){d.location ? `, ${d.location}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModulePage>
  );
}
