/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatStatus } from "@/utils/displayText";
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
  BarChart3,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  SEMESTERS,
  DEAN_REVIEW,
  ADVANCE_SEMESTER,
  ELECTIVE_GROUPS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminChipClass,
  adminEyebrowClass,
  adminLabelClass,
  adminSectionTitleClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminDangerButtonClass,
  adminSegmentWrapClass,
  adminSegmentActiveClass,
  adminSegmentInactiveClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import RegistrationTracking from "../Webmaster/RegistrationTracking";

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
  const [trackingSem, setTrackingSem] = useState<any | null>(null);

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

  if (trackingSem) {
    return (
      <RegistrationTracking
        semester={trackingSem}
        onBack={() => setTrackingSem(null)}
      />
    );
  }

  if (selected) {
    return (
      <DetailView
        sem={selected}
        allocations={allocations}
        groups={groups}
        loading={detailLoading}
        acting={acting}
        isHod={isHod}
        myBranch={myBranch}
        canAct={selected.status === pendingStatus}
        onBack={() => setSelected(null)}
        onAct={act}
      />
    );
  }

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500")}>
      <SectionHeader
        eyebrow={
          <>
            <ShieldCheck size={12} /> {isHod ? `HOD · ${myBranch}` : "Dean of Academics"}
          </>
        }
        title="Semester Approvals"
        subtitle={
          isHod
            ? "Review your branch's subjects and electives, then open registration."
            : "Verify each semester's subjects, electives and dates before routing to HODs."
        }
        icon={<ShieldCheck size={18} />}
      />

      {/* Pending */}
      <section className="space-y-4">
        <h2 className={cn(adminEyebrowClass, "text-amber-600")}>
          <Hourglass size={14} className="inline mr-1.5" /> Awaiting your approval ({pending.length})
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-zinc-100/70 animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className={cn(adminCardClass, "border-dashed py-14 text-center")}>
            <Inbox size={32} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-sm font-bold text-zinc-500">
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
          <h2 className={adminEyebrowClass}>
            All semesters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {others.map((sem) => (
              <div
                key={sem.id}
                className={cn(adminCardClass, "px-5 py-4 flex flex-col gap-3")}
              >
                <button
                  type="button"
                  onClick={() => openDetail(sem)}
                  className="text-left hover:opacity-90 transition-opacity"
                >
                  <p className={cn(adminSectionTitleClass, "truncate")}>
                    {sem.name}
                  </p>
                  <p className={cn(adminLabelClass, "mt-1 normal-case")}>
                    {formatStatus(sem.status)}
                  </p>
                </button>
                {(sem.status === "REGISTRATION_OPEN" ||
                  sem.status === "REGISTRATION_CLOSED") && (
                  <button
                    type="button"
                    onClick={() => setTrackingSem(sem)}
                    className={cn(adminGhostButtonClass, "w-full text-xs")}
                  >
                    <BarChart3 size={14} />
                    Registration progress
                  </button>
                )}
              </div>
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
        <span className={cn(adminChipClass, "bg-amber-500 text-white border-amber-500")}>
          Review
        </span>
      </div>
      <h3 className={cn(adminSectionTitleClass, "text-lg truncate")}>
        {sem.name}
      </h3>
      <p className="text-xs font-medium text-zinc-400 mt-1">
        {sem.batch ? `Batch ${sem.batch} · ` : ""}
        {sem.program || "B.Tech"}
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 group-hover:gap-2.5 transition-all">
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
  myBranch,
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
  myBranch: string;
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
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-400")}>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft size={16} /> Back to approvals
      </button>

      {/* Hero */}
      <div className="rounded-3xl bg-zinc-900 text-white p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className={cn(adminLabelClass, "text-white/60 mb-1")}>
            {sem.program || "B.Tech"}
            {sem.batch ? ` · Batch ${sem.batch}` : ""} ·{" "}
            {formatStatus(sem.status)}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.01em]">
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
        <div className={adminSegmentWrapClass}>
          {["all", ...BRANCHES].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBranchFilter(b)}
              className={
                branchFilter === b
                  ? adminSegmentActiveClass
                  : adminSegmentInactiveClass
              }
            >
              {b === "all" ? "All Branches" : b}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-100/70 animate-pulse" />
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
                    <p className="text-sm font-semibold text-zinc-800 truncate">
                      {g.groupName}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-wide">
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
            <div className={cn(adminCardClass, "border-dashed py-14 text-center")}>
              <Building2 size={30} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-sm font-bold text-zinc-500">
                No subjects allocated{branchFilter !== "all" ? ` for ${branchFilter}` : ""}.
              </p>
            </div>
          )}
        </>
      )}

      {/* Credits + actions */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-white/80 backdrop-blur-xl border-t border-zinc-200/70 flex items-center gap-3">
        <div className="mr-auto">
          <p className={adminLabelClass}>Total Credits</p>
          <p className="text-xl font-semibold text-zinc-900 tabular-nums">{totalCredits}</p>
        </div>
        {canAct ? (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => onAct("reject")}
              className={cn(adminDangerButtonClass, "disabled:opacity-50")}
            >
              <RotateCcw size={15} /> Send Back
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => onAct("approve")}
              className={cn(adminPrimaryButtonClass, "disabled:opacity-50")}
            >
              <CheckCircle2 size={16} />
              {isHod ? `Approve ${myBranch}` : "Approve → HODs"}
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400">
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
    <div className={cn(adminCardClass, "overflow-hidden p-0")}>
      <div className="px-5 py-3.5 border-b border-zinc-200/70 flex items-center gap-2">
        <span className="text-zinc-400">{icon}</span>
        <h3 className={adminEyebrowClass}>{title}</h3>
        <span className="ml-auto text-[10px] font-semibold text-zinc-300 tabular-nums">
          {items.length}
        </span>
      </div>
      <AnimatePresence>
        <div className="divide-y divide-zinc-50">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(adminSectionTitleClass, "truncate")}>
                  {a.customName || a.subject?.name}
                </p>
                <p className="text-[10px] font-medium text-zinc-400 tracking-wide">
                  {a.customCode || a.subject?.code} · {a.branch} · {a.academicYear} ·{" "}
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
