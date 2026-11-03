import { Skeleton } from "@/components/ui/Skeleton";
import { useState, useEffect, useCallback } from "react";
import { ClipboardList, BookOpenCheck } from "lucide-react";
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
      <div className="space-y-6" aria-busy="true" aria-label="Loading subjects">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
 <div className="rounded-2xl border border-line bg-white p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
 <p className="text-[13px] font-medium text-ink-subtle">
            Semester registration
          </p>
 <h1 className="mt-1 text-[28px] md:text-[32px] font-semibold tracking-[-0.03em] leading-tight text-navy">
            {hasRegistered ? "Your current semester" : "Course registration"}
          </h1>
        </div>

 <div className="flex gap-1 p-1 bg-navy/[0.05] rounded-xl w-fit" role="tablist">
          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 px-4 rounded-lg text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
              activeTab === "subjects"
                ? "bg-white text-navy shadow-sm"
                : "text-ink-muted hover:text-navy",
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
                "inline-flex min-h-11 items-center gap-2 px-4 rounded-lg text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
                activeTab === "register"
                  ? "bg-white text-navy shadow-sm"
                  : "text-ink-muted hover:text-navy",
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
