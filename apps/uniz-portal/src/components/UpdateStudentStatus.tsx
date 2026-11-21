import { useRecoilValue, useSetRecoilState } from "recoil";
import { offCampus } from "../store";
import { UPDATE_STUDENT_STATUS } from "../api/endpoints";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import { toast } from "@/utils/toast-ref";
import { useOutsideCampus } from "../hooks/useOutsideCampus";
import { Search, Clock, CalendarDays } from "lucide-react";
import { Input } from "./Input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

const StudentCardSkeleton = () => (
  <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-surface-2" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="h-3 w-20 rounded bg-surface-2" />
      </div>
    </div>
    <div className="space-y-2 py-2">
      <div className="h-3 w-full rounded bg-surface-2" />
      <div className="h-3 w-4/5 rounded bg-surface-2" />
    </div>
    <div className="h-11 w-full rounded-full bg-surface-2" />
  </div>
);

export default function UpdateStatus() {
  useIsAuth();
  useOutsideCampus();
  const students = useRecoilValue(offCampus) || [];
  const setOffCampus = useSetRecoilState(offCampus);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, _setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (students) {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const filtered = students.filter(
          (student: any) =>
            student.username.toLowerCase().includes(query) ||
            student.name.toLowerCase().includes(query),
        );
        setFilteredStudents(filtered);
      } else {
        setFilteredStudents(students);
      }
    }
  }, [searchQuery, students]);

  const updateStatus = async (userId: string, id: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setUpdatingId(id);
    try {
      const bodyData = JSON.stringify({ userId, id });
      const res = await fetch(UPDATE_STUDENT_STATUS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: bodyData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.msg);
        setOffCampus((prev: any[]) =>
          prev.filter((s: any) => s._id !== userId),
        );
      } else {
        toast.error(data.msg);
      }
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Off-campus students"
        meta="Manage students currently marked as outside the campus."
      />

      <div className="max-w-[640px]">
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onchangeFunction={(e: any) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <StudentCardSkeleton key={i} />
          ))
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student: any) => (
            <div
              key={student._id}
              className="flex h-full flex-col rounded-lg border border-border bg-surface p-5"
            >
              <div className="mb-4 border-b border-border pb-4">
                <h3 className="text-dense font-medium text-head">{student.name}</h3>
                <p className="mt-1 text-small text-text-2">{student.username}</p>
              </div>

              <div className="flex-1 space-y-4">
                {student.outings_list
                  .filter((o: any) => !o.is_expired && o.is_approved)
                  .map((outing: any) => (
                    <div
                      key={outing._id}
                      className="rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <p className="mb-2 flex items-center gap-2 text-dense font-medium text-text">
                        <Clock className="h-4 w-4 text-text-2" /> Outing
                      </p>
                      <p className="text-small text-text-2">
                        From {outing.from_time} · To {outing.to_time}
                      </p>
                      <p className="mb-3 mt-1 text-small text-text-2">“{outing.reason}”</p>
                      <Button
                        size="compact"
                        className="w-full"
                        isLoading={updatingId === outing._id}
                        onClick={() => updateStatus(student._id, outing._id)}
                      >
                        Mark as returned
                      </Button>
                    </div>
                  ))}

                {student.outpasses_list
                  .filter((o: any) => !o.is_expired && o.is_approved)
                  .map((outpass: any) => (
                    <div
                      key={outpass._id}
                      className="rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <p className="mb-2 flex items-center gap-2 text-dense font-medium text-text">
                        <CalendarDays className="h-4 w-4 text-text-2" /> Outpass
                      </p>
                      <p className="text-small text-text-2">
                        From {outpass.from_day} · To {outpass.to_day}
                      </p>
                      <p className="mb-3 mt-1 text-small text-text-2">“{outpass.reason}”</p>
                      <Button
                        size="compact"
                        className="w-full"
                        isLoading={updatingId === outpass._id}
                        onClick={() => updateStatus(student._id, outpass._id)}
                      >
                        Mark as returned
                      </Button>
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-caption text-text-3 sm:flex-row sm:justify-between">
                <span className="min-w-0 truncate">{student.email}</span>
                <span className="capitalize">{student.gender}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              title="No active students outside"
              body={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : "All students are currently marked as present in campus."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
