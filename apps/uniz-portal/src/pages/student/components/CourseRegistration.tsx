/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import {
  GET_AVAILABLE_SUBJECTS,
  REGISTER_SUBJECTS,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiRequest } from "../../../api/apiClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/table";

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
  customCode?: string;
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
  const code = sub.customCode?.trim() || sub.subject?.code || "";

  return (
    <button
      type="button"
      disabled={locked}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border py-3 text-left transition-colors duration-150",
        !locked && "hover:bg-tint",
        locked && "cursor-default",
      )}
    >
      <span className="w-16 shrink-0 font-sans text-small tabular-nums text-text-2">
        {code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium text-head">{name}</span>
        {sub.faculty?.name ? (
          <span className="mt-0.5 block text-small text-text-2">{sub.faculty.name}</span>
        ) : null}
      </span>
      {sub.isMandatory ? <Badge tone="neutral">Mandatory</Badge> : null}
      <span className="shrink-0 font-sans text-small tabular-nums text-text-2">
        {credits} cr
      </span>
      {selected ? (
        <CheckCircle2 size={18} className="shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
      ) : (
        <Circle size={18} className="shrink-0 text-text-2" strokeWidth={1.75} aria-hidden />
      )}
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
      <div className="mx-auto max-w-3xl space-y-3" aria-hidden>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (confirmation) {
    const regId = String(confirmation.registrationId || "")
      .slice(0, 8)
      .toUpperCase();
    const confirmed = Array.isArray(confirmation.subjects)
      ? confirmation.subjects.map((s: any, i: number) => ({
          ...s,
          rowId: `${s.code || "subject"}-${i}`,
        }))
      : [];
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
            You&apos;re enrolled
          </h2>
          <p className="mt-2 text-body text-text-2">
            Subjects for {confirmation.semester || semesterName} are saved.
          </p>
          {regId ? (
            <p className="mt-2 font-sans text-small tabular-nums text-text-2">
              Registration {regId}
            </p>
          ) : null}
        </div>

        {confirmed.length > 0 && (
          <Table
            columns={[
              {
                id: "code",
                header: "Code",
                meta: true,
                cell: (s: any) => (
                  <span className="font-sans tabular-nums">{s.code || "—"}</span>
                ),
              },
              {
                id: "subject",
                header: "Subject",
                primary: true,
                cell: (s: any) => s.name,
              },
              {
                id: "credits",
                header: "Credits",
                numeric: true,
                meta: true,
                cell: (s: any) => (
                  <span className="font-sans tabular-nums">{s.credits}</span>
                ),
              },
            ]}
            rows={confirmed}
            getRowId={(s: any) => s.rowId}
          />
        )}

        <Button type="button" variant="primary" onClick={onComplete}>
          View my subjects
        </Button>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="success" title="Already registered">
          Your subjects for this semester are on record. View them in My subjects.
        </Alert>
        <Button type="button" variant="primary" onClick={onComplete}>
          View registered subjects
        </Button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert tone="warning" title="Registration is not open yet">
          {windowMessage || (
            <>
              <span className="font-semibold">{semesterName}</span> is still under
              review or outside the registration window.
            </>
          )}
        </Alert>
      </div>
    );
  }

  if (available.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="No courses available"
          body="Registration is closed or your branch has no subjects listed yet."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <p className="text-body text-text-2">
          Core subjects are pre-selected. Pick your electives, one option per group
          where shown.
        </p>
        <p className="font-sans text-body tabular-nums text-text-2">
          {totalCredits} credits · {selectedIds.length} subjects
        </p>
      </div>

      {/* Core subjects */}
      {coreSubjects.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-h3 text-head">Mandatory subjects</h3>
          <div>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-h3 text-head">{group.name}</h3>
              <Badge tone="neutral">{pickLabel}</Badge>
            </div>

            <div>
              {group.items.map((sub, idx) => {
                const id = subjectIdOf(sub);
                const selected = selectedIds.includes(id);
                return (
                  <div key={id}>
                    {group.items.length === 2 && idx === 1 ? (
                      <p className="py-2 text-center text-caption text-text-2">or</p>
                    ) : null}
                    <SubjectOption
                      sub={sub}
                      selected={selected}
                      onSelect={() => toggleSubject(id, group.id, group.limit)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Submit */}
      <div className="space-y-4 border-t border-border pt-4">
        {submitError && (
          <Alert tone="error" title="Registration failed">
            {submitError}
          </Alert>
        )}
        <Alert tone="warning" title="Final submission">
          Review your selections carefully. Registration cannot be changed after
          you confirm.
        </Alert>
        <Button
          type="button"
          variant="primary"
          disabled={submitting || selectedIds.length === 0 || alreadyRegistered}
          isLoading={submitting}
          onClick={handleRegister}
        >
          Register
        </Button>
      </div>
    </div>
  );
}
