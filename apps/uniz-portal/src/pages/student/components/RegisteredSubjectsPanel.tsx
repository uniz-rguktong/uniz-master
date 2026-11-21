import { formatStatus } from "@/utils/displayText";
import { Download } from "lucide-react";
import { downloadFile } from "@/api/apiClient";
import { DOWNLOAD_REGISTRATION } from "@/api/endpoints";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, type TableColumn } from "@/components/ui/table";

export type RegisteredSubjectRow = {
  id: string;
  subject?: {
    code: string;
    name: string;
    credits: number;
    department?: string;
  };
  submittedAt?: string;
};

type SemesterInfo = {
  id: string;
  name: string;
  status: string;
};

function formatRegisteredDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RegisteredSubjectsPanel({
  semester,
  subjects,
  compact = false,
}: {
  semester: SemesterInfo | null;
  subjects: RegisteredSubjectRow[];
  compact?: boolean;
}) {
  if (!semester) {
    return (
      <EmptyState
        title="No active semester"
        body="There is no semester to show subjects for."
      />
    );
  }

  const totalCredits = subjects.reduce(
    (acc, row) => acc + (row.subject?.credits || 0),
    0,
  );

  const columns: TableColumn<RegisteredSubjectRow>[] = [
    {
      id: "code",
      header: "Code",
      meta: true,
      cell: (row) => (
        <span className="font-sans tabular-nums">{row.subject?.code || "—"}</span>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      primary: true,
      cell: (row) => row.subject?.name || "—",
    },
    {
      id: "credits",
      header: "Credits",
      numeric: true,
      meta: true,
      cell: (row) =>
        row.subject?.credits != null ? (
          <span className="font-sans tabular-nums">
            {Number(row.subject.credits).toFixed(1)}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  if (!compact) {
    columns.splice(2, 0, {
      id: "department",
      header: "Department",
      cell: (row) => row.subject?.department || "—",
    });
    columns.push({
      id: "registered",
      header: "Registered",
      numeric: true,
      cell: (row) => (
        <span className="font-sans tabular-nums">
          {formatRegisteredDate(row.submittedAt)}
        </span>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-body font-medium text-head">{semester.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{formatStatus(semester.status)}</Badge>
            <span className="text-small text-text-2">
              <span className="font-sans tabular-nums">{subjects.length}</span> subjects ·{" "}
              <span className="font-sans tabular-nums">{totalCredits}</span> credits
            </span>
          </div>
        </div>

        {!compact && subjects.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() =>
              downloadFile(
                DOWNLOAD_REGISTRATION(semester.id),
                `REGISTRATION_${semester.id}.pdf`,
              )
            }
          >
            <Download size={16} strokeWidth={1.75} aria-hidden />
            Download PDF
          </Button>
        )}
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          title="No registered subjects yet"
          body={`You have not completed registration for ${semester.name}. Use the Register tab when enrollment is open.`}
        />
      ) : (
        <Table columns={columns} rows={subjects} getRowId={(row) => row.id} />
      )}

      {!compact && subjects.length > 0 && (
        <p className="text-small text-text-2">
          Official enrollment record. These are your confirmed subjects for this
          semester. Contact Academic Affairs if anything looks incorrect.
        </p>
      )}
    </div>
  );
}
