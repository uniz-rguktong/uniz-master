import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { ADMISSIONS } from "@/api/endpoints";
import { isModuleEnabled } from "@/lib/flags";
import { DisabledState } from "@/components/module-shell";
import { day, inputCls, btnCls, cardCls } from "@/pages/student/placement/api";

const DOCS = [
  ["photo", "Photo link"],
  ["marks_memo", "Marks memo link"],
  ["id_proof", "ID proof link"],
  ["caste_certificate", "Caste certificate link (if any)"],
] as const;
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/** Public admission form and status lookup. */
export default function AdmissionsApply() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [done, setDone] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState({ refNo: "", email: "" });
  const [found, setFound] = useState<any>(null);

  useEffect(() => {
    fetch(`${ADMISSIONS}/public/cycles`)
      .then(async (r) => {
        const b = await r.json().catch(() => ({}));
        if (!r.ok)
          throw new Error(
            r.status === 503
              ? "Admissions are turned off"
              : b.message || "Could not load",
          );
        setData(b);
        if (b.cycles?.[0])
          setF((x) => ({
            ...x,
            cycleId: b.cycles[0].id,
            program: b.cycles[0].programs?.[0] || "",
          }));
      })
      .catch((e) => setMsg(e.message));
  }, []);
  if (!isModuleEnabled("ADMISSIONS"))
    return <DisabledState reason="Admissions are turned off" />;

  const cycle = data?.cycles?.find((c: any) => c.id === f.cycleId);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${ADMISSIONS}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          gender: f.gender || undefined,
          percentage: Number(f.percentage || 0),
          documents: Object.entries(docs)
            .filter(([, u]) => u)
            .map(([kind, url]) => ({ kind, url })),
          captchaToken: token,
        }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.message || "Could not submit");
      setDone(b);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };
  const check = async () => {
    const r = await fetch(
      `${ADMISSIONS}/public/status?${new URLSearchParams(lookup)}`,
    );
    const b = await r.json().catch(() => ({}));
    setFound(r.ok ? b.application : { error: b.message || "Not found" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admissions</h1>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      {done ? (
        <div className={cardCls}>
          <p className="font-medium">
            Application submitted. Your reference number is {done.refNo}.
          </p>
          <p className="text-slate-600">
            Keep it with your email to check the status below.
          </p>
          {done.payment?.required && (
            <p className="text-amber-700">
              Application fee:{" "}
              {done.payment.enabled
                ? "pay from the status page"
                : done.payment.reason}
            </p>
          )}
        </div>
      ) : data && data.cycles.length === 0 ? (
        <p className="text-slate-600">No admission cycle is open right now.</p>
      ) : data && !data.formReady ? (
        <DisabledState reason={data.reason || "Online form not configured"} />
      ) : (
        data && (
          <div className={`${cardCls} grid gap-2 md:grid-cols-2`}>
            <select
              className={inputCls}
              value={f.cycleId || ""}
              onChange={set("cycleId")}
            >
              {data.cycles.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={f.program || ""}
              onChange={set("program")}
            >
              {(cycle?.programs || []).map((p: string) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            {cycle && (
              <p className="text-slate-600 md:col-span-2">
                Closes {day(cycle.closesAt)}.{" "}
                {cycle.feeInr
                  ? `Application fee Rs ${cycle.feeInr} (${cycle.payment.enabled ? "online" : cycle.payment.reason}).`
                  : "No application fee."}{" "}
                {cycle.instructions}
              </p>
            )}
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["dob", "Date of birth (YYYY-MM-DD)"],
              ["category", "Category"],
              ["board", "Board"],
              ["percentage", "Marks %"],
              ["guardian", "Parent or guardian"],
            ].map(([k, l]) => (
              <input
                key={k}
                className={inputCls}
                placeholder={l}
                value={f[k] || ""}
                onChange={set(k)}
              />
            ))}
            <select
              className={inputCls}
              value={f.gender || ""}
              onChange={set("gender")}
            >
              <option value="">Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            <textarea
              className={`${inputCls} md:col-span-2`}
              placeholder="Address"
              value={f.address || ""}
              onChange={set("address")}
            />
            <p className="text-slate-600 md:col-span-2">
              Documents: share each as a public link (Google Drive or similar).
            </p>
            {DOCS.map(([k, l]) => (
              <input
                key={k}
                className={inputCls}
                placeholder={l}
                value={docs[k] || ""}
                onChange={(e) => setDocs({ ...docs, [k]: e.target.value })}
              />
            ))}
            {SITE_KEY && (
              <div className="md:col-span-2">
                <Turnstile
                  siteKey={SITE_KEY}
                  onSuccess={setToken}
                  options={{ action: "admissions" } as any}
                />
              </div>
            )}
            <button
              type="button"
              disabled={busy || !token}
              className={`${btnCls} md:col-span-2 disabled:opacity-50`}
              onClick={submit}
            >
              {busy ? "Submitting..." : "Submit application"}
            </button>
          </div>
        )
      )}
      <div className={`${cardCls} space-y-2`}>
        <p className="font-medium">Check application status</p>
        <div className="flex flex-wrap gap-2">
          <input
            className={inputCls}
            placeholder="Reference number"
            value={lookup.refNo}
            onChange={(e) => setLookup({ ...lookup, refNo: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Email"
            value={lookup.email}
            onChange={(e) => setLookup({ ...lookup, email: e.target.value })}
          />
          <button type="button" className={btnCls} onClick={check}>
            Check
          </button>
        </div>
        {found &&
          (found.error ? (
            <p className="text-red-600">{found.error}</p>
          ) : (
            <p>
              {found.name} . {found.program} . {found.status.replace("_", " ")}{" "}
              . fee {found.feeStatus.replace("_", " ")}{" "}
              {found.note ? `. ${found.note}` : ""}
            </p>
          ))}
      </div>
    </div>
  );
}
