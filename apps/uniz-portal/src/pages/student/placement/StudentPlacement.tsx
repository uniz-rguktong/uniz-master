import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { PLACEMENT } from "@/api/endpoints";
import { modFetch, post, day, inputCls, btnCls, cardCls } from "./api";

/** Student view: open drives with eligibility, apply with a resume link, my applications and offers. */
export default function StudentPlacement() {
  const [drives, setDrives] = useState<any[]>([]);
  const [mine, setMine] = useState<any>({ applications: [], offers: [] });
  const [resume, setResume] = useState("");
  const [error, setError] = useState<string | null>(null);
  const f = (u: string, i?: RequestInit) =>
    modFetch(`${PLACEMENT}${u}`, i, "student");

  const load = useCallback(async () => {
    try {
      const [d, m] = await Promise.all([f("/drives"), f("/mine")]);
      setDrives(d.drives || []);
      setMine(m);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Placement is turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("PLACEMENT"))
    return <DisabledState reason="Placement is turned off" />;

  const applied = new Map(
    (mine.applications || []).map((a: any) => [a.driveId, a.status]),
  );
  const act = async (u: string, body: unknown, ok: string) => {
    try {
      await f(u, post(body));
      toast.success(ok);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ModulePage
      title="Placements"
      description="Open drives you can apply to. Add a public link to your resume (Drive or similar) before applying."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        className={`${inputCls} w-full`}
        placeholder="Resume link (https://...)"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
      />
      {(mine.offers || []).map((o: any) => (
        <div key={o.id} className={`${cardCls} flex justify-between`}>
          <span>
            Offer . {o.ctcLpa} LPA . {o.status}
          </span>
          {o.status === "offered" && (
            <span className="flex gap-2">
              <button
                type="button"
                className={btnCls}
                onClick={() =>
                  act(
                    `/offers/${o.id}/respond`,
                    { action: "accepted" },
                    "Offer accepted",
                  )
                }
              >
                Accept
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-1.5"
                onClick={() =>
                  act(
                    `/offers/${o.id}/respond`,
                    { action: "declined" },
                    "Offer declined",
                  )
                }
              >
                Decline
              </button>
            </span>
          )}
        </div>
      ))}
      {drives.length === 0 && (
        <p className="text-sm text-slate-500">No open drives right now.</p>
      )}
      {drives.map((d) => (
        <div key={d.id} className={`${cardCls} space-y-1`}>
          <p className="font-medium text-slate-900">
            {d.company} . {d.title} ({d.jobRole})
          </p>
          <p className="text-slate-600">
            {d.ctcLpa ? `${d.ctcLpa} LPA . ` : ""}
            {d.location} . apply by {day(d.deadline)} . min CGPA {d.minCgpa}
          </p>
          {d.description && <p className="text-slate-600">{d.description}</p>}
          {applied.has(d.id) ? (
            <p className="text-green-700">
              Applied . {String(applied.get(d.id))}
            </p>
          ) : d.eligible ? (
            <button
              type="button"
              className={btnCls}
              onClick={() =>
                resume
                  ? act(
                      `/drives/${d.id}/apply`,
                      { resumeUrl: resume },
                      "Applied",
                    )
                  : toast.error("Add your resume link first")
              }
            >
              Apply
            </button>
          ) : (
            <p className="text-slate-500">
              Not eligible: {(d.reasons || []).join(", ")}
            </p>
          )}
        </div>
      ))}
    </ModulePage>
  );
}
