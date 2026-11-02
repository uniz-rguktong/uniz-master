import { useEffect, useState } from "react";
import { FEEDBACK_RESULTS } from "@/api/endpoints";
import { leaveFetch as apiFetch } from "@/pages/faculty/leave/api";

/** Aggregated results for one form. Hidden under the minimum response count. */
export default function FeedbackResults({ formId }: { formId: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(FEEDBACK_RESULTS(formId))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [formId]);

 if (error) return <p className="text-sm text-rose-600">{error}</p>;
 if (!data) return <p className="text-sm text-slate-500">Loading...</p>;
  if (data.hidden) {
    return (
 <p className="text-sm text-slate-500">
        {data.responses} responses so far. Results show once there are{" "}
        {data.minResponses} or more.
      </p>
    );
  }
  return (
 <div className="space-y-2 text-sm">
 <p className="text-slate-500">{data.responses} responses</p>
      {data.questions.map((q: any) => (
        <div
          key={q.question}
          className="flex justify-between gap-3 border-t pt-1"
        >
          <span>{q.question}</span>
          <b>{q.average.toFixed(2)} / 5</b>
        </div>
      ))}
      {data.comments?.length ? (
 <ul className="list-disc space-y-1 pl-5 text-slate-600">
          {data.comments.map((c: string, i: number) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
