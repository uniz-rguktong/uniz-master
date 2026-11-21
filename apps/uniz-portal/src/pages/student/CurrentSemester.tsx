import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { Download } from "lucide-react";
import { student } from "../../store";
import { apiClient, downloadFile } from "../../api/apiClient";
import { DOWNLOAD_REGISTRATION, GET_CURRENT_SUBJECTS } from "../../api/endpoints";
import { formatStatus } from "@/utils/displayText";
import type { RegisteredSubjectRow } from "./components/RegisteredSubjectsPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, type TableColumn } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/ui/empty-state";
import SeatingArrangement from "./components/SeatingArrangement";

function formatRegisteredDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const columns: TableColumn<RegisteredSubjectRow>[] = [
  {
    id: "subject",
    header: "Subject",
    primary: true,
    cell: (row) => (
      <span className="font-medium text-head">
        {row.subject?.name || "—"}
        <span className="mt-0.5 block text-small font-normal text-text-2 sm:hidden">
          {row.subject?.code || "—"} · {row.subject?.department || "—"} ·{" "}
          {row.subject?.credits != null ? Number(row.subject.credits).toFixed(1) : "—"}{" "}
          credits · {formatRegisteredDate(row.submittedAt)}
        </span>
      </span>
    ),
  },
  {
    id: "code",
    header: "Code",
    cell: (row) => <span className="tabular-nums">{row.subject?.code || "—"}</span>,
  },
  {
    id: "department",
    header: "Department",
    cell: (row) => row.subject?.department || "—",
  },
  {
    id: "credits",
    header: "Credits",
    numeric: true,
    cell: (row) =>
      row.subject?.credits != null ? Number(row.subject.credits).toFixed(1) : "—",
  },
  {
    id: "registered",
    header: "Registered",
    numeric: true,
    cell: (row) => formatRegisteredDate(row.submittedAt),
  },
];

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
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-11 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const totalCredits = subjects.reduce(
    (acc, row) => acc + (row.subject?.credits || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Current semester"
        meta={semester?.name || "Your registered subjects"}
        action={
          semester && subjects.length > 0 ? (
            <Button
              type="button"
              onClick={() =>
                downloadFile(
                  DOWNLOAD_REGISTRATION(semester.id),
                  `REGISTRATION_${semester.id}.pdf`,
                )
              }
            >
              <Download size={16} aria-hidden />
              Download PDF
            </Button>
          ) : null
        }
      />

      {!semester ? (
        <EmptyState title="No active semester" />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No registered subjects yet"
          body={`You have not completed registration for ${semester.name}. Use the Register tab when enrollment is open.`}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-normal leading-8 text-head">
              {semester.name}
            </h2>
            <Badge tone="neutral">{formatStatus(semester.status)}</Badge>
          </div>
          <Table
            columns={columns}
            rows={subjects}
            getRowId={(row) => row.id}
            footer={
              <p className="text-dense tabular-nums text-text-2">
                {subjects.length} subjects · {totalCredits} credits
              </p>
            }
          />
          <p className="text-dense leading-5 text-text-2">
            Official enrollment record — these are your confirmed subjects for
            this semester. Contact Academic Affairs if anything looks incorrect.
          </p>
        </div>
      )}

      <div className="border-t border-border pt-8">
        <SeatingArrangement />
      </div>
    </div>
  );
}
