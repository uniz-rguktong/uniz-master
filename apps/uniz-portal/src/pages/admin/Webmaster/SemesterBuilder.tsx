/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Send,
  Save,
  Clock,
  ShieldCheck,
  Sparkles,
  CircleDot,
  PlayCircle,
  StopCircle,
  Hourglass,
  Search,
  Library,
  PenLine,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  SEMESTERS,
  CREATE_SEMESTER,
  ADVANCE_SEMESTER,
  UPDATE_SEMESTER_STATUS,
  DELETE_SEMESTER,
  GET_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminCardHoverClass,
  adminLabelClass,
  adminInputClass,
  adminPrimaryButtonClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"];
const YEARS = ["E1", "E2", "E3", "E4"];
const SUBJECT_TYPES = [
  { id: "CORE", label: "Core", hint: "Auto-assigned, mandatory" },
  { id: "ELECTIVE", label: "Professional Elective", hint: "Student chooses" },
  { id: "OPEN_ELECTIVE", label: "Open Elective", hint: "Cross-branch choice" },
  { id: "PE", label: "Physical / Activity", hint: "Yoga, NCC, Sports…" },
];

type SubjectDraft = {
  key: string;
  code: string;
  name: string;
  credits: string;
  department: string;
  academicYear: string;
  subjectType: string;
  electiveGroupCode: string;
  fromCatalog?: boolean;
};

type CatalogSubject = {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: string;
};

function deriveYearFromSemesterName(name: string): string {
  const m = String(name || "").match(/\b(E[1-4])\b/i);
  return m ? m[1].toUpperCase() : "E1";
}

function deriveCatalogSemester(name: string): string {
  const yr = deriveYearFromSemesterName(name);
  const sem = String(name || "").match(/SEM[-\s]?([12])/i);
  return sem ? `${yr}-SEM-${sem[1]}` : "";
}

function buildSemesterQuery(
  catalogSemester: string,
  filterYear: string,
): string | undefined {
  const semMatch = catalogSemester.match(/SEM-[12]/i);
  const semPart = semMatch ? semMatch[0].toUpperCase() : null;
  const yr = filterYear || deriveYearFromSemesterName(catalogSemester);
  if (semPart && yr) return `${yr}-${semPart}`;
  if (catalogSemester) return catalogSemester;
  return filterYear || undefined;
}

function inferYearFromSubjectSemester(semester: string): string {
  const m = String(semester || "").match(/\b(E[1-4])\b/i);
  return m ? m[1].toUpperCase() : "E1";
}

type GroupDraft = {
  key: string;
  groupCode: string;
  groupName: string;
  branch: string;
  academicYear: string;
  selectionLimit: string;
};

const STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    tone: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
  },
  DEAN_REVIEW: {
    label: "Dean Review",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  HOD_REVIEW: {
    label: "HOD Review",
    tone: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  APPROVED: {
    label: "Approved",
    tone: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  REGISTRATION_OPEN: {
    label: "Registration Open",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REGISTRATION_CLOSED: {
    label: "Closed",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

const uid = () => Math.random().toString(36).slice(2, 9);

const inputClass = adminInputClass;
const labelClass = adminLabelClass;

export default function SemesterBuilder() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any[]>(SEMESTERS, {}, false);
      setSemesters(data || []);
    } catch {
      toast.error("Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const advance = async (id: string, action: string, label: string) => {
    try {
      await apiClient(ADVANCE_SEMESTER(id), {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(label);
      fetchSemesters();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  };

  const setStatus = async (id: string, status: string, label: string) => {
    try {
      await apiClient(UPDATE_SEMESTER_STATUS(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(label);
      fetchSemesters();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This is irreversible.`)) return;
    try {
      await apiClient(DELETE_SEMESTER(id), { method: "DELETE" });
      toast.success("Semester deleted");
      fetchSemesters();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500")}>
      <SectionHeader
        icon={<CalendarClock size={18} />}
        eyebrow={
          <>
            <Sparkles size={12} /> Academic workflow
          </>
        }
        title="Semester Registration"
        subtitle="Build a semester from the subject catalog, configure electives, then route through Dean and HOD approval."
        actions={
          <button type="button" onClick={() => setBuilderOpen(true)} className={adminPrimaryButtonClass}>
            <Plus size={16} />
            Create Semester
          </button>
        }
      />

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-zinc-100/80 animate-pulse"
            />
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <EmptyState onCreate={() => setBuilderOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {semesters.map((sem, i) => (
            <SemesterCard
              key={sem.id}
              sem={sem}
              index={i}
              onAdvance={advance}
              onSetStatus={setStatus}
              onRemove={remove}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {builderOpen && (
          <BuilderDrawer
            onClose={() => setBuilderOpen(false)}
            onCreated={() => {
              setBuilderOpen(false);
              fetchSemesters();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-20 px-6 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center mb-5">
        <CalendarClock size={28} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-1.5">
        No semesters yet
      </h3>
      <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-7">
        Create your first registration cycle. Subjects can change every term —
        you add exactly what's offered this semester.
      </p>
      <button type="button" onClick={onCreate} className={adminPrimaryButtonClass}>
        <Plus size={16} /> Create Semester
      </button>
    </div>
  );
}

function SemesterCard({
  sem,
  index,
  onAdvance,
  onSetStatus,
  onRemove,
}: {
  sem: any;
  index: number;
  onAdvance: (id: string, action: string, label: string) => void;
  onSetStatus: (id: string, status: string, label: string) => void;
  onRemove: (id: string, name: string) => void;
}) {
  const meta = STATUS_META[sem.status] || STATUS_META.DRAFT;
  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={cn(adminCardClass, adminCardHoverClass, "group relative p-6 overflow-hidden")}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-zinc-50 to-transparent opacity-70 group-hover:scale-125 transition-transform duration-700" />

      <div className="relative flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900 tracking-tight truncate">
            {sem.name}
          </h3>
          <p className="text-xs font-semibold text-zinc-400 mt-0.5">
            {sem.batch ? `Batch ${sem.batch} · ` : ""}
            {sem.program || "B.Tech"}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-semibold tracking-[0.14em] border ${meta.tone}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="relative grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-zinc-50 px-4 py-3">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400">
            Registrations
          </p>
          <p className="text-xl font-semibold text-zinc-900">
            {sem._count?.registrations ?? 0}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 px-4 py-3">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400">
            Reg. Window
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {fmt(sem.registrationStart)} – {fmt(sem.registrationEnd)}
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-2">
        {sem.status === "DRAFT" && (
          <ActionBtn
            tone="primary"
            icon={<Send size={14} />}
            label="Submit to Dean"
            onClick={() =>
              onAdvance(sem.id, "submit", "Submitted for Dean review")
            }
          />
        )}
        {(sem.status === "DEAN_REVIEW" || sem.status === "HOD_REVIEW") && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500">
            <Hourglass size={14} className="text-amber-500" />
            Awaiting {sem.status === "DEAN_REVIEW" ? "Dean" : "HOD"} approval
          </span>
        )}
        {sem.status === "APPROVED" && (
          <ActionBtn
            tone="primary"
            icon={<PlayCircle size={14} />}
            label="Open Registration"
            onClick={() =>
              onSetStatus(sem.id, "REGISTRATION_OPEN", "Registration opened")
            }
          />
        )}
        {sem.status === "REGISTRATION_OPEN" && (
          <ActionBtn
            tone="dark"
            icon={<StopCircle size={14} />}
            label="Close"
            onClick={() =>
              onSetStatus(sem.id, "REGISTRATION_CLOSED", "Registration closed")
            }
          />
        )}
        <div className="flex-1" />
        <button
          onClick={() => onRemove(sem.id, sem.name)}
          className="p-2.5 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-rose-500 hover:text-white transition-all"
          title="Delete semester"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  tone = "primary",
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  tone?: "primary" | "dark";
}) {
  const tones: Record<string, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    dark: "bg-zinc-900 text-white hover:bg-black",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${tones[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ----------------------------- Builder Drawer ----------------------------- */

const STEPS = [
  { id: 0, label: "Details", icon: CalendarClock },
  { id: 1, label: "Subjects", icon: BookOpen },
  { id: 2, label: "Electives", icon: Layers },
  { id: 3, label: "Review", icon: CheckCircle2 },
];

function BuilderDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — details
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [batch, setBatch] = useState("");
  const [program, setProgram] = useState("B.Tech");
  const [registrationStart, setRegStart] = useState("");
  const [registrationEnd, setRegEnd] = useState("");
  const [semesterStart, setSemStart] = useState("");
  const [semesterEnd, setSemEnd] = useState("");

  // Step 2 — subjects
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);
  const [draft, setDraft] = useState<SubjectDraft>(blankSubject());

  // Step 3 — elective groups
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [gDraft, setGDraft] = useState<GroupDraft>(blankGroup());

  const addSubject = () => {
    if (!draft.code.trim() || !draft.name.trim()) {
      toast.warning("Subject code and name are required");
      return;
    }
    if (!draft.department) {
      toast.warning("Pick a branch for the subject");
      return;
    }
    if (subjects.some((s) => s.code === draft.code.trim().toUpperCase())) {
      toast.warning("This subject code is already on the semester list");
      return;
    }
    setSubjects((s) => [...s, { ...draft, key: uid(), fromCatalog: false }]);
    setDraft(blankSubject());
  };

  const addFromCatalog = (item: CatalogSubject, opts?: Partial<SubjectDraft>) => {
    const code = item.code.trim().toUpperCase();
    if (subjects.some((s) => s.code === code)) {
      toast.warning(`${code} is already on this semester's list`);
      return;
    }
    setSubjects((s) => [
      ...s,
      {
        key: uid(),
        code,
        name: item.name,
        credits: String(item.credits ?? 0),
        department: item.department?.toUpperCase() || "",
        academicYear:
          opts?.academicYear || inferYearFromSubjectSemester(item.semester),
        subjectType: opts?.subjectType || "CORE",
        electiveGroupCode: opts?.electiveGroupCode || "",
        fromCatalog: true,
      },
    ]);
    toast.success(`Added ${code} from catalog`);
  };

  const addGroup = () => {
    if (!gDraft.groupCode.trim() || !gDraft.groupName.trim()) {
      toast.warning("Group code and name are required");
      return;
    }
    setGroups((g) => [...g, { ...gDraft, key: uid() }]);
    setGDraft(blankGroup());
  };

  const submit = async (mode: "draft" | "submit") => {
    if (!name.trim()) {
      toast.warning("Give the semester a name");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await apiClient(CREATE_SEMESTER, {
        method: "POST",
        body: JSON.stringify({
          name,
          academicYear,
          batch,
          program,
          registrationStart: registrationStart || null,
          registrationEnd: registrationEnd || null,
          semesterStart: semesterStart || null,
          semesterEnd: semesterEnd || null,
          submit: mode === "submit",
          subjects: subjects.map((s) => ({
            code: s.code,
            name: s.name,
            credits: Number(s.credits) || 0,
            department: s.department,
            academicYear: s.academicYear,
            subjectType: s.subjectType,
            electiveGroupCode:
              s.subjectType === "CORE" ? "" : s.electiveGroupCode,
            isMandatory: s.subjectType === "CORE",
          })),
          electiveGroups: groups.map((g) => ({
            groupCode: g.groupCode,
            groupName: g.groupName,
            branch: g.branch,
            academicYear: g.academicYear,
            selectionLimit: Number(g.selectionLimit) || 1,
          })),
        }),
      });
      toast.success(
        mode === "submit"
          ? "Semester submitted for Dean review"
          : "Semester saved as draft",
      );
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Failed to create semester");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex justify-end bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="relative w-full max-w-2xl h-full bg-zinc-50 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="px-7 pt-6 pb-5 bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 leading-tight">
                  New Semester
                </h2>
                <p className="text-xs text-zinc-400 font-semibold">
                  Step {step + 1} of {STEPS.length} · {STEPS[step].label}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all w-full justify-center ${
                    i === step
                      ? "bg-zinc-900 text-white"
                      : i < step
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <s.icon size={14} />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <DetailsStep
                  {...{
                    name,
                    setName,
                    academicYear,
                    setAcademicYear,
                    batch,
                    setBatch,
                    program,
                    setProgram,
                    registrationStart,
                    setRegStart,
                    registrationEnd,
                    setRegEnd,
                    semesterStart,
                    setSemStart,
                    semesterEnd,
                    setSemEnd,
                  }}
                />
              )}
              {step === 1 && (
                <SubjectsStep
                  semesterName={name}
                  subjects={subjects}
                  setSubjects={setSubjects}
                  draft={draft}
                  setDraft={setDraft}
                  addSubject={addSubject}
                  addFromCatalog={addFromCatalog}
                  groups={groups}
                />
              )}
              {step === 2 && (
                <ElectivesStep
                  groups={groups}
                  setGroups={setGroups}
                  gDraft={gDraft}
                  setGDraft={setGDraft}
                  addGroup={addGroup}
                />
              )}
              {step === 3 && (
                <ReviewStep
                  name={name}
                  academicYear={academicYear}
                  batch={batch}
                  program={program}
                  registrationStart={registrationStart}
                  registrationEnd={registrationEnd}
                  subjects={subjects}
                  groups={groups}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 bg-white border-t border-zinc-100 flex items-center gap-3">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-sm hover:bg-zinc-200 transition-all"
          >
            <ChevronLeft size={16} />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button
                disabled={saving}
                onClick={() => submit("draft")}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-sm hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                <Save size={15} /> Save Draft
              </button>
              <button
                disabled={saving}
                onClick={() => submit("submit")}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send size={15} /> Submit for Review
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function blankSubject(): SubjectDraft {
  return {
    key: uid(),
    code: "",
    name: "",
    credits: "3",
    department: "",
    academicYear: "E1",
    subjectType: "CORE",
    electiveGroupCode: "",
  };
}

function blankGroup(): GroupDraft {
  return {
    key: uid(),
    groupCode: "",
    groupName: "",
    branch: "ALL",
    academicYear: "",
    selectionLimit: "1",
  };
}

/* ------------------------------- Steps ------------------------------- */

function DetailsStep(p: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>Semester Name</label>
        <input
          className={inputClass}
          placeholder="e.g. AY 2026-27 E3-SEM-1"
          value={p.name}
          onChange={(e) => p.setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Academic Year</label>
          <input
            className={inputClass}
            placeholder="AY 2026-27"
            value={p.academicYear}
            onChange={(e) => p.setAcademicYear(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Batch</label>
          <input
            className={inputClass}
            placeholder="O21"
            value={p.batch}
            onChange={(e) => p.setBatch(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Program</label>
        <input
          className={inputClass}
          placeholder="B.Tech"
          value={p.program}
          onChange={(e) => p.setProgram(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 space-y-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-zinc-900 flex items-center gap-2">
          <Clock size={14} /> Registration Window
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Opens</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={p.registrationStart}
              onChange={(e) => p.setRegStart(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Closes</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={p.registrationEnd}
              onChange={(e) => p.setRegEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 space-y-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-zinc-900 flex items-center gap-2">
          <CalendarClock size={14} /> Semester Dates
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Starts</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={p.semesterStart}
              onChange={(e) => p.setSemStart(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Ends</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={p.semesterEnd}
              onChange={(e) => p.setSemEnd(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectsStep({
  semesterName,
  subjects,
  setSubjects,
  draft,
  setDraft,
  addSubject,
  addFromCatalog,
  groups,
}: {
  semesterName: string;
  subjects: SubjectDraft[];
  setSubjects: React.Dispatch<React.SetStateAction<SubjectDraft[]>>;
  draft: SubjectDraft;
  setDraft: React.Dispatch<React.SetStateAction<SubjectDraft>>;
  addSubject: () => void;
  addFromCatalog: (item: CatalogSubject, opts?: Partial<SubjectDraft>) => void;
  groups: GroupDraft[];
}) {
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterYear, setFilterYear] = useState(() =>
    deriveYearFromSemesterName(semesterName),
  );
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [pickType, setPickType] = useState("CORE");
  const [pickGroup, setPickGroup] = useState("");

  const catalogSemester = useMemo(
    () => deriveCatalogSemester(semesterName),
    [semesterName],
  );

  useEffect(() => {
    setFilterYear(deriveYearFromSemesterName(semesterName));
  }, [semesterName]);

  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const semesterQuery = buildSemesterQuery(catalogSemester, filterYear);
      let page = 1;
      let totalPages = 1;
      const all: CatalogSubject[] = [];

      do {
        const res = await apiClient<any>(
          GET_SUBJECTS,
          {
            params: {
              page,
              limit: 200,
              search: search.trim() || undefined,
              department: filterBranch || undefined,
              semester: semesterQuery || undefined,
            },
          },
          false,
        );
        const list = res?.subjects ?? (Array.isArray(res) ? res : []);
        all.push(...list);
        totalPages = res?.meta?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= 15);

      setCatalog(all);
    } catch {
      toast.error("Failed to load subject catalog");
    } finally {
      setCatalogLoading(false);
    }
  }, [search, filterBranch, filterYear, catalogSemester]);

  useEffect(() => {
    const t = setTimeout(fetchCatalog, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [fetchCatalog, search, filterBranch, filterYear]);

  const addedCodes = useMemo(
    () => new Set(subjects.map((s) => s.code.toUpperCase())),
    [subjects],
  );

  const visibleCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (
        filterYear &&
        !item.semester?.toUpperCase().includes(filterYear.toUpperCase())
      ) {
        return false;
      }
      if (
        filterBranch &&
        item.department?.toUpperCase() !== filterBranch.toUpperCase()
      ) {
        return false;
      }
      return true;
    });
  }, [catalog, filterYear, filterBranch]);

  const isElective = draft.subjectType !== "CORE";
  const pickIsElective = pickType !== "CORE";

  return (
    <div className="space-y-6">
      {/* Catalog picker */}
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-zinc-900 inline-flex items-center gap-2">
              <Library size={14} /> Pick from Subject Catalog
            </p>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              Search and add existing subjects — no need to re-type codes or names.
              {catalogSemester ? ` Filtered for ${catalogSemester}.` : ""}
            </p>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold tracking-wider">
            {subjects.length} on list
          </span>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            className={`${inputClass} pl-11`}
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            <option value="">All branches</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">All years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SUBJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPickType(t.id)}
              className={`text-left px-3 py-2 rounded-xl border transition-all ${
                pickType === t.id
                  ? "border-zinc-300 bg-zinc-100"
                  : "border-zinc-200/70 bg-zinc-50 hover:border-zinc-300"
              }`}
            >
              <p className="text-[11px] font-semibold text-zinc-800">{t.label}</p>
              <p className="text-[10px] text-zinc-400 font-semibold">{t.hint}</p>
            </button>
          ))}
        </div>

        {pickIsElective && (
          <div>
            <label className={labelClass}>Elective group (for picks below)</label>
            <input
              className={inputClass}
              placeholder="e.g. PE101 — define in Electives step if new"
              value={pickGroup}
              onChange={(e) => setPickGroup(e.target.value.toUpperCase())}
              list="group-codes-pick"
            />
            <datalist id="group-codes-pick">
              {groups.map((g: GroupDraft) => (
                <option key={g.key} value={g.groupCode} />
              ))}
            </datalist>
          </div>
        )}

        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/50 divide-y divide-zinc-100 scrollbar-hide">
          {catalogLoading ? (
            <div className="py-10 text-center text-sm text-zinc-400 font-semibold animate-pulse">
              Loading catalog…
            </div>
          ) : visibleCatalog.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-zinc-400 font-semibold">
              No catalog matches — try another branch/year or add a custom subject below.
            </div>
          ) : (
            visibleCatalog.map((item) => {
              const added = addedCodes.has(item.code.toUpperCase());
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/80 hover:bg-white transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-wide">
                      {item.code} · {item.department} · {item.semester} ·{" "}
                      {item.credits}C
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() =>
                      addFromCatalog(item, {
                        academicYear: filterYear || inferYearFromSubjectSemester(item.semester),
                        subjectType: pickType,
                        electiveGroupCode: pickIsElective ? pickGroup : "",
                      })
                    }
                    className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-semibold tracking-wider transition-all ${
                      added
                        ? "bg-emerald-50 text-emerald-600 cursor-default"
                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                    }`}
                  >
                    {added ? (
                      <>
                        <CheckCircle2 size={12} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={12} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Term list */}
      {subjects.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
            This semester ({subjects.length})
          </p>
          {subjects.map((s: SubjectDraft) => (
            <SubjectRow
              key={s.key}
              s={s}
              onRemove={() =>
                setSubjects(subjects.filter((x: SubjectDraft) => x.key !== s.key))
              }
            />
          ))}
        </div>
      )}

      {subjects.length === 0 && (
        <p className="text-center text-sm text-zinc-400 font-semibold py-2">
          Pick subjects from the catalog above to build this term's list.
        </p>
      )}

      {/* Custom / ad-hoc — only when not in catalog */}
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCustomForm((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-zinc-500">
            <PenLine size={14} />
            New subject not in catalog?
          </span>
          <ChevronRight
            size={16}
            className={`text-zinc-400 transition-transform ${showCustomForm ? "rotate-90" : ""}`}
          />
        </button>
        {showCustomForm && (
          <div className="px-5 pb-5 space-y-4 border-t border-zinc-100 pt-4">
            <p className="text-[11px] text-zinc-400 font-medium">
              For one-off or new codes only — will be upserted into the catalog when you save.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                className={inputClass}
                placeholder="Code (CS301)"
                value={draft.code}
                onChange={(e) =>
                  setDraft({ ...draft, code: e.target.value.toUpperCase() })
                }
              />
              <input
                className={`${inputClass} col-span-2`}
                placeholder="Subject name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select
                className={inputClass}
                value={draft.department}
                onChange={(e) =>
                  setDraft({ ...draft, department: e.target.value })
                }
              >
                <option value="">Branch…</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={draft.academicYear}
                onChange={(e) =>
                  setDraft({ ...draft, academicYear: e.target.value })
                }
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={0.5}
                className={inputClass}
                placeholder="Credits"
                value={draft.credits}
                onChange={(e) =>
                  setDraft({ ...draft, credits: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, subjectType: t.id })}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                    draft.subjectType === t.id
                      ? "border-zinc-300 bg-zinc-100"
                      : "border-zinc-200/70 bg-white hover:border-zinc-300"
                  }`}
                >
                  <p className="text-xs font-semibold text-zinc-800">{t.label}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    {t.hint}
                  </p>
                </button>
              ))}
            </div>
            {isElective && (
              <div>
                <label className={labelClass}>Elective Group Code</label>
                <input
                  className={inputClass}
                  placeholder="e.g. PE101"
                  value={draft.electiveGroupCode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      electiveGroupCode: e.target.value.toUpperCase(),
                    })
                  }
                  list="group-codes"
                />
                <datalist id="group-codes">
                  {groups.map((g: GroupDraft) => (
                    <option key={g.key} value={g.groupCode} />
                  ))}
                </datalist>
              </div>
            )}
            <button
              onClick={addSubject}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-900 transition-all"
            >
              <Plus size={16} /> Add Custom Subject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectRow({ s, onRemove }: { s: SubjectDraft; onRemove: () => void }) {
  const typeMeta: Record<string, string> = {
    CORE: "bg-rose-50 text-rose-600 border-rose-100",
    ELECTIVE: "bg-zinc-100 text-zinc-900 border-zinc-200",
    OPEN_ELECTIVE: "bg-sky-50 text-sky-700 border-sky-100",
    PE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center shrink-0">
        <BookOpen size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 truncate">{s.name}</p>
        <p className="text-[10px] font-bold text-zinc-400 tracking-wide">
          {s.code} · {s.department} · {s.academicYear} · {s.credits || 0}C
          {s.electiveGroupCode ? ` · ${s.electiveGroupCode}` : ""}
          {s.fromCatalog ? " · catalog" : " · custom"}
        </p>
      </div>
      <span
        className={`shrink-0 px-2.5 py-1 rounded-lg text-[8px] font-semibold tracking-[0.14em] border ${typeMeta[s.subjectType] || typeMeta.CORE}`}
      >
        {s.subjectType.replace("_", " ")}
      </span>
      <button
        onClick={onRemove}
        className="p-2 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ElectivesStep({ groups, setGroups, gDraft, setGDraft, addGroup }: any) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200/60 bg-violet-50/40 p-4 flex gap-3">
        <CircleDot size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-900 font-semibold leading-relaxed">
          Define groups students choose from. Tag elective subjects with the
          matching group code on the previous step. Students must pick the
          required number from each group.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 space-y-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-zinc-900">
          Add Elective Group
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Group code (PE101)"
            value={gDraft.groupCode}
            onChange={(e) =>
              setGDraft({ ...gDraft, groupCode: e.target.value.toUpperCase() })
            }
          />
          <input
            type="number"
            min={1}
            className={inputClass}
            placeholder="Choose how many"
            value={gDraft.selectionLimit}
            onChange={(e) =>
              setGDraft({ ...gDraft, selectionLimit: e.target.value })
            }
          />
        </div>
        <input
          className={inputClass}
          placeholder="Group name (Choose Physical Education Activity)"
          value={gDraft.groupName}
          onChange={(e) => setGDraft({ ...gDraft, groupName: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={gDraft.branch}
            onChange={(e) => setGDraft({ ...gDraft, branch: e.target.value })}
          >
            <option value="ALL">All branches</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={gDraft.academicYear}
            onChange={(e) =>
              setGDraft({ ...gDraft, academicYear: e.target.value })
            }
          >
            <option value="">Any year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addGroup}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all"
        >
          <Plus size={16} /> Add Group
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-sm text-zinc-400 font-semibold py-6">
          No elective groups — only core subjects this term.
        </p>
      ) : (
        <div className="space-y-2.5">
          {groups.map((g: GroupDraft) => (
            <div
              key={g.key}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-800 truncate">
                  {g.groupName}
                </p>
                <p className="text-[10px] font-bold text-zinc-400 tracking-wide">
                  {g.groupCode} · {g.branch} · choose {g.selectionLimit}
                  {g.academicYear ? ` · ${g.academicYear}` : ""}
                </p>
              </div>
              <button
                onClick={() =>
                  setGroups(groups.filter((x: GroupDraft) => x.key !== g.key))
                }
                className="p-2 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  name,
  academicYear,
  batch,
  program,
  registrationStart,
  registrationEnd,
  subjects,
  groups,
}: any) {
  const fmt = (d: string) =>
    d ? new Date(d).toLocaleString("en-IN") : "Not set";
  const core = subjects.filter((s: SubjectDraft) => s.subjectType === "CORE");
  const electives = subjects.filter(
    (s: SubjectDraft) => s.subjectType !== "CORE",
  );
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-6">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-white/60 mb-1">
          {program} {batch ? `· Batch ${batch}` : ""}{" "}
          {academicYear ? `· ${academicYear}` : ""}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight">
          {name || "Untitled Semester"}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm font-semibold text-white/80">
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} /> {subjects.length} subjects
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={14} /> {groups.length} elective groups
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400 mb-1">
            Registration Opens
          </p>
          <p className="text-sm font-semibold text-zinc-800">
            {fmt(registrationStart)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400 mb-1">
            Registration Closes
          </p>
          <p className="text-sm font-semibold text-zinc-800">
            {fmt(registrationEnd)}
          </p>
        </div>
      </div>

      <ReviewList title={`Core Subjects (${core.length})`} items={core} />
      <ReviewList
        title={`Elective / Choice Subjects (${electives.length})`}
        items={electives}
      />

      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 flex gap-3">
        <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 font-semibold leading-relaxed">
          <strong>Save Draft</strong> keeps editing later.{" "}
          <strong>Submit for Review</strong> notifies the Dean and locks the
          flow into the approval pipeline.
        </p>
      </div>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: SubjectDraft[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 mb-3">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-bold text-zinc-700 truncate">
              {s.code} · {s.name}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 shrink-0 ml-3">
              {s.department} · {s.credits || 0}C
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
