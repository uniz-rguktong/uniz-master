import { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { student, studentAuthLoading } from "../../store";
import { AlertTriangle, Download } from "lucide-react";
import { GET_ATTENDANCE, DOWNLOAD_ATTENDANCE } from "../../api/endpoints";
import { apiClient, downloadFile } from "../../api/apiClient";
import {
  writeAcademicCache,
  readAcademicCache,
  isCacheStale,
} from "../../utils/academicCache";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/tile";
import { Table, type TableColumn } from "@/components/ui/table";
import { portalLabelClass, portalSelectClass } from "@/lib/portal-ui";

interface AttendanceRecord {
  subject: string | { name: string; [key: string]: any };
  totalClasses: number;
  attendedClasses: number;
  percentage: string | number;
}

interface AttendanceResponse {
  success: boolean;
  attendance: AttendanceRecord[];
  summary: any;
  msg?: string;
}

// Define semester options with year and semester mappings (same as GradeHub)
const semesterOptions = [
  { id: "2ae9044f-dade-4020-bbb9-0611a8502b2a", name: "Sem - 1", year: "E1" },
  { id: "118f9490-c2e2-4013-a508-8d1819c09e1f", name: "Sem - 2", year: "E1" },
  { id: "49693fc4-dcbe-4c9d-9033-95e184ce787a", name: "Sem - 1", year: "E2" },
  { id: "f955f237-ceef-4c7f-a6c6-a47b8421adeb", name: "Sem - 2", year: "E2" },
  { id: "265e4b17-6d03-4431-924f-3a885d81ba3c", name: "Sem - 1", year: "E3" },
  { id: "b34fa0e3-d88f-494a-94a4-96ece7ecc693", name: "Sem - 2", year: "E3" },
  { id: "f8979cba-3824-4ebd-a384-f333da6a1746", name: "Sem - 1", year: "E4" },
  { id: "ee050aca-1b1b-465c-91b7-2b88cdc8e5b3", name: "Sem - 2", year: "E4" },
];

// Unique years
const years = Array.from(
  new Set(semesterOptions.map((opt) => opt.year)),
).sort();

function subjectName(record: AttendanceRecord) {
  return typeof record.subject === "string"
    ? record.subject
    : record.subject?.name || "Unknown Subject";
}

function percentValue(record: AttendanceRecord) {
  return parseFloat(String(record.percentage ?? ""));
}

export default function Attendance() {
  const user = useRecoilValue(student);
  const authLoading = useRecoilValue(studentAuthLoading);
  const [selectedYear, setSelectedYear] = useState("E1");
  const [selectedSemester, setSelectedSemester] = useState("Sem - 1");
  const [attendanceData, setAttendanceData] =
    useState<AttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsFetched, setResultsFetched] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Guard: prevents concurrent duplicate API calls
  const isFetchingRef = useRef(false);
  // Stable primitive deps (avoids re-triggering on every Recoil poll tick)
  const userUsername = user?.username;

  // Ref for auto-scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get available semesters for the selected year
  const availableSemesters = semesterOptions
    .filter((opt) => opt.year === selectedYear)
    .map((opt) => opt.name)
    .sort();

  // Load from cache when year/semester changes
  useEffect(() => {
    if (!userUsername) return;
    const mappedSemester = selectedSemester.replace("Sem - ", "SEM-");
    const cached = readAcademicCache<AttendanceResponse>(
      "attendance",
      userUsername,
      selectedYear,
      mappedSemester,
      true,
    );
    if (cached) {
      setAttendanceData(cached);
      setResultsFetched(true);
      setFromCache(true);
      // Background refresh only if stale AND not already in-flight
      if (
        isCacheStale(
          "attendance",
          userUsername,
          selectedYear,
          mappedSemester,
        ) &&
        !isFetchingRef.current
      ) {
        handleFetchAttendance(true);
      }
    } else {
      setAttendanceData(null);
      setResultsFetched(false);
      setFromCache(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, userUsername]);

  // Fetch attendance data
  const handleFetchAttendance = async (silent = false) => {
    if (!userUsername) {
      setError("Please sign in to view attendance");
      return;
    }

    if (!selectedYear || !selectedSemester) {
      setError("Please select both a year and a semester");
      return;
    }

    // Strict single-call guard: bail out if a request is already in-flight
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) {
      setIsLoading(true);
      setError("");
      setAttendanceData(null);
    }

    try {
      // Map "Sem - 1" -> "SEM-1" for API consistency
      const mappedSemester = selectedSemester.replace("Sem - ", "SEM-");

      const data = await apiClient<AttendanceResponse>(GET_ATTENDANCE, {
        method: "GET",
        params: {
          studentId: userUsername,
          year: selectedYear,
          semester: mappedSemester,
        },
      });

      if (data && data.success) {
        setAttendanceData(data);
        setResultsFetched(true);
        setFromCache(false);
        writeAcademicCache(
          "attendance",
          userUsername!,
          selectedYear,
          mappedSemester,
          data,
        );

        // Auto-scroll only on manual fetches
        if (!silent) {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      } else {
        setError(data?.msg || "Failed to fetch attendance");
        setAttendanceData(null);
      }
    } catch (err) {
      if (!silent) setError("An error occurred while fetching attendance");
      setAttendanceData(null);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  // Skeleton Loader Component
  // Show a loading state while the /me call is in-flight to prevent false "Sign In" flash
  // Handle dynamic loading message
  if (authLoading) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
        <Skeleton className="mt-4 h-11 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const records = Array.isArray(attendanceData?.attendance)
    ? attendanceData.attendance
    : [];
  // Summary calculation if available, or just a placeholder
  const overall =
    records.length > 0
      ? records.reduce(
          (acc, curr) => acc + (parseFloat(String(curr?.percentage || "0")) || 0),
          0,
        ) / records.length
      : null;
  const belowAverage = overall != null && overall < 75;

  const columns: TableColumn<AttendanceRecord & { id: string }>[] = [
    {
      id: "subject",
      header: "Subject",
      primary: true,
      cell: (row) => (
        <span className="font-medium text-head">
          {subjectName(row)}
          <span className="mt-0.5 block text-small font-normal text-text-2 sm:hidden">
            Held {row.totalClasses} · Attended {row.attendedClasses}
          </span>
        </span>
      ),
    },
    {
      id: "held",
      header: "Held",
      numeric: true,
      cell: (row) => row.totalClasses,
    },
    {
      id: "attended",
      header: "Attended",
      numeric: true,
      cell: (row) => row.attendedClasses,
    },
    {
      id: "percent",
      header: "Percent",
      numeric: true,
      meta: true,
      cell: (row) => `${row.percentage}%`,
    },
    {
      id: "status",
      header: "Status",
      meta: true,
      cell: (row) => {
        const value = percentValue(row);
        const below = !Number.isFinite(value) || value < 75;
        return below ? (
          <Badge tone="warning">Below 75%</Badge>
        ) : (
          <Badge tone="success">On track</Badge>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        meta="Held classes, attended classes, and percentage."
        action={
          <Button
            variant={userUsername ? "primary" : "outline"}
            onClick={() => handleFetchAttendance()}
            isLoading={isLoading}
            disabled={isLoading || !userUsername}
          >
            {isLoading ? "Fetching…" : fromCache ? "Refresh" : "Get attendance"}
          </Button>
        }
      />
      {/* Selection Criteria */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={portalLabelClass} htmlFor="attendance-year">
            Academic Year
          </label>
          <select
            id="attendance-year"
            value={selectedYear}
            onChange={(event) => {
              const year = event.target.value;
              setSelectedYear(year);
              setSelectedSemester(
                semesterOptions.filter((opt) => opt.year === year)[0].name,
              );
              setResultsFetched(false);
              setAttendanceData(null);
            }}
            className={portalSelectClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="attendance-semester">
            Semester
          </label>
          <select
            id="attendance-semester"
            value={selectedSemester}
            onChange={(event) => {
              setSelectedSemester(event.target.value);
              setResultsFetched(false);
              setAttendanceData(null);
            }}
            className={portalSelectClass}
          >
            {availableSemesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Loading State */}
      {isLoading && !attendanceData ? (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Attendance unavailable" body={error} />
      ) : !userUsername && !resultsFetched ? (
        /* Not Logged In State - only show AFTER /me has resolved */
        <EmptyState
          title="Sign in to view attendance"
          body="Sign in with your university ID to see held and attended classes."
        />
      ) : !resultsFetched ? (
        /* Empty State - only show after /me resolved and user is known */
        <EmptyState
          title="Choose a semester"
          body="Select a year and semester, then get attendance."
        />
      ) : (
        /* Results Section */
        <div ref={resultsRef} className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-2xl font-normal leading-8 text-head">
              {selectedYear} / {selectedSemester}
            </h2>
            {records.length > 0 ? (
              <Button
                variant="outline"
                size="compact"
                onClick={async () => {
                  const mappedSemester = selectedSemester.replace("Sem - ", "SEM-");
                  const semId = `${selectedYear}-${mappedSemester}`;
                  await downloadFile(
                    DOWNLOAD_ATTENDANCE(semId),
                    `Attendance_${userUsername}_${semId}.pdf`,
                    { studentId: userUsername },
                  );
                }}
              >
                <Download size={16} aria-hidden />
                Export PDF
              </Button>
            ) : null}
          </div>
          {/* Content */}
          {overall != null ? (
            <div className="grid grid-cols-1 min-[821px]:grid-cols-2 min-[1100px]:grid-cols-4">
              <StatTile
                label="Semester average"
                value={`${overall.toFixed(1)}%`}
                line={belowAverage ? "Below 75%" : "On track"}
                status={belowAverage ? "warning" : undefined}
                icon={belowAverage ? AlertTriangle : undefined}
              />
            </div>
          ) : null}
          {records.length === 0 ? (
            <EmptyState
              title="No attendance yet"
              body="This semester has no attendance records."
            />
          ) : (
            <Table
              columns={columns}
              rows={records.map((record, index) => ({
                ...record,
                id: `${subjectName(record)}-${index}`,
              }))}
              getRowId={(row) => row.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
