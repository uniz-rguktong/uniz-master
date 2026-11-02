import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { INFOCENTRE } from "@/api/endpoints";
import {
  modFetch,
  post,
  day,
  inputCls,
  btnCls,
  cardCls,
} from "@/pages/student/placement/api";

const CATS = ["circular", "calendar", "download", "form", "other"];

/** Staff: add circulars, calendars, downloads and forms. Notices and tenders stay in their own tabs. */
export default function InfoAdmin() {
  const f = (u: string, i?: RequestInit) => modFetch(`${INFOCENTRE}${u}`, i);
  const [items, setItems] = useState<any[]>([]);
  const [d, setD] = useState({
    category: "circular",
    title: "",
    summary: "",
    url: "",
    tags: "",
    eventDate: "",
    pinned: false,
  });
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setItems((await f("/items")).items || []);
      setError(null);
    } catch (e: any) {
      setError(
        e.status === 503 ? "Information centre is turned off" : e.message,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (!isModuleEnabled("INFO_CENTRE"))
    return <DisabledState reason="Information centre is turned off" />;
  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const put = (id: string, body: unknown) =>
    f(`/items/${id}`, { method: "PUT", body: JSON.stringify(body) });
  return (
    <ModulePage
      title="Information Centre"
      description="Circulars, calendars, downloads and forms. Public notices and tenders from their tabs show here too."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className={`${cardCls} grid gap-2 md:grid-cols-3`}>
        <select
          className={inputCls}
          value={d.category}
          onChange={(e) => setD({ ...d, category: e.target.value })}
        >
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className={`${inputCls} md:col-span-2`}
          placeholder="Title"
          value={d.title}
          onChange={(e) => setD({ ...d, title: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Link (PDF, Drive, page)"
          value={d.url}
          onChange={(e) => setD({ ...d, url: e.target.value })}
        />
        <input
          className={inputCls}
          placeholder="Tags, comma separated"
          value={d.tags}
          onChange={(e) => setD({ ...d, tags: e.target.value })}
        />
        <input
          className={inputCls}
          type="date"
          value={d.eventDate}
          onChange={(e) => setD({ ...d, eventDate: e.target.value })}
        />
        <textarea
          className={`${inputCls} md:col-span-3`}
          placeholder="Summary"
          value={d.summary}
          onChange={(e) => setD({ ...d, summary: e.target.value })}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={d.pinned}
            onChange={(e) => setD({ ...d, pinned: e.target.checked })}
          />{" "}
          Pin to top
        </label>
        <button
          type="button"
          className={`${btnCls} md:col-span-2`}
          onClick={() =>
            run(
              () =>
                f(
                  "/items",
                  post({
                    category: d.category,
                    title: d.title,
                    summary: d.summary || undefined,
                    url: d.url || undefined,
                    tags: d.tags
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                    eventDate: d.eventDate || undefined,
                    pinned: d.pinned,
                  }),
                ),
              "Added",
            )
          }
        >
          Add
        </button>
      </div>
      {items.map((i) => (
        <div
          key={i.id}
          className={`${cardCls} flex flex-wrap justify-between gap-2`}
        >
          <span>
            {i.category} . {i.title} . {day(i.createdAt)}{" "}
            {i.isVisible ? "" : ". hidden"} {i.pinned ? ". pinned" : ""}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-2"
              onClick={() =>
                run(() => put(i.id, { pinned: !i.pinned }), "Saved")
              }
            >
              {i.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              className="rounded-md border px-2"
              onClick={() =>
                run(() => put(i.id, { isVisible: !i.isVisible }), "Saved")
              }
            >
              {i.isVisible ? "Hide" : "Show"}
            </button>
          </span>
        </div>
      ))}
    </ModulePage>
  );
}
