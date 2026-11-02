import { useEffect, useState } from "react";
import { ALUMNI } from "@/api/endpoints";
import { inputCls, cardCls } from "@/pages/student/placement/api";

/** Public alumni directory. Only alumni who opted in are listed. */
export default function AlumniDirectory({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${ALUMNI}/directory?q=${encodeURIComponent(q)}`);
        const b = await r.json().catch(() => ({}));
        if (!r.ok)
          return setMsg(
            r.status === 503
              ? "Alumni directory is turned off"
              : b.message || "Could not load",
          );
        setRows(b.alumni || []);
        setMsg(null);
      } catch {
        setMsg("Could not load");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className={embedded ? "space-y-3" : "mx-auto max-w-4xl space-y-3 p-6"}>
      {!embedded && (
        <h1 className="text-2xl font-semibold text-slate-900">
          RGUKT Ongole Alumni
        </h1>
      )}
      <input
        className={`${inputCls} w-full`}
        placeholder="Search by name, company, role, city"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {msg && <p className="text-sm text-slate-500">{msg}</p>}
      {!msg && rows.length === 0 && (
        <p className="text-sm text-slate-500">No alumni listed yet.</p>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((a) => (
          <div key={a.id} className={cardCls}>
            <p className="font-medium text-slate-900">{a.name}</p>
            <p className="text-slate-600">
              {[a.jobTitle, a.company].filter(Boolean).join(" at ")}{" "}
              {a.location ? `. ${a.location}` : ""}
            </p>
            <p className="text-slate-500">
              {a.branch} . {a.batch}{" "}
              {a.graduationYear ? `. ${a.graduationYear}` : ""}
            </p>
            {a.linkedinUrl && (
              <a
                className="text-blue-700 underline"
                href={a.linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
