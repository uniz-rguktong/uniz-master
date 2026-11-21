import { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "@/utils/toast-ref";
import { apiClient, downloadFile } from "../../api/apiClient";
import { student, studentAuthLoading } from "../../store";
import {
  writeAcademicCache,
  readAcademicCache,
  isCacheStale,
} from "../../utils/academicCache";

import { AlertCircle, Download } from "lucide-react";
import { GET_GRADES, DOWNLOAD_GRADES } from "../../api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/tile";
import { Table, type TableColumn } from "@/components/ui/table";
import { portalLabelClass, portalSelectClass } from "@/lib/portal-ui";

// Helper function to truncate long text

export default function GradeHub() {
  const user = useRecoilValue(student);
  const authLoading = useRecoilValue(studentAuthLoading);
  // Hardcoded options as per requirements
  const years = ["E1", "E2", "E3", "E4"];
  const semesterOptions = ["Sem 1", "Sem 2"];

  const [selectedYear, setSelectedYear] = useState(user?.year || "E1");
  const [selectedSemester, setSelectedSemester] = useState("Sem 1");

  // Update year when user data loads
  // Only sync the initially-selected year once user data arrives - do NOT depend
  // on the full `user` object or each 60-second Recoil poll would re-trigger
  // the cascade of useEffects below.
  const userYear = user?.year;
  const userUsername = user?.username;
  useEffect(() => {
    if (userYear) setSelectedYear(userYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userUsername]); // only run when the USER changes, not every poll tick
  const [grades, setGrades] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsFetched, setResultsFetched] = useState(false);

  // Ref for auto-scrolling to results table
  const resultsRef = useRef<HTMLDivElement>(null);
  // Guard: prevents concurrent duplicate API calls
  const isFetchingRef = useRef(false);

  // Load from cache whenever year/semester selection changes
  useEffect(() => {
    if (!userUsername) return;
    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
    const cached = readAcademicCache<any>(
      "grades",
      userUsername,
      selectedYear,
      mappedSemester,
      true,
    );
    if (cached) {
      setGrades(cached);
      setResultsFetched(true);
      // Background refresh only if stale AND not already fetching
      if (
        isCacheStale("grades", userUsername, selectedYear, mappedSemester) &&
        !isFetchingRef.current
      ) {
        handleFetchResults(true);
      }
    } else {
      setGrades(null);
      setResultsFetched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, userUsername]);

  // Helper to map points to letter grades
  const pointToGrade = (point: number) => {
    if (point >= 10) return "Ex";
    if (point >= 9) return "A";
    if (point >= 8) return "B";
    if (point >= 7) return "C";
    if (point >= 6) return "D";
    if (point >= 5) return "E";
    return "R";
  };

  // Handle Fetch Results button click
  const handleFetchResults = async (silent = false) => {
    if (!userUsername) {
      toast.error("Please sign in to view grades");
      return;
    }

    if (!selectedYear || !selectedSemester) {
      toast.error("Please select both a year and a semester");
      return;
    }

    // Strict single-call guard: bail out if a request is already in-flight
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) {
      setIsLoading(true);
      setError("");
    }

    // Map "Sem 1" -> "SEM-1" and "Sem 2" -> "SEM-2"
    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";

    try {
      const data = await apiClient<any>(GET_GRADES, {
        method: "GET",
        params: {
          studentId: userUsername,
          semester: mappedSemester,
          year: selectedYear,
        },
      });

      // apiClient handles status 404, 401, etc.
      if (!data) {
        setIsLoading(false);
        // If it was a captcha error (400), the user will see a toast
        // We should reset captcha to let them try again
        return;
      }

      if (data.success && data.grades) {
        const gpaDataObj =
          data.gpa?.[mappedSemester] ||
          data.gpa?.[`${selectedYear}-${mappedSemester}`] ||
          (Object.values(data.gpa || {})[0] as any);
        const extractedGPA = gpaDataObj ? gpaDataObj.gpa : data.cgpa || 0;

        const formattedGrades = data.grades.map((g: any) => ({
          subject: g.subject.name,
          credits: g.subject.credits,
          grade: pointToGrade(g.grade),
          points: g.grade,
          isRemedial: g.isRemedial,
          attemptNumber: g.attemptNumber,
          passDate: g.updatedAt,
          contribution: g.grade * g.subject.credits,
        }));

        const regularGrades = formattedGrades.filter(
          (g: any) => g.attemptNumber === 1,
        );

        const latestGradesMap = new Map();
        formattedGrades.forEach((g: any) => {
          const existing = latestGradesMap.get(g.subject);
          if (!existing || g.attemptNumber > existing.attemptNumber) {
            latestGradesMap.set(g.subject, g);
          }
        });
        const hasRemedial = formattedGrades.some(
          (g: any) => g.isRemedial || g.attemptNumber > 1,
        );
        const remedialGrades = hasRemedial
          ? Array.from(latestGradesMap.values())
          : [];
        const gradeCounts: { [key: string]: number } = {};
        formattedGrades.forEach((g: any) => {
          gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1;
        });

        // Prepare data for pie chart
        const pieChart = {
          labels: Object.keys(gradeCounts),
          data: Object.values(gradeCounts),
        };

        const barChart = formattedGrades.map((g: any) => ({
          subject: g.subject,
          points: g.points,
        }));

        const transformedData = {
          success: true,
          year: selectedYear,
          semester: selectedSemester,
          gpa: extractedGPA,
          cgpa: data.cgpa,
          totalBacklogs: data.totalBacklogs || 0,
          regular: regularGrades,
          remedial: remedialGrades,
          calculation_details: formattedGrades,
          visualization_data: { pieChart, barChart },
          motivational_messages: data.motivation || null,
        };

        setGrades(transformedData);
        setResultsFetched(true);
        writeAcademicCache(
          "grades",
          userUsername!,
          selectedYear,
          mappedSemester,
          transformedData,
        );

        // Auto-scroll to results table (only for manual fetches)
        if (!silent) {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }

      } else {
        setError(data.msg || "No results found for this selection.");
        setGrades(null);
      }
    } catch (err: any) {
      console.error("Fetch grades error:", err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  // Skeleton Loader Component
  if (authLoading) {
    return (
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
        <Skeleton className="mt-4 h-11 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  type GradeRow = {
    id: string;
    subject: string;
    credits: number;
    grade: string;
    points: number;
    attemptNumber?: number;
  };

  const gradeColumns: TableColumn<GradeRow>[] = [
    {
      id: "subject",
      header: "Subject",
      primary: true,
      cell: (row) => (
        <span className="font-medium text-head">
          {row.subject}
          {row.attemptNumber && row.attemptNumber > 1 ? (
            <Badge tone="neutral" className="ml-2">
              Remedial
            </Badge>
          ) : null}
          <span className="mt-0.5 block text-small font-normal text-text-2 sm:hidden">
            {Number(row.credits).toFixed(1)} credits
          </span>
        </span>
      ),
    },
    {
      id: "credits",
      header: "Credits",
      numeric: true,
      cell: (row) => Number(row.credits).toFixed(1),
    },
    {
      id: "grade",
      header: "Grade",
      numeric: true,
      meta: true,
      cell: (row) => row.grade,
    },
    {
      id: "status",
      header: "Status",
      meta: true,
      cell: (row) =>
        row.grade === "R" ? (
          <Badge tone="error">Fail</Badge>
        ) : (
          <Badge tone="success">Pass</Badge>
        ),
    },
  ];

  const toRows = (items: any[] | undefined, prefix: string): GradeRow[] =>
    (items || []).map((item, index) => ({
      id: `${prefix}-${index}`,
      subject: item.subject,
      credits: item.credits,
      grade: item.grade,
      points: item.points,
      attemptNumber: item.attemptNumber,
    }));

  const formatGpa = (value: unknown) =>
    value !== null && value !== undefined ? Number(value).toFixed(2) : "N/A";

  return (
    <div>
      <PageHeader
        title="Results"
        meta="Semester grades, SGPA, and CGPA."
        action={
          <Button
            variant={userUsername ? "primary" : "outline"}
            onClick={() => handleFetchResults()}
            isLoading={isLoading}
            disabled={isLoading || !userUsername}
          >
            {isLoading ? "Fetching…" : "Get results"}
          </Button>
        }
      />
      {/* Selection Criteria */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={portalLabelClass} htmlFor="results-year">
            Academic Year
          </label>
          <select
            id="results-year"
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(event.target.value);
              setResultsFetched(false);
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
          <label className={portalLabelClass} htmlFor="results-semester">
            Semester
          </label>
          <select
            id="results-semester"
            value={selectedSemester}
            onChange={(event) => {
              setSelectedSemester(event.target.value);
              setResultsFetched(false);
            }}
            className={portalSelectClass}
          >
            {semesterOptions.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Loading State in Display Section */}
      {isLoading && !grades ? (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Results unavailable" body={error} />
      ) : !userUsername && !resultsFetched ? (
        /* Not Logged In State - only show AFTER /me has resolved */
        <EmptyState
          title="Sign in to view results"
          body="Sign in with your university ID to see semester grades."
        />
      ) : !resultsFetched || !grades ? (
        /* Empty State - only show after /me has resolved */
        <EmptyState
          title="Choose a semester"
          body='Select an academic year and semester above, then click "Get Results" to see your grades.'
        />
      ) : !grades.calculation_details || grades.calculation_details.length === 0 ? (
        <EmptyState
          title="No Results Available"
          body="Calculated records for this semester are not yet finalized. Please check back later or contact your department."
        />
      ) : (
        /* Results Section */
        <div ref={resultsRef} className="space-y-8">
          {/* GPA Display - Centered below table */}
          <div className="grid gap-4 sm:grid-cols-2 min-[1100px]:grid-cols-4">
            {/* SGPA Section */}
            <StatTile label="SGPA" value={formatGpa(grades.gpa)} />
            {/* CGPA Section */}
            <StatTile label="CGPA" value={formatGpa(grades.cgpa)} />
            {/* Backlogs Section */}
            {grades.totalBacklogs !== undefined && grades.totalBacklogs > 0 ? (
              <StatTile
                label="Active Backlogs"
                value={grades.totalBacklogs}
                status="error"
                icon={AlertCircle}
                line="Not passed"
              />
            ) : null}
          </div>
          {/* Results Header */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-8">
            <h2 className="font-serif text-2xl font-normal leading-8 text-head">
              {grades.year} / {grades.semester}
            </h2>
            {grades.calculation_details?.length > 0 ? (
              <Button
                variant="outline"
                size="compact"
                onClick={async () => {
                  const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
                  const semId = `${selectedYear}-${mappedSemester}`;
                  await downloadFile(
                    DOWNLOAD_GRADES(semId),
                    `Full_Grades_${userUsername}_${semId}.pdf`,
                    { studentId: userUsername, reportType: "REGULAR" },
                  );
                }}
              >
                <Download size={16} aria-hidden />
                Download PDF
              </Button>
            ) : null}
          </div>
          {/* Regular Section */}
          {grades.regular?.length > 0 ? (
            <section className="space-y-3 border-t border-border pt-8">
              <h2 className="font-serif text-2xl font-normal leading-8 text-head">
                Regular results
              </h2>
              <Table
                columns={gradeColumns}
                rows={toRows(grades.regular, "regular")}
                getRowId={(row) => row.id}
              />
            </section>
          ) : null}
          {/* Remedial Section */}
          {grades.remedial?.length > 0 ? (
            <section className="space-y-3 border-t border-border pt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-serif text-2xl font-normal leading-8 text-head">
                  Remedial results
                </h2>
                <Button
                  variant="outline"
                  size="compact"
                  onClick={async () => {
                    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
                    const semId = `${selectedYear}-${mappedSemester}`;
                    await downloadFile(
                      DOWNLOAD_GRADES(semId),
                      `Remedial_Grades_${userUsername}_${semId}.pdf`,
                      { studentId: userUsername, reportType: "REMEDIAL" },
                    );
                  }}
                >
                  <Download size={16} aria-hidden />
                  Output Remedial PDF
                </Button>
              </div>
              <Table
                columns={gradeColumns}
                rows={toRows(grades.remedial, "remedial")}
                getRowId={(row) => row.id}
              />
            </section>
          ) : null}
          {/* Function to cycle through motivational messages */}
          {grades.motivational_messages ? (
            <p className="text-body text-text-2">"{grades.motivational_messages}"</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
