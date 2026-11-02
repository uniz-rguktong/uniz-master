import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "@/api/apiClient";
import {
  SEMESTERS,
  EXAM_DUTY_HALLS,
  EXAM_DUTY_GENERATE,
  EXAM_DUTY_ROSTER,
  EXAM_DUTY_SWAPS,
  EXAM_DUTY_DECIDE,
} from "@/api/endpoints";
import { leaveFetch as dutyFetch, fmtDate } from "@/pages/faculty/leave/api";

const EXAMS = ["MID-1", "MID-2", "SEM-END", "REMEDIAL"];

/** Exam cell view: halls from seating, generate duties, swaps, printable roster. */
export default function ExamDutiesAdmin() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [examName, setExamName] = useState("MID-1");
  const [halls, setHalls] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [faculty, setFaculty] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<any>(SEMESTERS)
      .then((data) => {
        if (Array.isArray(data)) {
          setSemesters(data);
          if (data[0]) setSemesterId(data[0].id);
        }
      })
      .catch(() => setSemesters([]));
  }, []);

  const load = useCallback(async () => {
    if (!semesterId) return;
    try {
      const [h, r, s] = await Promise.all([
        dutyFetch(EXAM_DUTY_HALLS(semesterId, examName)),
        dutyFetch(EXAM_DUTY_ROSTER(semesterId, examName)),
        dutyFetch(EXAM_DUTY_SWAPS),
      ]);
      setHalls(h.halls || []);
      setRoster(r.duties || []);
      setSwaps(s.duties || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Exam duties is turned off" : e.message);
    }
  }, [semesterId, examName]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("EXAM_DUTIES")) {
    return <DisabledState reason="Exam duties is turned off" />;
  }

  const generate = async (replace = false) => {
    const names = faculty
      .split(/[\s,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return toast.error("Add faculty usernames first");
    setBusy(true);
    try {
      const r = await dutyFetch(EXAM_DUTY_GENERATE, {
        method: "POST",
        body: JSON.stringify({ semesterId, examName, faculty: names, replace }),
      });
      toast.success(`${r.duties} duties across ${r.halls} halls`);
      load();
    } catch (e: any) {
      if (e.status === 409 && window.confirm(`${e.message}\nRebuild now?`)) {
        setBusy(false);
        return generate(true);
      }
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, approve: boolean) => {
    try {
      await dutyFetch(EXAM_DUTY_DECIDE(id), {
        method: "POST",
        body: JSON.stringify({ approve }),
      });
      toast.success(approve ? "Swap approved" : "Swap rejected");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ModulePage
      title="Exam Duties"
      description="Invigilation duties built from the seating arrangement halls."
      actions={
        roster.length > 0 ? (
          <button
 className="rounded-lg border px-3 py-2 text-sm print:hidden"
            onClick={() => window.print()}
          >
            Print roster
          </button>
        ) : null
      }
    >
      {error ? <DisabledState reason={error} /> : null}
      <div className="flex flex-wrap gap-3 print:hidden">
        <select
 className="rounded-lg border px-3 py-2 text-sm"
          value={semesterId}
          onChange={(e) => setSemesterId(e.target.value)}
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
        <select
 className="rounded-lg border px-3 py-2 text-sm"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        >
          {EXAMS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>

 <div className="rounded-xl border p-4 print:hidden">
 <p className="text-sm text-slate-600">
          {halls.length} halls found in seating for this exam.
          {halls.length === 0
            ? " Upload the seating arrangement with dates first."
            : ""}
        </p>
        <textarea
 className="mt-3 w-full rounded-lg border p-2 text-sm"
          rows={3}
          placeholder="Faculty usernames, comma or space separated"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
        />
        <button
          disabled={busy || halls.length === 0}
 className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          onClick={() => generate(false)}
        >
          {busy ? "Generating..." : "Generate duties"}
        </button>
      </div>

      {swaps.length > 0 ? (
 <div className="rounded-xl border p-4 print:hidden">
 <h2 className="mb-2 font-medium">Swap requests</h2>
          {swaps.map((s) => (
            <div
              key={s.id}
 className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm"
            >
              <span>
                {s.facultyUsername} to {s.swapTo}, {s.room} on {fmtDate(s.date)}{" "}
                {s.time || ""}: {s.swapReason}
              </span>
              <span className="flex gap-2">
                <button
 className="rounded border px-2 py-1"
                  onClick={() => decide(s.id, true)}
                >
                  Approve
                </button>
                <button
 className="rounded border px-2 py-1"
                  onClick={() => decide(s.id, false)}
                >
                  Reject
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : null}

 <div className="overflow-x-auto rounded-xl border">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Time</th>
              <th className="p-2">Hall</th>
              <th className="p-2">Students</th>
              <th className="p-2">Faculty</th>
              <th className="p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{fmtDate(d.date)}</td>
                <td className="p-2">{d.time || "-"}</td>
                <td className="p-2">{d.room}</td>
                <td className="p-2">{d.studentCount}</td>
                <td className="p-2">{d.facultyUsername}</td>
                <td className="p-2">{d.role}</td>
              </tr>
            ))}
            {roster.length === 0 ? (
              <tr>
 <td className="p-4 text-slate-500" colSpan={6}>
                  No duties yet for {examName}.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </ModulePage>
  );
}
