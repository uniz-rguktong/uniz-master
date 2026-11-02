import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import {
  LIBRARY_BOOKS,
  LIBRARY_IMPORT,
  LIBRARY_ISSUE,
  LIBRARY_RETURN,
  LIBRARY_LOANS,
  LIBRARY_FINES,
  LIBRARY_SETTLE,
  LIBRARY_REMIND,
} from "@/api/endpoints";
import { libraryFetch as api, rupees, day } from "@/pages/library/api";

const input =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none";
const btn = "rounded-md bg-navy-900 px-3 py-1.5 text-sm text-white";
const CHUNK = 400;

/** Librarian desk: issue/return by barcode, catalogue, CSV import, loans, fines, reminders. */
export default function LibraryAdmin() {
  const [issueForm, setIssueForm] = useState({ barcode: "", username: "" });
  const [retCode, setRetCode] = useState("");
  const [loans, setLoans] = useState<any[]>([]);
  const [loanStatus, setLoanStatus] = useState("active");
  const [fines, setFines] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [book, setBook] = useState({
    title: "",
    author: "",
    isbn: "",
    barcodes: "",
  });
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [l, f] = await Promise.all([
        api(`${LIBRARY_LOANS}?status=${loanStatus}`),
        api(`${LIBRARY_FINES}?status=unpaid`),
      ]);
      setLoans(l.loans || []);
      setFines(f.fines || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Library is turned off" : e.message);
    }
  }, [loanStatus]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("LIBRARY")) {
    return <DisabledState reason="Library is turned off" />;
  }

  const run = async (fn: () => Promise<any>, ok: (r: any) => string) => {
    try {
      const r = await fn();
      toast.success(ok(r));
      load();
      return r;
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const issue = () =>
    run(
      () =>
        api(LIBRARY_ISSUE, { method: "POST", body: JSON.stringify(issueForm) }),
      (r) => `Issued, due ${day(r.loan?.dueDate)}`,
    ).then((r) => r && setIssueForm({ barcode: "", username: "" }));

  const giveBack = () =>
    run(
      () =>
        api(LIBRARY_RETURN, {
          method: "POST",
          body: JSON.stringify({ barcode: retCode }),
        }),
      (r) =>
        r.fine
          ? `Returned. Fine ${rupees(r.fine.amountPaise)}`
          : "Returned on time",
    ).then((r) => r && setRetCode(""));

  const search = async () => {
    try {
      setBooks(
        (await api(`${LIBRARY_BOOKS}?q=${encodeURIComponent(q)}`)).books || [],
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const addBook = () =>
    run(
      () =>
        api(LIBRARY_BOOKS, {
          method: "POST",
          body: JSON.stringify({
            title: book.title,
            author: book.author || undefined,
            isbn: book.isbn || undefined,
            barcodes: book.barcodes.split(/[\s,]+/).filter(Boolean),
          }),
        }),
      (r) => `Added ${r.copiesAdded} copies`,
    );

  const importFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const [head, ...rows] = lines;
    if (!head || rows.length === 0) return toast.error("CSV is empty");
    setImporting(true);
    let added = 0;
    let books = 0;
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const csv = [head, ...rows.slice(i, i + CHUNK)].join("\n");
        const r = await api(LIBRARY_IMPORT, {
          method: "POST",
          body: JSON.stringify({ csv }),
        });
        added += r.copiesAdded;
        books += r.books;
      }
      toast.success(`Imported ${added} copies across ${books} titles`);
    } catch (e: any) {
      toast.error(
        `Import stopped: ${e.message}. ${added} copies were added before that.`,
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <ModulePage
      title="Library"
      description="Issue and return by copy barcode. Fines are Rs 1 a day late; paying online is coming soon, so collect at the counter and mark paid."
      actions={
        <button
          type="button"
          className={btn}
          onClick={() =>
            run(
              () => api(LIBRARY_REMIND, { method: "POST" }),
              (r) => `Sent ${r.sent} of ${r.due} reminders`,
            )
          }
        >
          Send due reminders
        </button>
      }
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-900">Issue</p>
          <input
            className={`${input} w-full`}
            placeholder="Copy barcode"
            value={issueForm.barcode}
            onChange={(e) =>
              setIssueForm({ ...issueForm, barcode: e.target.value })
            }
          />
          <input
            className={`${input} w-full`}
            placeholder="Student ID or faculty username"
            value={issueForm.username}
            onChange={(e) =>
              setIssueForm({ ...issueForm, username: e.target.value })
            }
          />
          <button type="button" className={btn} onClick={issue}>
            Issue
          </button>
        </div>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-900">Return</p>
          <input
            className={`${input} w-full`}
            placeholder="Copy barcode"
            value={retCode}
            onChange={(e) => setRetCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && giveBack()}
          />
          <button type="button" className={btn} onClick={giveBack}>
            Return
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <p className="font-medium text-slate-900">Catalogue</p>
        <div className="grid gap-2 md:grid-cols-4">
          <input
            className={input}
            placeholder="Title"
            value={book.title}
            onChange={(e) => setBook({ ...book, title: e.target.value })}
          />
          <input
            className={input}
            placeholder="Author"
            value={book.author}
            onChange={(e) => setBook({ ...book, author: e.target.value })}
          />
          <input
            className={input}
            placeholder="ISBN"
            value={book.isbn}
            onChange={(e) => setBook({ ...book, isbn: e.target.value })}
          />
          <input
            className={input}
            placeholder="Barcodes, comma separated"
            value={book.barcodes}
            onChange={(e) => setBook({ ...book, barcodes: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btn} onClick={addBook}>
            Add book
          </button>
          <label className="text-sm text-slate-600">
            {importing
              ? "Importing..."
              : "Import CSV (title, author, isbn, publisher, year, category, barcode, shelf; one row per copy):"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="ml-2 text-sm"
              disabled={importing}
              onChange={(e) =>
                e.target.files?.[0] && importFile(e.target.files[0])
              }
            />
          </label>
        </div>
        <div className="flex gap-2">
          <input
            className={`${input} flex-1`}
            placeholder="Search title, author or ISBN"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button type="button" className={btn} onClick={search}>
            Search
          </button>
        </div>
        {books.map((b) => (
          <p key={b.id} className="text-sm">
            {b.title} {b.author ? `. ${b.author}` : ""} . {b.available}/
            {b.copies} available
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900">Loans</p>
          <select
            className={input}
            value={loanStatus}
            onChange={(e) => setLoanStatus(e.target.value)}
          >
            <option value="active">On loan</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        {loans.length === 0 && <p className="text-sm text-slate-500">None.</p>}
        {loans.map((l) => (
          <p
            key={l.id}
            className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
          >
            {l.borrowerUsername} ({l.borrowerType}) . issued {day(l.issuedAt)} .
            due {day(l.dueDate)}
            {l.returnedAt ? ` . returned ${day(l.returnedAt)}` : ""}
          </p>
        ))}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-slate-900">Unpaid fines</p>
        {fines.length === 0 && <p className="text-sm text-slate-500">None.</p>}
        {fines.map((f) => (
          <div
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm"
          >
            <span>
              {f.username} . {rupees(f.amountPaise)} . {f.note}
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1"
                onClick={() =>
                  run(
                    () =>
                      api(LIBRARY_SETTLE(f.id), {
                        method: "POST",
                        body: JSON.stringify({ action: "paid" }),
                      }),
                    () => "Marked paid",
                  )
                }
              >
                Paid at counter
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-2 py-1"
                onClick={() =>
                  run(
                    () =>
                      api(LIBRARY_SETTLE(f.id), {
                        method: "POST",
                        body: JSON.stringify({ action: "waived" }),
                      }),
                    () => "Waived",
                  )
                }
              >
                Waive
              </button>
            </span>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
