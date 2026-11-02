import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { LIBRARY_BOOKS, LIBRARY_MINE } from "@/api/endpoints";
import { libraryFetch, rupees, day } from "./api";

/** Borrower view (students and faculty): my loans, fines, catalogue search. */
export default function MyLibrary({
  kind = "student",
}: {
  kind?: "student" | "staff";
}) {
  const [data, setData] = useState<any>({ loans: [], fines: [] });
  const [books, setBooks] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await libraryFetch(LIBRARY_MINE, {}, kind));
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Library is turned off" : e.message);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("LIBRARY")) {
    return <DisabledState reason="Library is turned off" />;
  }

  const search = async () => {
    try {
      const r = await libraryFetch(
        `${LIBRARY_BOOKS}?q=${encodeURIComponent(q)}`,
        {},
        kind,
      );
      setBooks(r.books || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const active = (data.loans || []).filter((l: any) => !l.returnedAt);
  const unpaid = (data.fines || []).filter((f: any) => f.status === "unpaid");
  const owed = unpaid.reduce((s: number, f: any) => s + f.amountPaise, 0);

  return (
    <ModulePage
      title="Library"
      description="Books you have borrowed, due dates and fines. Issue and return happen at the library counter."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Books with you</p>
          <p className="text-2xl font-semibold text-slate-900">
            {active.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Unpaid fines</p>
          <p className="text-2xl font-semibold text-slate-900">
            {rupees(owed)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pay at the library counter. Online:{" "}
            {data.finePayment?.reason || "Payments coming soon"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-slate-900">My loans</p>
        {(data.loans || []).length === 0 && (
          <p className="text-sm text-slate-500">Nothing borrowed yet.</p>
        )}
        {(data.loans || []).map((l: any) => {
          const late = !l.returnedAt && new Date(l.dueDate) < new Date();
          return (
            <div
              key={l.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <span>
                {l.book?.title || "Book"}{" "}
                {l.book?.author ? `. ${l.book.author}` : ""}
              </span>
              <span className={late ? "text-red-600" : "text-slate-600"}>
                {l.returnedAt
                  ? `Returned ${day(l.returnedAt)}`
                  : `Due ${day(l.dueDate)}${late ? ` . overdue, fine so far ${rupees(l.accruingFinePaise)}` : ""}`}
              </span>
            </div>
          );
        })}
      </div>

      {(data.fines || []).length > 0 && (
        <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-900">Fines</p>
          {data.fines.map((f: any) => (
            <p key={f.id}>
              {day(f.createdAt)} . {rupees(f.amountPaise)} . {f.status} .{" "}
              {f.note}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="font-medium text-slate-900">Search the catalogue</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="Title, author or ISBN"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            type="button"
            onClick={search}
            className="rounded-md bg-navy-900 px-3 py-1.5 text-sm text-white"
          >
            Search
          </button>
        </div>
        {books.map((b) => (
          <div
            key={b.id}
            className="flex justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <span>
              {b.title} {b.author ? `. ${b.author}` : ""}
            </span>
            <span className={b.available ? "text-green-700" : "text-slate-500"}>
              {b.available} of {b.copies} available
            </span>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
