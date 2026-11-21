import { useEffect, useState } from "react";
import { apiClient } from "../../../api/apiClient";
import { GET_CURRENT_SUBJECTS } from "../../../api/endpoints";
import { Skeleton } from "@/components/ui/Skeleton";
import RegisteredSubjectsPanel, {
  type RegisteredSubjectRow,
} from "./RegisteredSubjectsPanel";

/** Compact current-semester subjects block for the profile academic tab. */
export default function ProfileSemesterSubjects({
  studentId,
}: {
  studentId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<RegisteredSubjectRow[]>([]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Same endpoint as Academics → My subjects. Avoid GET_SEMESTER_OVERVIEW:
        // apiClient unwraps nested `data` and drops `semester`.
        const res = await apiClient<{
          semester: { id: string; name: string; status: string } | null;
          subjects?: Array<{
            id: string;
            createdAt?: string;
            submittedAt?: string;
            subject?: {
              code: string;
              name: string;
              credits: number;
              department?: string;
            };
          }>;
        }>(GET_CURRENT_SUBJECTS(studentId), {}, false);

        if (cancelled) return;
        setSemester(res?.semester ?? null);
        setSubjects(
          (res?.subjects || []).map((r) => ({
            id: r.id,
            subject: r.subject
              ? {
                  code: r.subject.code,
                  name: r.subject.name,
                  credits: r.subject.credits,
                  department: r.subject.department,
                }
              : undefined,
            submittedAt: r.submittedAt || r.createdAt,
          })),
        );
      } catch {
        if (!cancelled) {
          setSemester(null);
          setSubjects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <RegisteredSubjectsPanel semester={semester} subjects={subjects} compact />
  );
}
