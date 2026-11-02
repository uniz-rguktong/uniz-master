import { useCallback, useEffect, useState } from "react";
import { ModulePage, DisabledState } from "@/components/module-shell";
import { isModuleEnabled } from "@/lib/flags";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "@/api/apiClient";
import {
  SEMESTERS,
  GET_SUBJECTS,
  FEEDBACK_FORMS,
  FEEDBACK_CLOSE,
} from "@/api/endpoints";
import { leaveFetch as apiFetch } from "@/pages/faculty/leave/api";
import FeedbackResults from "./FeedbackResults";

/** Exam cell / Dean view: create forms per subject, close them, see aggregates. */
export default function FeedbackAdmin() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subjectId: "",
    facultyUsername: "",
    closesAt: "",
  });

  useEffect(() => {
    apiClient<any>(SEMESTERS)
      .then((data) => {
        if (Array.isArray(data)) {
          setSemesters(data);
          if (data[0]) setSemesterId(data[0].id);
        }
      })
      .catch(() => setSemesters([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      apiClient<any>(GET_SUBJECTS, {
        params: { page: 1, limit: 50, search },
      } as any)
        .then((r) => setSubjects(r?.subjects || []))
        .catch(() => setSubjects([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!semesterId) return;
    try {
      const r = await apiFetch(
        `${FEEDBACK_FORMS}?semesterId=${encodeURIComponent(semesterId)}`,
      );
      setForms(r.forms || []);
      setError(null);
    } catch (e: any) {
      setError(e.status === 503 ? "Feedback is turned off" : e.message);
    }
  }, [semesterId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isModuleEnabled("FEEDBACK")) {
    return <DisabledState reason="Feedback is turned off" />;
  }

  const create = async () => {
    if (!form.subjectId || !form.closesAt)
      return toast.error("Pick a subject and closing date");
    try {
      await apiFetch(FEEDBACK_FORMS, {
        method: "POST",
        body: JSON.stringify({
          semesterId,
          subjectId: form.subjectId,
          facultyUsername: form.facultyUsername || undefined,
          closesAt: new Date(`${form.closesAt}T23:59:00`).toISOString(),
        }),
      });
      toast.success("Form opened");
      setForm({ subjectId: "", facultyUsername: "", closesAt: "" });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const close = async (id: string) => {
    try {
      await apiFetch(FEEDBACK_CLOSE(id), { method: "POST" });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ModulePage
      title="Course Feedback"
      description="Anonymous student feedback per subject. Results stay hidden until 5 responses."
    >
      {error ? <DisabledState reason={error} /> : null}
      <select
 className="rounded-lg border px-3 py-2 text-sm"
        value={semesterId}
        onChange={(e) => setSemesterId(e.target.value)}
      >
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || s.id}
          </option>
        ))}
      </select>

 <div className="flex flex-wrap items-end gap-2 rounded-xl border p-4 text-sm">
        <input
 className="rounded border px-2 py-1"
          placeholder="Search subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
 className="rounded border px-2 py-1"
          value={form.subjectId}
          onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
        >
          <option value="">Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} {s.name}
            </option>
          ))}
        </select>
        <input
 className="rounded border px-2 py-1"
          placeholder="Faculty username (optional)"
          value={form.facultyUsername}
          onChange={(e) =>
            setForm({ ...form, facultyUsername: e.target.value })
          }
        />
        <input
          type="date"
 className="rounded border px-2 py-1"
          value={form.closesAt}
          onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
        />
        <button
 className="rounded bg-slate-900 px-3 py-1 text-white"
          onClick={create}
        >
          Open form
        </button>
      </div>

      <div className="space-y-2">
        {forms.length === 0 ? (
 <p className="text-sm text-slate-500">No forms for this semester.</p>
        ) : null}
        {forms.map((f) => (
 <div key={f.id} className="rounded-xl border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <b>{f.title}</b>
                {f.facultyUsername ? ` (${f.facultyUsername})` : ""},{" "}
                {f.responses} responses,{" "}
                {f.status === "open"
                  ? `closes ${String(f.closesAt).slice(0, 10)}`
                  : "closed"}
              </span>
              <span className="flex gap-2">
                <button
 className="rounded border px-2 py-1"
                  onClick={() => setOpen(open === f.id ? null : f.id)}
                >
                  Results
                </button>
                {f.status === "open" ? (
                  <button
 className="rounded border px-2 py-1"
                    onClick={() => close(f.id)}
                  >
                    Close
                  </button>
                ) : null}
              </span>
            </div>
            {open === f.id ? (
              <div className="mt-3">
                <FeedbackResults formId={f.id} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
