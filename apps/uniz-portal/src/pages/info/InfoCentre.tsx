import { useEffect, useState } from "react";
import { INFOCENTRE } from "@/api/endpoints";
import { isModuleEnabled } from "@/lib/flags";
import { DisabledState } from "@/components/module-shell";
import { day, inputCls, cardCls } from "@/pages/student/placement/api";

const LABELS: Record<string, string> = {
  "": "All",
  notice: "Notices",
  circular: "Circulars",
  tender: "Tenders",
  calendar: "Calendars",
  download: "Downloads",
  form: "Forms",
  other: "Other",
};

/** Public information centre: notices, circulars, tenders, calendars, downloads in one searchable list. */
export default function InfoCentre({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (cat) p.set("category", cat);
        const r = await fetch(`${INFOCENTRE}/hub?${p}`);
        const b = await r.json().catch(() => ({}));
        if (!r.ok)
          return setMsg(
            r.status === 503
              ? "Information centre is turned off"
              : b.message || "Could not load",
          );
        setItems(b.items || []);
        setMsg(null);
      } catch {
        setMsg("Could not load");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat]);
  if (!isModuleEnabled("INFO_CENTRE"))
    return <DisabledState reason="Information centre is turned off" />;
  return (
    <div className={embedded ? "space-y-3" : "mx-auto max-w-4xl space-y-3 p-6"}>
 <h1 className="text-2xl font-semibold text-slate-900">
        Information Centre
      </h1>
      <div className="flex flex-wrap gap-2">
        {Object.entries(LABELS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCat(k)}
 className={`rounded-full border px-3 py-1 text-sm ${cat === k ? "bg-navy-900 text-white" : "bg-white"}`}
          >
            {v}
          </button>
        ))}
      </div>
      <input
        className={`${inputCls} w-full`}
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
 {msg && <p className="text-sm text-slate-500">{msg}</p>}
      {!msg && items.length === 0 && (
 <p className="text-sm text-slate-500">Nothing here yet.</p>
      )}
      {items.map((i) => (
        <div key={`${i.source}-${i.id}`} className={cardCls}>
 <p className="font-medium text-slate-900">
            {i.pinned ? "Pinned . " : ""}
            {i.title}
          </p>
 <p className="text-xs text-slate-500">
            {LABELS[i.category] || i.category} . {day(i.date)}{" "}
            {i.deadline ? `. closes ${day(i.deadline)}` : ""}
          </p>
          {i.summary && (
 <p className="whitespace-pre-line text-slate-600">{i.summary}</p>
          )}
          {i.url && (
            <a
 className="text-blue-700 underline"
              href={i.url}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
