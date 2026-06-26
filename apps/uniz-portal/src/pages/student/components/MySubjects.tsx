import { useState, useEffect, useCallback } from "react";
import { Loader2, ClipboardList, BookOpenCheck } from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import { GET_AVAILABLE_SUBJECTS, GET_CURRENT_SUBJECTS } from "../../../api/endpoints";
import { cn } from "@/lib/utils";
import CourseRegistration from "./CourseRegistration";
import RegisteredSubjectsPanel, {
  type RegisteredSubjectRow,
} from "./RegisteredSubjectsPanel";

interface Semester {
  id: string;
  name: string;
  status: string;
}

interface CurrentSubjectsResponse {
  semester: Semester | null;
  subjects: RegisteredSubjectRow[];
  alreadyRegistered?: boolean;
}

type TabId = "subjects" | "register";

export default function MySubjects({
  studentId,
  branch,
  year,
}: {
  studentId: string;
  branch: string;
  year: string;
}) {
  const [data, setData] = useState<CurrentSubjectsResponse | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("subjects");

  const fetchSubjects = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [current, available] = await Promise.all([
        apiClient<CurrentSubjectsResponse>(
          GET_CURRENT_SUBJECTS(studentId),
          {},
          false,
        ),
        apiClient<{
          alreadyRegistered?: boolean;
          isOpen?: boolean;
        }>(GET_AVAILABLE_SUBJECTS(branch, year), {}, false).catch(() => null),
      ]);

      const registered =
        (current?.subjects?.length ?? 0) > 0 ||
        current?.alreadyRegistered ||
        available?.alreadyRegistered;

      setData(current);
      setRegistrationOpen(available?.isOpen ?? false);
      setActiveTab(registered ? "subjects" : "register");
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId, branch, year]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const hasRegistered = (data?.subjects?.length ?? 0) > 0;
  const showRegisterTab = !hasRegistered && registrationOpen;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
            Semester registration
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {hasRegistered ? "Your current semester" : "Course registration"}
          </h1>
        </div>

        <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              activeTab === "subjects"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            <BookOpenCheck size={14} />
            My subjects
          </button>
          {showRegisterTab && (
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === "register"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              <ClipboardList size={14} />
              Register
            </button>
          )}
        </div>
      </div>

      {activeTab === "subjects" ? (
        <RegisteredSubjectsPanel
          semester={data?.semester ?? null}
          subjects={data?.subjects ?? []}
        />
      ) : showRegisterTab ? (
        <CourseRegistration
          branch={branch}
          year={year}
          onComplete={fetchSubjects}
        />
      ) : (
        <RegisteredSubjectsPanel
          semester={data?.semester ?? null}
          subjects={data?.subjects ?? []}
        />
      )}
    </div>
  );
}
