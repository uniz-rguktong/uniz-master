import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import {
  DUTY_ASSIGN,
  DUTY_DELETE,
  DUTY_ROSTER,
  LEAVE_DECIDE,
  LEAVE_PENDING,
} from "@/api/endpoints";
import { leaveFetch, LEAVE_TYPE_LABELS, fmtDate } from "./api";

/** HOD / Dean view: pending leave approvals and the duty roster. */
export default function LeaveApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duty, setDuty] = useState({
    facultyUsername: "",
    dutyType: "invigilation",
    title: "",
    date: "",
    location: "",
  });

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [p, r] = await Promise.all([
        leaveFetch(LEAVE_PENDING),
        leaveFetch(`${DUTY_ROSTER}?from=${today}`),
      ]);
      setPending(p.leaves || []);
      setRoster(r.duties || []);
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

  const decide = async (id: string, action: "approve" | "reject") => {
    try {
      await leaveFetch(LEAVE_DECIDE(id), {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(action === "approve" ? "Approved" : "Rejected");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, string> = { ...duty };
      if (!body.location) delete body.location;
      await leaveFetch(DUTY_ASSIGN, {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success("Duty assigned");
      setDuty({ ...duty, title: "", facultyUsername: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (id: string) => {
    try {
      await leaveFetch(DUTY_DELETE(id), { method: "DELETE" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <ModulePage
      title="Leave and duties"
      description="Review faculty leave and manage the duty roster."
      disabledReason={error ?? undefined}
    >
 <div className="rounded-lg border border-slate-200 bg-white">
 <h2 className="border-b px-4 py-3 text-sm font-semibold">
          Pending leave
        </h2>
        {pending.length === 0 ? (
 <p className="p-4 text-sm text-slate-500">Nothing waiting for you.</p>
        ) : (
          <ul className="divide-y">
            {pending.map((l) => (
              <li
                key={l.id}
 className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  <b>{l.username}</b> ({l.department}):{" "}
                  {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType},{" "}
                  {fmtDate(l.fromDate)} to {fmtDate(l.toDate)} ({l.days}d).{" "}
                  {l.reason}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => decide(l.id, "approve")}
 className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(l.id, "reject")}
 className="rounded bg-red-600 px-3 py-1 text-xs text-white"
                  >
                    Reject
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={assign}
 className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-6"
      >
        <input
          required
          placeholder="Faculty username"
 className="rounded border p-2 text-sm"
          value={duty.facultyUsername}
          onChange={(e) =>
            setDuty({ ...duty, facultyUsername: e.target.value })
          }
        />
        <select
 className="rounded border p-2 text-sm"
          value={duty.dutyType}
          onChange={(e) => setDuty({ ...duty, dutyType: e.target.value })}
        >
          <option value="invigilation">Invigilation</option>
          <option value="lab">Lab</option>
          <option value="event">Event</option>
          <option value="committee">Committee</option>
          <option value="other">Other</option>
        </select>
        <input
          required
          placeholder="Title"
 className="rounded border p-2 text-sm"
          value={duty.title}
          onChange={(e) => setDuty({ ...duty, title: e.target.value })}
        />
        <input
          required
          type="date"
 className="rounded border p-2 text-sm"
          value={duty.date}
          onChange={(e) => setDuty({ ...duty, date: e.target.value })}
        />
        <input
          placeholder="Location"
 className="rounded border p-2 text-sm"
          value={duty.location}
          onChange={(e) => setDuty({ ...duty, location: e.target.value })}
        />
 <button className="rounded bg-navy px-4 py-2 text-sm font-medium text-white">
          Assign duty
        </button>
      </form>

 <div className="rounded-lg border border-slate-200 bg-white">
 <h2 className="border-b px-4 py-3 text-sm font-semibold">
          Upcoming duties
        </h2>
        {roster.length === 0 ? (
 <p className="p-4 text-sm text-slate-500">No upcoming duties.</p>
        ) : (
          <ul className="divide-y">
            {roster.map((d) => (
              <li
                key={d.id}
 className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  {fmtDate(d.date)} {d.title} ({d.dutyType}), {d.department}
                  {d.location ? `, ${d.location}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
 className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModulePage>
  );
}
