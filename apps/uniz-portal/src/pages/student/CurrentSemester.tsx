import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { student } from "../../store";
import { apiClient } from "../../api/apiClient";
import { GET_CURRENT_SUBJECTS } from "../../api/endpoints";
import RegisteredSubjectsPanel, {
  type RegisteredSubjectRow,
} from "./components/RegisteredSubjectsPanel";

export default function CurrentSemester() {
  const userData = useRecoilValue<any>(student);
  const studentId = (
    userData?.username ||
    localStorage.getItem("username") ||
    ""
  ).replace(/"/g, "");

  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<RegisteredSubjectRow[]>([]);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        // Same source as Academics registration tab — avoids overview unwrap bug.
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
        }>(GET_CURRENT_SUBJECTS(studentId));
        if (res) {
          setSemester(res.semester ?? null);
          setSubjects(
            (res.subjects || []).map((r) => ({
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
        }
      } catch (err) {
        console.error("Failed to fetch semester overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 font-bold text-xs tracking-[0.14em]">
            Loading Semester Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
          Current semester
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Your registered subjects
        </h1>
      </div>

      <RegisteredSubjectsPanel semester={semester} subjects={subjects} />
    </div>
  );
}
