import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { ALUMNI } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";
import AlumniDirectory from "./AlumniDirectory";

/** Student or graduate view: claim alumni profile by email OTP, edit it, jobs board, directory. */
export default function AlumniHome({ staff = false }: { staff?: boolean }) {
  const kind = staff ? "staff" : "student";
  const f = (u: string, i?: RequestInit) => modFetch(`${ALUMNI}${u}`, i, kind);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [job, setJob] = useState({
    company: "",
    title: "",
    location: "",
    applyUrl: "",
    description: "",
    deadline: "",
  });
  const [all, setAll] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await f("/jobs");
      setJobs(j.jobs || []);
      if (staff) setAll((await f("/all")).alumni || []);
      else {
        const m = await f("/me");
        setProfile(m.profile);
        setForm(m.profile || {});
      }
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Alumni is turned off" : e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff]);
  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("ALUMNI"))
    return <DisabledState reason="Alumni is turned off" />;

  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      const r = await fn();
      toast.success(ok);
      load();
      return r;
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const saveProfile = () =>
    run(
      () =>
        f("/me", {
          method: "PUT",
          body: JSON.stringify({
            company: form.company || "",
            jobTitle: form.jobTitle || "",
            location: form.location || "",
            linkedinUrl: form.linkedinUrl || "",
            bio: form.bio || "",
            graduationYear: form.graduationYear
              ? Number(form.graduationYear)
              : null,
            visible: !!form.visible,
          }),
        }),
      "Profile saved",
    );
  const canPost = staff || !!profile?.verifiedAt;

  return (
    <ModulePage
      title="Alumni"
      description="Alumni profiles, the alumni jobs board and the public directory."
    >
 {error && <p className="text-sm text-red-600">{error}</p>}
      {!staff && !profile?.verifiedAt && (
        <div className={`${cardCls} space-y-2`}>
          <p>
            Claim your alumni profile. We send a code to the email on your
            student profile.
          </p>
          <button
            type="button"
            className={btnCls}
            onClick={() =>
              run(() => f("/claim/start", post()), "Code sent").then(
                (r) => r && setSent(r.sentTo),
              )
            }
          >
            Send code
          </button>
          {sent && (
            <div className="flex gap-2">
 <span className="self-center text-slate-600">Sent to {sent}</span>
              <input
                className={inputCls}
                placeholder="6 digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                type="button"
                className={btnCls}
                onClick={() =>
                  run(
                    () => f("/claim/verify", post({ otp })),
                    "Profile claimed",
                  )
                }
              >
                Verify
              </button>
            </div>
          )}
        </div>
      )}
      {!staff && profile?.verifiedAt && (
        <div className={`${cardCls} grid gap-2 md:grid-cols-2`}>
          {[
            "company",
            "jobTitle",
            "location",
            "linkedinUrl",
            "graduationYear",
          ].map((k) => (
            <input
              key={k}
              className={inputCls}
              placeholder={k}
              value={form[k] ?? ""}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          ))}
          <textarea
            className={`${inputCls} md:col-span-2`}
            placeholder="Short bio"
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
            />
            Show me in the public alumni directory
          </label>
          <button type="button" className={btnCls} onClick={saveProfile}>
            Save
          </button>
        </div>
      )}
 <h3 className="font-medium text-slate-900">Jobs from alumni</h3>
      {jobs.length === 0 && (
 <p className="text-sm text-slate-500">No open jobs.</p>
      )}
      {jobs.map((j) => (
        <div key={j.id} className={`${cardCls} flex justify-between gap-2`}>
          <span>
            {j.title} . {j.company} {j.location ? `. ${j.location}` : ""} .{" "}
            {j.kind} {j.deadline ? `. by ${day(j.deadline)}` : ""}
            {j.description && (
 <span className="block text-slate-600">{j.description}</span>
            )}
          </span>
          <span className="flex gap-2">
            <a
              className={btnCls}
              href={j.applyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Apply
            </a>
            {staff && (
              <button
                type="button"
 className="rounded-md border px-2"
                onClick={() =>
                  run(() => f(`/jobs/${j.id}/close`, post()), "Closed")
                }
              >
                Close
              </button>
            )}
          </span>
        </div>
      ))}
      {canPost && (
        <div className={`${cardCls} grid gap-2 md:grid-cols-3`}>
          {(["company", "title", "location", "applyUrl"] as const).map((k) => (
            <input
              key={k}
              className={inputCls}
              placeholder={k === "applyUrl" ? "Apply link" : k}
              value={job[k]}
              onChange={(e) => setJob({ ...job, [k]: e.target.value })}
            />
          ))}
          <input
            className={inputCls}
            type="date"
            value={job.deadline}
            onChange={(e) => setJob({ ...job, deadline: e.target.value })}
          />
          <textarea
            className={`${inputCls} md:col-span-3`}
            placeholder="Description"
            value={job.description}
            onChange={(e) => setJob({ ...job, description: e.target.value })}
          />
          <button
            type="button"
            className={btnCls}
            onClick={() =>
              run(
                () =>
                  f(
                    "/jobs",
                    post({
                      ...job,
                      location: job.location || undefined,
                      description: job.description || undefined,
                      deadline: job.deadline || undefined,
                    }),
                  ),
                "Job posted",
              )
            }
          >
            Post job
          </button>
        </div>
      )}
      {staff && (
        <div className={cardCls}>
 <p className="font-medium">
            {all.length} alumni claimed, {all.filter((a) => a.visible).length}{" "}
            listed publicly
          </p>
          {all.slice(0, 200).map((a) => (
 <p key={a.id} className="text-slate-600">
              {a.username} . {a.name} . {a.company || "-"} . {a.email}
            </p>
          ))}
        </div>
      )}
 <h3 className="font-medium text-slate-900">Directory</h3>
      <AlumniDirectory embedded />
    </ModulePage>
  );
}
