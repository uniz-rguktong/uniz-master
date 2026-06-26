/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Hash,
  Circle,
  AlertCircle,
} from "lucide-react";
import {
  GET_AVAILABLE_SUBJECTS,
  REGISTER_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiRequest } from "../../../api/apiClient";
import { cn } from "@/lib/utils";
import {
  adminCardClass,
  adminCardHoverClass,
  adminChipClass,
  adminEyebrowClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSectionTitleClass,
  adminStatValueClass,
  adminWarningBannerClass,
  adminWarningTextClass,
  adminWarningTitleClass,
} from "@/components/admin/admin-ui";

type ElectiveGroupMeta = {
  id: string;
  groupCode?: string;
  groupName?: string;
  selectionLimit?: number;
};

type AllocRow = {
  subjectId: string;
  subject?: { id: string; code: string; name: string; credits: number };
  customName?: string;
  customCredits?: number;
  isMandatory?: boolean;
  electiveGroupId?: string;
  electiveGroupName?: string;
  electiveLimit?: number;
  faculty?: { name: string };
};

function subjectIdOf(sub: AllocRow) {
  return sub.subject?.id || sub.subjectId;
}

function SubjectOption({
  sub,
  selected,
  locked,
  onSelect,
}: {
  sub: AllocRow;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
}) {
  const credits = sub.customCredits ?? sub.subject?.credits ?? 0;
  const name = sub.customName || sub.subject?.name || "Subject";
  const code = sub.subject?.code || "";

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      className={cn(
        adminCardClass,
        "relative w-full p-4 text-left flex items-start gap-3.5 transition-all duration-200",
        !locked && adminCardHoverClass,
        selected
          ? "border-zinc-900 bg-white shadow-[0_2px_12px_-4px_rgba(10,10,10,0.12)]"
          : locked
            ? "border-zinc-200 bg-zinc-50/50"
            : "border-zinc-200/80 opacity-90 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          selected ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500",
        )}
      >
        <BookOpen size={18} strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-zinc-400 tracking-wide">
            {code}
          </span>
          {sub.isMandatory && (
            <span className="rounded-md border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600">
              Mandatory
            </span>
          )}
          <span className="ml-auto rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 tabular-nums">
            {credits} cr
          </span>
        </div>
        <p
          className={cn(
            "text-[14px] font-semibold leading-snug tracking-tight",
            selected ? "text-zinc-900" : "text-zinc-600",
          )}
        >
          {name}
        </p>
        {sub.faculty?.name && (
          <p className="text-[11px] text-zinc-400">{sub.faculty.name}</p>
        )}
      </div>

      <div className="shrink-0 pt-1">
        {selected ? (
          <CheckCircle2 size={18} className="text-zinc-900" strokeWidth={2.5} />
        ) : (
          <Circle size={18} className="text-zinc-300" strokeWidth={2} />
        )}
      </div>
    </button>
  );
}

