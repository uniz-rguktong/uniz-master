import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { FEEDBACK_OPEN, FEEDBACK_SUBMIT } from "@/api/endpoints";

async function studentFetch(url: string, init: RequestInit = {}) {
  const token = (localStorage.getItem("student_token") || "").replace(/"/g, "");
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(
      body?.message || `Request failed (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }
  return body;
}

const SCALE = [1, 2, 3, 4, 5];

/** Student view: anonymous feedback for registered subjects. */
export default function StudentFeedback() {
  const [forms, setForms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [ratings, setRatings] = useState<number[]>([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await studentFetch(FEEDBACK_OPEN);
      setForms(r.forms || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Feedback is turned off" : e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("FEEDBACK")) {
    return <DisabledState reason="Feedback is turned off" />;
  }

  const open = (f: any) => {
    setActive(active === f.id ? null : f.id);
    setRatings(new Array((f.questions || []).length).fill(0));
    setComment("");
  };

  const submit = async (f: any) => {
    if (ratings.some((r) => r < 1)) return toast.error("Rate every question");
    setSaving(true);
    try {
      await studentFetch(FEEDBACK_SUBMIT(f.id), {
        method: "POST",
        body: JSON.stringify({ ratings, comment: comment || undefined }),
      });
      toast.success("Thanks. Your feedback is anonymous.");
      setActive(null);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePage
      title="Course Feedback"
      description="Anonymous. Your name is never stored with your answers, and faculty only see averages once 5 or more students reply."
    >
      {error ? <DisabledState reason={error} /> : null}
      <p className="text-xs text-slate-500">
        Have a complaint instead? Use{" "}
        <Link to="/student/grievance" className="underline">
          Grievance
        </Link>
        .
      </p>
      {forms.length === 0 && !error ? (
        <p className="text-sm text-slate-500">
          No feedback forms open right now.
        </p>
      ) : null}
      <div className="space-y-3">
        {forms.map((f) => (
          <div key={f.id} className="rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <b>{f.title}</b>
                {f.facultyUsername ? ` (${f.facultyUsername})` : ""}, closes{" "}
                {String(f.closesAt).slice(0, 10)}
              </span>
              {f.answered ? (
                <span className="text-emerald-600">Submitted</span>
              ) : (
                <button
                  className="rounded border px-3 py-1"
                  onClick={() => open(f)}
                >
                  {active === f.id ? "Hide" : "Give feedback"}
                </button>
              )}
            </div>
            {active === f.id ? (
              <div className="mt-3 space-y-3">
                {(f.questions || []).map((q: string, i: number) => (
                  <div key={i}>
                    <p className="mb-1">{q}</p>
                    <div className="flex gap-2">
                      {SCALE.map((n) => (
                        <button
                          key={n}
                          className={`h-8 w-8 rounded border ${ratings[i] === n ? "bg-slate-900 text-white" : ""}`}
                          onClick={() => {
                            const next = [...ratings];
                            next[i] = n;
                            setRatings(next);
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <textarea
                  className="w-full rounded border p-2"
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything else? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  disabled={saving}
                  className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                  onClick={() => submit(f)}
                >
                  {saving ? "Sending..." : "Submit"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
