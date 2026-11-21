import { formatStatus } from "@/utils/displayText";
import { useState, useEffect } from "react";
import { apiClient } from "../../api/apiClient";
import { GET_SEMESTER_OVERVIEW } from "../../api/endpoints";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/tile";

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

export default function CurrentSemesterAdmin() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient<any>(GET_SEMESTER_OVERVIEW);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to fetch semester overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-text" />
          <p className="text-dense text-text-2">Syncing academic data…</p>
        </div>
      </div>
    );
  }

  if (!data?.semester) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-4 py-8">
        <EmptyState
          title="No session active"
          body="Please initialize a semester record in Curriculum Management."
        />
      </div>
    );
  }

  const { semester, data: adminData } = data;
  const approved = semester.status === "APPROVED";

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-8 px-4 py-8">
      <PageHeader
        title={semester.name}
        meta="Institutional academic structure overview"
        action={
          <div className="flex flex-wrap gap-2">
            <Badge>Active session</Badge>
            <Badge tone={approved ? "success" : "warning"}>
              {formatStatus(semester.status)}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="Total branches" value={adminData?.summary?.totalBranches || 0} />
        <StatTile label="Total subjects" value={adminData?.summary?.totalSubjects || 0} />
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className={sectionTitleClass}>Branch allocations</h2>

        {adminData?.branches?.map((branch: any) => (
          <div
            key={branch.branch}
            className="overflow-hidden rounded-lg border border-border bg-surface"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedBranch(
                  expandedBranch === branch.branch ? null : branch.branch,
                )
              }
              className="flex w-full flex-col gap-3 p-4 text-left hover:bg-tint sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="text-dense font-medium text-head">
                  {branch.branch} Department
                </h3>
                <p className="mt-1 text-caption text-text-3">
                  Years: {branch.academicYears?.join(", ")}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p className="text-small text-text-2">
                  {branch.subjectCount} subjects · {branch.totalCredits} credits
                </p>
                {expandedBranch === branch.branch ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-text-3" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-3" />
                )}
              </div>
            </button>

            {expandedBranch === branch.branch && (
              <div className="border-t border-border bg-bg p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {branch.subjects?.map((sub: any) => (
                    <div
                      key={sub.code}
                      className="flex flex-col justify-between rounded-lg border border-border bg-surface p-4"
                    >
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-caption text-text-3">{sub.year} session</span>
                          <Badge tone={sub.isApproved ? "success" : "warning"}>
                            {sub.isApproved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <h4 className="text-dense font-medium text-text">{sub.name}</h4>
                        <p className="mt-1 text-caption text-text-3">{sub.code}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-caption text-text-2">
                        <span>{formatStatus(sub.status)}</span>
                        <span className="text-dense text-text">{sub.credits} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
