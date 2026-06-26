import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import { GET_SEMESTER_OVERVIEW } from "../../../api/endpoints";
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
        const res = await apiClient<{
          semester: { id: string; name: string; status: string } | null;
          data?: {
            registrations?: Array<{
              id: string;
              subjectCode: string;
              subjectName: string;
              credits: number;
              registeredAt?: string;
            }>;
          };
        }>(GET_SEMESTER_OVERVIEW, {}, false);

        if (cancelled) return;
        setSemester(res?.semester ?? null);
        setSubjects(
          (res?.data?.registrations || []).map((r) => ({
            id: r.id,
            subject: {
              code: r.subjectCode,
              name: r.subjectName,
              credits: r.credits,
            },
            submittedAt: r.registeredAt,
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
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <RegisteredSubjectsPanel
      semester={semester}
      subjects={subjects}
      compact
    />
  );
}
