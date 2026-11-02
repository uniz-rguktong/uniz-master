import { useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { FEEDBACK_MINE } from "@/api/endpoints";
import { leaveFetch as apiFetch } from "@/pages/faculty/leave/api";
import FeedbackResults from "./FeedbackResults";

/** Faculty view: aggregated feedback on their own subjects. */
export default function MyFeedbackResults() {
  const [forms, setForms] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(FEEDBACK_MINE)
      .then((r) => setForms(r.forms || []))
      .catch((e) =>
        setError(e.status === 503 ? "Feedback is turned off" : e.message),
      );
  }, []);

  if (!isModuleEnabled("FEEDBACK")) {
    return <DisabledState reason="Feedback is turned off" />;
  }

  return (
    <ModulePage
      title="My Feedback"
      description="Anonymous student feedback on your subjects. Shown only once 5 or more students reply."
    >
      {error ? <DisabledState reason={error} /> : null}
      {forms.length === 0 && !error ? (
 <p className="text-sm text-slate-500">No feedback forms for you yet.</p>
      ) : null}
      {forms.map((f) => (
 <div key={f.id} className="rounded-xl border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span>
              <b>{f.title}</b>, {f.responses} responses
            </span>
            <button
 className="rounded border px-2 py-1"
              onClick={() => setOpen(open === f.id ? null : f.id)}
            >
              Results
            </button>
          </div>
          {open === f.id ? (
            <div className="mt-3">
              <FeedbackResults formId={f.id} />
            </div>
          ) : null}
        </div>
      ))}
    </ModulePage>
  );
}