export default function CourseRegistration({
  branch = "",
  year = "",
  onComplete,
}: {
  branch?: string;
  year?: string;
  onComplete: () => void;
}) {
  const [available, setAvailable] = useState<AllocRow[]>([]);
  const [electiveGroupsMeta, setElectiveGroupsMeta] = useState<ElectiveGroupMeta[]>(
    [],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [semesterName, setSemesterName] = useState("");
  const [windowMessage, setWindowMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const submitLockRef = useRef(false);

  const fetchAvailable = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const result = await apiRequest<any>(
        GET_AVAILABLE_SUBJECTS(branch, year),
        {},
        false,
      );
      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }
      const data = result.data;
      if (data) {
        const subs: AllocRow[] = data.subjects || [];
        setAvailable(subs);
        setElectiveGroupsMeta(data.electiveGroups || []);
        const mandatoryIds = subs
          .filter((s) => s.isMandatory)
          .map((s) => subjectIdOf(s));
        setSelectedIds(mandatoryIds);
        setAlreadyRegistered(data.alreadyRegistered || false);
        setIsOpen(data.isOpen ?? true);
        setWindowMessage(data.windowMessage || null);
        setSemesterName(data.semester?.name || "");
        if (data.alreadyRegistered) {
          submitLockRef.current = true;
        }
      }
    } catch (error) {
      console.error("Failed to fetch available subjects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const { coreSubjects, electiveGroups } = useMemo(() => {
    const core: AllocRow[] = [];
    const map = new Map<
      string,
      { id: string; name: string; limit: number; items: AllocRow[] }
    >();

    for (const sub of available) {
      const gid = (sub.electiveGroupId || "").trim();
      if (sub.isMandatory || !gid) {
        core.push(sub);
        continue;
      }
      if (!map.has(gid)) {
        const meta = electiveGroupsMeta.find(
          (g) => g.groupCode === gid || g.id === gid,
        );
        map.set(gid, {
          id: gid,
          name: sub.electiveGroupName || meta?.groupName || "Elective group",
          limit: sub.electiveLimit || meta?.selectionLimit || 1,
          items: [],
        });
      }
      map.get(gid)!.items.push(sub);
    }

    return {
      coreSubjects: core,
      electiveGroups: [...map.values()],
    };
  }, [available, electiveGroupsMeta]);

  const toggleSubject = (id: string, groupId?: string, limit?: number) => {
    const sub = available.find((s) => subjectIdOf(s) === id);
    if (sub?.isMandatory) return;

    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter((i) => i !== id);

      if (groupId && groupId.trim() !== "" && limit) {
        const groupSubs = available
          .filter((s) => s.electiveGroupId === groupId)
          .map((s) => subjectIdOf(s));
        const selectedInGroup = prev.filter((i) => groupSubs.includes(i));
        if (selectedInGroup.length >= limit) {
          if (limit === 1 && selectedInGroup.length === 1) {
            return [...prev.filter((i) => !groupSubs.includes(i)), id];
          }
          toast.warning(
            `You can only select ${limit} course(s) from this group.`,
          );
          return prev;
        }
      }
      return [...prev, id];
    });
  };

  const handleRegister = async () => {
    if (submitting || alreadyRegistered || submitLockRef.current) {
      return;
    }

    const groups: Record<string, { limit: number; selected: number; name: string }> =
      {};
    available.forEach((s) => {
      const gid = (s.electiveGroupId || "").trim();
      if (!gid) return;
      if (!groups[gid]) {
        groups[gid] = {
          limit: s.electiveLimit || 1,
          selected: 0,
          name: s.electiveGroupName || gid,
        };
      }
      if (selectedIds.includes(subjectIdOf(s))) groups[gid].selected++;
    });

    for (const g of Object.values(groups)) {
      if (g.selected < g.limit) {
        toast.error(`Please select ${g.limit} from ${g.name}.`);
        return;
      }
    }

    if (selectedIds.length === 0) {
      toast.warning("Please select at least one subject");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    submitLockRef.current = true;
    try {
      const result = await apiRequest<any>(
        REGISTER_SUBJECTS,
        {
          method: "POST",
          body: JSON.stringify({ subjectIds: selectedIds }),
        },
        false,
      );

      if (!result.ok) {
        submitLockRef.current = result.status === 409;
        setSubmitError(result.message);
        if (result.status === 409) {
          setAlreadyRegistered(true);
          toast.info(result.message);
        } else {
          toast.error(result.message);
        }
        return;
      }

      const res = result.data;
      if (!res?.success && !res?.confirmation) {
        submitLockRef.current = false;
        const msg = "Registration could not be completed. Please try again.";
        setSubmitError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Registration submitted successfully");
      setAlreadyRegistered(true);
      setConfirmation(res?.confirmation || { semester: semesterName });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCredits = available
    .filter((s) => selectedIds.includes(subjectIdOf(s)))
    .reduce((acc, s) => acc + (s.customCredits || s.subject?.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
        <p className={adminLabelClass}>Loading course list…</p>
      </div>
    );
  }

  if (confirmation) {
    const regId = String(confirmation.registrationId || "")
      .slice(0, 8)
      .toUpperCase();
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className={cn(adminCardClass, "p-8 text-center")}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 text-white flex items-center justify-center mb-5">
            <CheckCircle2 size={28} />
          </div>
          <span className={adminChipClass}>Registration confirmed</span>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 mt-4">
            You&apos;re enrolled
          </h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
            Subjects for <strong>{confirmation.semester || semesterName}</strong>{" "}
            are saved.
          </p>
          {regId && (
            <div className="inline-flex items-center gap-2 mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600">
              <Hash size={13} /> {regId}
            </div>
          )}
        </div>

        {Array.isArray(confirmation.subjects) && confirmation.subjects.length > 0 && (
          <div className={cn(adminCardClass, "p-5")}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={adminSectionTitleClass}>Registered subjects</h3>
              <span className={adminChipClass}>
                {confirmation.totalCredits || 0} credits
              </span>
            </div>
            <ul className="divide-y divide-zinc-100">
              {confirmation.subjects.map((s: any, i: number) => (
                <li
                  key={i}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span className="font-medium text-zinc-800 truncate pr-3">
                    {s.code} · {s.name}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400 tabular-nums shrink-0">
                    {s.credits} cr
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="button" onClick={onComplete} className={cn(adminPrimaryButtonClass, "w-full")}>
          View my subjects
        </button>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className={cn(adminCardClass, "max-w-xl mx-auto p-10 text-center")}>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900">Already registered</h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Your subjects for this semester are on record. View them in My Subjects.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className={cn(adminPrimaryButtonClass, "mt-6")}
        >
          View registered subjects
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className={cn(adminCardClass, "max-w-xl mx-auto p-10 text-center border-dashed")}>
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
          <ShieldCheck size={28} />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900">
          Registration not open yet
        </h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          {windowMessage || (
            <>
              <strong>{semesterName}</strong> is still under review or outside
              the registration window.
            </>
          )}
        </p>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className={cn(adminCardClass, "max-w-xl mx-auto p-10 text-center")}>
        <h3 className="text-xl font-semibold text-zinc-900">No courses available</h3>
        <p className="text-sm text-zinc-500 mt-2">
          Registration is closed or your branch has no subjects listed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500">
      {/* Hero */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 text-white p-6 md:p-8 shadow-[0_8px_30px_-12px_rgba(10,10,10,0.35)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-white/90">
              <ShieldCheck size={12} /> Open enrollment
            </span>
            <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight">
              Semester subject registration
            </h2>
            <p className="text-sm text-zinc-300 max-w-md leading-relaxed">
              Core subjects are pre-selected. Pick your electives — one option per
              group where shown.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className={cn(adminLabelClass, "text-zinc-400")}>Credits</p>
              <p className={cn(adminStatValueClass, "text-white text-3xl")}>
                {totalCredits}
              </p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div className="text-right">
              <p className={cn(adminLabelClass, "text-zinc-400")}>Subjects</p>
              <p className={cn(adminStatValueClass, "text-white text-3xl")}>
                {selectedIds.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core subjects */}
      {coreSubjects.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className={adminEyebrowClass}>Core</p>
            <h3 className={adminSectionTitleClass}>Mandatory subjects</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coreSubjects.map((sub) => {
              const id = subjectIdOf(sub);
              return (
                <SubjectOption
                  key={id}
                  sub={sub}
                  selected={selectedIds.includes(id)}
                  locked
                  onSelect={() => {}}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Elective groups — pick 1 of N */}
      {electiveGroups.map((group) => {
        const pickLabel =
          group.limit === 1 && group.items.length === 2
            ? "Choose 1 of 2"
            : `Choose ${group.limit} of ${group.items.length}`;

        return (
          <section key={group.id} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className={adminEyebrowClass}>Elective</p>
                <h3 className={adminSectionTitleClass}>{group.name}</h3>
              </div>
              <span className={adminChipClass}>{pickLabel}</span>
            </div>

            <div
              className={cn(
                "grid gap-3",
                group.items.length === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {group.items.map((sub, idx) => {
                const id = subjectIdOf(sub);
                const selected = selectedIds.includes(id);
                return (
                  <div key={id} className="relative">
                    {group.items.length === 2 && idx === 0 && (
                      <span className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2 w-6 h-6 rounded-full border border-zinc-200 bg-[#fafafa] text-[9px] font-bold text-zinc-400 items-center justify-center">
                        or
                      </span>
                    )}
                    <SubjectOption
                      sub={sub}
                      selected={selected}
                      onSelect={() =>
                        toggleSubject(id, group.id, group.limit)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Submit */}
      <div className="space-y-4 pt-2 border-t border-zinc-200/70">
        {submitError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-900">
                Registration failed
              </p>
              <p className="text-sm text-rose-800/90 mt-1">{submitError}</p>
            </div>
          </div>
        )}
        <div className={adminWarningBannerClass}>
          <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className={adminWarningTitleClass}>Final submission</p>
            <p className={adminWarningTextClass}>
              Review your selections carefully. Registration cannot be changed after
              you confirm.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={submitting || selectedIds.length === 0 || alreadyRegistered}
          onClick={handleRegister}
          className={cn(adminPrimaryButtonClass, "w-full h-12")}
        >
          {submitting ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            "Confirm registration"
          )}
        </button>
      </div>
    </div>
  );
}
