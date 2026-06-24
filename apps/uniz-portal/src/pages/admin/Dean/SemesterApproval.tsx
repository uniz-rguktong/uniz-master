/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ChevronLeft,
  BookOpen,
  Layers,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Hourglass,
  Building2,
  Inbox,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  SEMESTERS,
  DEAN_REVIEW,
  ADVANCE_SEMESTER,
  ELECTIVE_GROUPS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "CHEM", "MME"];

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not set";

export default function SemesterApproval({ role }: { role: string }) {
  const isHod = role === "hod";
  const myBranch = useMemo(() => {
    const dept = (localStorage.getItem("department") || "").replace(/"/g, "");
    if (dept) return dept.toUpperCase();
    const uname = (localStorage.getItem("username") || "").replace(/"/g, "");
    const part = uname.split("_")[1];
    return part ? part.toUpperCase() : "CSE";
  }, []);

  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const pendingStatus = isHod ? "HOD_REVIEW" : "DEAN_REVIEW";

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

  const openDetail = async (sem: any) => {
    setSelected(sem);
    setDetailLoading(true);
    try {
      const branchParam = isHod ? myBranch : "all";
      const [allocRes, groupRes] = await Promise.all([
        apiClient<any[]>(
          `${DEAN_REVIEW(branchParam)}?semesterId=${sem.id}`,
          {},
          false,
        ),
        apiClient<any[]>(
          `${ELECTIVE_GROUPS(sem.id)}?branch=${isHod ? myBranch : "all"}`,
          {},
          false,
        ),
      ]);
      setAllocations(allocRes || []);
      setGroups(groupRes || []);
    } catch {
      toast.error("Failed to load allocations");
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (action: "approve" | "reject") => {
    if (!selected) return;
    setActing(true);
    try {
      const res = await apiClient<any>(ADVANCE_SEMESTER(selected.id), {
        method: "POST",
        body: JSON.stringify({ action, branch: isHod ? myBranch : undefined }),
      });
      if (action === "approve") {
        if (isHod && res?.pendingBranches?.length) {
          toast.success(
            `${myBranch} approved — waiting on: ${res.pendingBranches.join(", ")}`,
          );
        } else if (isHod) {
          toast.success("All branches approved — registration is now open");
        } else {
          toast.success("Approved — routed to HODs");
        }
      } else {
        toast.success("Sent back for modifications");
      }
      setSelected(null);
      fetchSemesters();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  const pending = semesters.filter((s) => s.status === pendingStatus);
  const others = semesters.filter((s) => s.status !== pendingStatus);

  if (selected) {
    return (
      <DetailView
        sem={selected}
        allocations={allocations}
        groups={groups}
        loading={detailLoading}
        acting={acting}
        isHod={isHod}
        canAct={selected.status === pendingStatus}
        onBack={() => setSelected(null)}
        onAct={act}
      />
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 text-navy-900 text-[10px] font-black uppercase tracking-[0.2em]">
          <ShieldCheck size={12} /> {isHod ? `HOD · ${myBranch}` : "Dean of Academics"}
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          Semester Approvals
        </h1>
        <p className="text-slate-500 font-medium max-w-xl">
          {isHod
            ? "Review your branch's subjects and electives, then open registration."
            : "Verify each semester's subjects, electives and dates before routing to HODs."}
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
          <Hourglass size={14} /> Awaiting your approval ({pending.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-14 text-center">
            <Inbox size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">
              Nothing pending right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pending.map((sem, i) => (
              <PendingCard key={sem.id} sem={sem} index={i} onOpen={openDetail} />
            ))}
          </div>
        )}
      </section>

      {/* Others */}
      {others.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            All semesters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {others.map((sem) => (
              <button
                key={sem.id}
                onClick={() => openDetail(sem)}
                className="text-left rounded-2xl border border-slate-200/70 bg-white px-5 py-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <p className="text-sm font-black text-slate-800 truncate">
                  {sem.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {sem.status.replace(/_/g, " ")}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PendingCard({
  sem,
  index,
  onOpen,
}: {
  sem: any;
  index: number;
  onOpen: (s: any) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onOpen(sem)}
      className="group text-left relative rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white p-6 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <CalendarClock size={22} />
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest">
          Review
        </span>
      </div>
      <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
        {sem.name}
      </h3>
      <p className="text-xs font-semibold text-slate-400 mt-1">
        {sem.batch ? `Batch ${sem.batch} · ` : ""}
        {sem.program || "B.Tech"}
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-navy-900 group-hover:gap-2.5 transition-all">
        Review now <ChevronLeft size={16} className="rotate-180" />
      </div>
    </motion.button>
  );
}

function DetailView({
  sem,
  allocations,
  groups,
  loading,
  acting,
  isHod,
  canAct,
  onBack,
  onAct,
}: {
  sem: any;
  allocations: any[];
  groups: any[];
  loading: boolean;
  acting: boolean;
  isHod: boolean;
  canAct: boolean;
  onBack: () => void;
  onAct: (a: "approve" | "reject") => void;
}) {
  const [branchFilter, setBranchFilter] = useState("all");

  const filtered =
    branchFilter === "all"
      ? allocations
      : allocations.filter(
          (a) => (a.branch || "").toUpperCase() === branchFilter,
        );

  const core = filtered.filter(
    (a) => (a.subjectType || (a.isMandatory ? "CORE" : "ELECTIVE")) === "CORE",
  );
  const electives = filtered.filter(
    (a) => (a.subjectType || (a.isMandatory ? "CORE" : "ELECTIVE")) !== "CORE",
  );

  const totalCredits = filtered.reduce(
    (acc, a) => acc + (a.customCredits || a.subject?.credits || 0),
    0,
  );

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-400">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-navy-900 transition-colors"
      >
        <ChevronLeft size={16} /> Back to approvals
      </button>

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-700 text-white p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">
            {sem.program || "B.Tech"}
            {sem.batch ? ` · Batch ${sem.batch}` : ""} ·{" "}
            {sem.status.replace(/_/g, " ")}
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {sem.name}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm font-semibold text-white/80">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} /> {filtered.length} subjects
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={14} /> {groups.length} elective groups
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock size={14} /> Opens {fmt(sem.registrationStart)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter (dean only) */}
      {!isHod && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {["all", ...BRANCHES].map((b) => (
            <button
              key={b}
              onClick={() => setBranchFilter(b)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                branchFilter === b
                  ? "bg-navy-900 text-white"
                  : "bg-white text-slate-400 border border-slate-200"
              }`}
            >
              {b === "all" ? "All Branches" : b}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Elective groups summary */}
          {groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-violet-200/60 bg-violet-50/40 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">
                      {g.groupName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wide">
                      {g.groupCode} · {g.branch} · choose {g.selectionLimit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SubjectGroup title="Core Subjects" items={core} icon={<BookOpen size={14} />} />
          <SubjectGroup
            title="Elective / Choice Subjects"
            items={electives}
            icon={<Layers size={14} />}
          />

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-14 text-center">
              <Building2 size={30} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-500">
                No subjects allocated{branchFilter !== "all" ? ` for ${branchFilter}` : ""}.
              </p>
            </div>
          )}
        </>
      )}

      {/* Credits + actions */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center gap-3">
        <div className="mr-auto">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Total Credits
          </p>
          <p className="text-xl font-black text-slate-900">{totalCredits}</p>
        </div>
        {canAct ? (
          <>
            <button
              disabled={acting}
              onClick={() => onAct("reject")}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <RotateCcw size={15} /> Send Back
            </button>
            <button
              disabled={acting}
              onClick={() => onAct("approve")}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {isHod ? `Approve ${myBranch}` : "Approve → HODs"}
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400">
            <CheckCircle2 size={15} className="text-emerald-500" /> Read only
          </span>
        )}
      </div>
    </div>
  );
}

function SubjectGroup({
  title,
  items,
  icon,
}: {
  title: string;
  items: any[];
  icon: JSX.Element;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
          {title}
        </h3>
        <span className="ml-auto text-[10px] font-black text-slate-300">
          {items.length}
        </span>
      </div>
      <AnimatePresence>
        <div className="divide-y divide-slate-50">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800 truncate">
                  {a.customName || a.subject?.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 tracking-wide">
                  {a.subject?.code} · {a.branch} · {a.academicYear} ·{" "}
                  {a.customCredits || a.subject?.credits || 0}C
                  {a.electiveGroupId ? ` · ${a.electiveGroupId}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
