import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import {
  EXAM_DUTY_MINE,
  EXAM_DUTY_STATUS,
  EXAM_DUTY_SWAP,
} from "@/api/endpoints";
import { leaveFetch as dutyFetch, fmtDate } from "../leave/api";

/** Faculty view: my invigilation duties and swap requests. */
export default function MyExamDuties() {
  const [duties, setDuties] = useState<any[]>([]);
  const [smsNote, setSmsNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [form, setForm] = useState({ toUsername: "", reason: "" });

  const load = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        dutyFetch(EXAM_DUTY_MINE),
        dutyFetch(EXAM_DUTY_STATUS),
      ]);
      setDuties(m.duties || []);
      setSmsNote(
        s?.notifications?.sms === "enabled"
          ? null
          : s?.notifications?.sms || null,
      );
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Exam duties is turned off" : e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("EXAM_DUTIES")) {
    return <DisabledState reason="Exam duties is turned off" />;
  }

  const submitSwap = async () => {
    if (!swapFor) return;
    try {
      await dutyFetch(EXAM_DUTY_SWAP(swapFor), {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Swap requested");
      setSwapFor(null);
      setForm({ toUsername: "", reason: "" });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ModulePage
      title="Exam Duties"
      description="Your invigilation duties. Ask the exam cell for a swap if you cannot make it."
    >
      {error ? <DisabledState reason={error} /> : null}
      {smsNote ? (
        <p className="text-xs text-slate-500">
          {smsNote}. You will get app notifications.
        </p>
      ) : null}
      <div className="space-y-2">
        {duties.length === 0 ? (
          <p className="text-sm text-slate-500">No exam duties assigned.</p>
        ) : null}
        {duties.map((d) => (
          <div key={d.id} className="rounded-xl border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <b>{d.examName}</b> {fmtDate(d.date)} {d.time || ""}, hall{" "}
                {d.room} ({d.role})
              </span>
              {d.swapStatus === "pending" ? (
                <span className="text-amber-600">Swap pending</span>
              ) : (
                <button
                  className="rounded border px-2 py-1"
                  onClick={() => setSwapFor(swapFor === d.id ? null : d.id)}
                >
                  Request swap
                </button>
              )}
            </div>
            {swapFor === d.id ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="rounded border px-2 py-1"
                  placeholder="Swap with (username)"
                  value={form.toUsername}
                  onChange={(e) =>
                    setForm({ ...form, toUsername: e.target.value })
                  }
                />
                <input
                  className="flex-1 rounded border px-2 py-1"
                  placeholder="Reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
                <button
                  className="rounded bg-slate-900 px-3 py-1 text-white"
                  onClick={submitSwap}
                >
                  Send
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
