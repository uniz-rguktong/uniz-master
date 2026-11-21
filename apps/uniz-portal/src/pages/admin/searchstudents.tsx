import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useDebounce } from "../../hooks/useDebounce";
import {
  ArrowLeft,
  Search,
  User,
  AlertCircle,
  MapPin,
  Filter,
  BookOpen,
  History,
  Info,
  ChevronRight,
  GraduationCap,
  Download,
} from "lucide-react";
import {
  SEARCH_STUDENTS,
  ADMIN_STUDENT_HISTORY,
  DOWNLOAD_GRADES,
  DOWNLOAD_ATTENDANCE,
} from "../../api/endpoints";
import { apiClient, downloadFile } from "../../api/apiClient";
import { Input } from "../../components/Input";
import { Pagination } from "../../components/Pagination";
import { cn } from "../../utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import { adminPageWrapClass, adminSelectClass } from "../../components/admin/admin-ui";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

interface StudentProps {
  id: string;
  _id: string;
  username: string;
  name: string;
  email: string;
  gender: string;
  branch: string;
  year: string;
  section?: string;
  roomno?: string;
  blood_group?: string;
  phone_number?: string;
  profile_url?: string;
  isPresentInCampus: boolean;
  isApplicationPending: boolean;
  is_suspended: boolean;
  father_name: string;
  father_phonenumber: string;
  mother_name: string;
  address: string;
  grades?: any[];
  attendance?: any[];
  outings_list?: any[];
  outpasses_list?: any[];
  approval_logs?: any[];
  current_level?: string;
  created_at?: string;
  updated_at?: string;
}

const Detail = ({ label, value }: { label: string; value?: any }) => (
  <div className="group">
    <label className="text-caption font-semibold text-text-3 mb-1 block group-hover:text-text-2 transition-colors">
      {label}
    </label>
    <p className="text-sm font-semibold text-text">{value || "-"}</p>
  </div>
);

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
    <div className="px-6 py-4 border-b border-border bg-surface-2/50 flex items-center gap-3">
      <div className="p-2 bg-surface rounded-lg shadow-sm">
        <Icon className="w-4 h-4 text-text-2" />
      </div>
      <h3 className="font-semibold text-text text-sm">{title}</h3>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  </div>
);

export default function SearchStudents() {
  useIsAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<StudentProps[]>([]);
  const [results, setResults] = useState<StudentProps[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [selectedStudent, setSelectedStudent] = useState<StudentProps | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [isPending, setIsPending] = useState<boolean | undefined>(undefined);
  const [isOutside, setIsOutside] = useState<boolean | undefined>(undefined);
  const [isSuspended, setIsSuspended] = useState<boolean | undefined>(
    undefined,
  );

  // Paginated History State
  const [history, setHistory] = useState<any[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  const fetchStudents = async (q: string, page = 1) => {
    try {
      setIsLoading(page === 1);
      setError("");

      const data = await apiClient<any>(SEARCH_STUDENTS, {
        method: "POST",
        body: JSON.stringify({
          username: q,
          branch: branch || undefined,
          year: year || undefined,
          gender: gender || undefined,
          isPending,
          isOutside,
          isSuspended,
          page,
          limit: 10,
        }),
      });

      if (!data || !data.success) {
        if (page === 1) {
          setResults([]);
          setSuggestions([]);
        }
        return;
      }

      if (data.students) {
        setResults(data.students);
        setPagination(data.pagination);
        setSuggestions([]);
      } else {
        setSuggestions(data.suggestions || []);
        if (data.student) {
          setSelectedStudent(data.student);
          setSuggestions([]);
          setResults([]);
        }
      }
    } catch (err) {
      setError("Failed to fetch students");
      console.error("fetchStudents error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(debouncedQuery, 1);
  }, [debouncedQuery, branch, year, gender, isPending, isOutside, isSuspended]);

  const fetchHistory = async (studentId: string, page = 1) => {
    try {
      setIsHistoryLoading(true);
      const data = await apiClient<any>(
        `${ADMIN_STUDENT_HISTORY(studentId)}?page=${page}&limit=5`,
        { method: "GET" },
      );
      if (data && data.success) {
        setHistory(data.history);
        setHistoryPagination(data.pagination);
      }
    } catch (err) {
      console.error("fetchHistory error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchHistory(selectedStudent.id || selectedStudent._id, 1);
    }
  }, [selectedStudent]);

  const handleSelectStudent = (student: StudentProps) => {
    setSelectedStudent(student);
    setResults([]);
    setSuggestions([]);
    setQuery("");
  };

  const getAcademicStatus = () => {
    if (!selectedStudent || !selectedStudent.grades) return null;
    const gpas = selectedStudent.grades.map((g) => g.grade);
    const hasFail = gpas.some((g) => g < 5);
    const avg = gpas.length
      ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)
      : "0.00";

    return {
      avg,
      status: hasFail
        ? "Remedial"
        : Number(avg) >= 8.5
          ? "Excellent"
          : Number(avg) >= 7
            ? "Pass"
            : "Good",
      tone: (hasFail ? "error" : Number(avg) >= 7 ? "success" : "neutral") as "error" | "success" | "neutral",
    };
  };

  return (
    <div className={cn(adminPageWrapClass, "pb-16")}>
      {/* Header & Search */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="compact" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Button>
          <div className="flex items-center gap-2">
            {selectedStudent && (
              <Button variant="outline" size="compact" onClick={() => setSelectedStudent(null)}>
                Close Profile
              </Button>
            )}
            <Button variant="outline" size="compact" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" /> Filters
            </Button>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <PageHeader
              className="mb-0"
              title="Search Directory"
              meta="Find students, view academic performance and request history."
            />
            <div className="w-full md:w-[400px] relative">
              <Input
                placeholder="Search by ID or Name..."
                value={query}
                onchangeFunction={(e: any) => setQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-text-3" />}
                className="bg-surface"
              />

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-lg border border-border/80 z-50 overflow-hidden divide-y divide-border"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-2 transition-[color,background-color,border-color,opacity,transform,box-shadow] group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center text-text-2 font-semibold overflow-hidden ring-2 ring-border">
                            {s.profile_url ? (
                              <img
                                src={s.profile_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              s.name[0]
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-text group-hover:text-text transition-colors">
                              {s.name}
                            </p>
                            <p className="text-caption font-semibold text-text-3">
                              {s.username} • {s.branch} {s.year}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-text group-hover:translate-x-1 transition-[color,background-color,border-color,opacity,transform,box-shadow]" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-border grid grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="text-caption font-semibold text-text-3 px-1">
                      Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className={adminSelectClass}
                    >
                      <option value="">All Branches</option>
                      {["CSE", "ECE", "EEE", "CIVIL", "MECH"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-caption font-semibold text-text-3 px-1">
                      Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={adminSelectClass}
                    >
                      <option value="">All Years</option>
                      {["E1", "E2", "E3", "E4"].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-caption font-semibold text-text-3 px-1">
                      Type Filter
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setIsPending(isPending === true ? undefined : true)
                        }
                        className={cn(
                          "flex-1 h-11 rounded-xl text-caption font-semibold border shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow]",
                          isPending
                            ? "bg-primary border-head text-primary-foreground shadow-sm"
                            : "bg-surface border-border text-text-2",
                        )}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() =>
                          setIsOutside(isOutside === true ? undefined : true)
                        }
                        className={cn(
                          "flex-1 h-11 rounded-xl text-caption font-semibold border shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow]",
                          isOutside
                            ? "bg-primary border-head text-primary-foreground"
                            : "bg-surface border-border text-text-2",
                        )}
                      >
                        Outside
                      </button>
                      <button
                        onClick={() =>
                          setIsSuspended(
                            isSuspended === true ? undefined : true,
                          )
                        }
                        className={cn(
                          "flex-1 h-11 rounded-xl text-caption font-semibold border shadow-sm transition-[color,background-color,border-color,opacity,transform,box-shadow]",
                          isSuspended
                            ? "bg-error border-error text-on-error"
                            : "bg-surface border-border text-text-2",
                        )}
                      >
                        Suspended
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end lg:col-span-2">
                    <button
                      onClick={() => {
                        setBranch("");
                        setYear("");
                        setGender("");
                        setIsPending(undefined);
                        setIsOutside(undefined);
                        setIsSuspended(undefined);
                        setQuery("");
                      }}
                      className="w-full h-11 text-caption font-semibold text-text-3 hover:text-text transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                    >
                      Reset All Application Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] border border-error rounded-lg flex items-center gap-3 text-error shadow-sm"
        >
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">{error}</p>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-border border-t-head rounded-full animate-spin" />
            <p className="text-text-3 font-semibold text-sm animate-pulse">
              Scanning database...
            </p>
          </div>
        ) : results.length > 0 ? (
          <Table
            rows={results}
            getRowId={(student) => String(student.id || student.username)}
            onRowClick={(student) => handleSelectStudent(student)}
            footer={
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchStudents(query, p)}
              />
            }
            columns={[
              {
                id: "name",
                header: "Name",
                primary: true,
                cell: (student) => student.name,
              },
              {
                id: "username",
                header: "Student ID",
                meta: true,
                cell: (student) => student.username,
              },
              {
                id: "branch",
                header: "Branch",
                meta: true,
                cell: (student) => student.branch,
              },
              {
                id: "year",
                header: "Year",
                cell: (student) => student.year,
              },
              {
                id: "status",
                header: "Status",
                cell: (student) =>
                  student.is_suspended ? (
                    <Badge tone="error">Suspended</Badge>
                  ) : student.isApplicationPending ? (
                    <Badge tone="warning">Pending</Badge>
                  ) : (
                    <Badge tone="success">Active</Badge>
                  ),
              },
            ]}
          />
        ) : selectedStudent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Student Header Card */}
            <div className="bg-surface rounded-lg p-8 md:p-12 relative overflow-hidden border border-border-strong border border-border/80 transition-[color,background-color,border-color,opacity,transform,box-shadow]">
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-surface rounded-lg p-1 border border-border/60 ring-4 ring-black/5 group overflow-hidden">
                      {selectedStudent.profile_url ? (
                        <img
                          src={selectedStudent.profile_url}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-2 flex items-center justify-center text-text text-4xl font-semibold rounded-xl">
                          {selectedStudent.name[0]}
                        </div>
                      )}
                    </div>
                    <Badge
                      tone={
                        selectedStudent.is_suspended
                          ? "error"
                          : selectedStudent.isApplicationPending
                            ? "warning"
                            : "success"
                      }
                      className="absolute -bottom-2 -right-2"
                    >
                      {selectedStudent.is_suspended
                        ? "Account Suspended"
                        : selectedStudent.isApplicationPending
                          ? "Action Required"
                          : "Identity Verified"}
                    </Badge>
                  </div>

                  <div className="text-center md:text-left space-y-4">
                    <div>
                      <h2 className="text-4xl font-semibold text-text tracking-tighter">
                        {selectedStudent.name}
                      </h2>
                      <p className="text-text-3 font-semibold text-caption mt-2">
                        {selectedStudent.username} • {selectedStudent.branch}{" "}
                        {selectedStudent.year}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <span className="px-4 py-2 bg-surface-2 rounded-xl text-text text-caption font-semibold border border-border flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> ROOM{" "}
                        {selectedStudent.roomno || "N/A"}
                      </span>
                      {getAcademicStatus() && (
                        <Badge tone={getAcademicStatus()?.tone}>
                          GPA: {getAcademicStatus()?.avg} ({getAcademicStatus()?.status})
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Integrated QR Code */}
                <div className="p-4 bg-surface-2 rounded-xl border-2 border-dashed border-border-strong">
                  <QRCode
                    value={JSON.stringify({
                      id: selectedStudent.id,
                      name: selectedStudent.name,
                      branch: selectedStudent.branch,
                      year: selectedStudent.year,
                      parent: selectedStudent.father_name,
                      contact: selectedStudent.phone_number,
                    })}
                    size={120}
                    fgColor="var(--text)"
                  />
                  <p className="text-caption text-center font-semibold text-text-3 mt-2">
                    Scan Identity
                  </p>
                </div>
              </div>
            </div>

            {/* Single Page Content - All sections stacked */}
            <div className="space-y-12">
              {/* Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Section icon={Info} title="Personal Details">
                  <Detail label="Gender" value={selectedStudent.gender} />
                  <Detail
                    label="Blood Group"
                    value={selectedStudent.blood_group}
                  />
                  <Detail
                    label="Contact"
                    value={selectedStudent.phone_number}
                  />
                  <Detail label="Section" value={selectedStudent.section} />
                  <Detail
                    label="Created"
                    value={new Date(
                      selectedStudent.created_at || "",
                    ).toLocaleDateString()}
                  />
                </Section>
                <Section icon={User} title="Parent Information">
                  <Detail
                    label="Father's Name"
                    value={selectedStudent.father_name}
                  />
                  <Detail
                    label="Father's Phone"
                    value={selectedStudent.father_phonenumber}
                  />
                  <Detail
                    label="Mother's Name"
                    value={selectedStudent.mother_name}
                  />
                  <Detail
                    label="Resident Address"
                    value={selectedStudent.address}
                  />
                </Section>
              </div>

              {/* Academics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Section icon={GraduationCap} title="Grade Records">
                  {selectedStudent.grades?.length ? (
                    selectedStudent.grades.map((g, i) => (
                      <div
                        key={i}
                        className="p-4 bg-surface-2 rounded-lg flex justify-between items-center group hover:bg-surface border border-transparent hover:border-border transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {g.subject}
                          </p>
                          <p className="text-caption font-semibold text-text-3">
                            {g.semester}
                          </p>
                        </div>
                        <Badge tone={g.grade < 5 ? "error" : "neutral"}>{g.grade}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-3 font-semibold py-4">
                      No academic records found
                    </p>
                  )}
                </Section>
                <Section icon={BookOpen} title="Attendance Metrics">
                  {selectedStudent.attendance?.length ? (
                    selectedStudent.attendance.map((a, i) => (
                      <div
                        key={i}
                        className="p-4 bg-surface-2 rounded-lg space-y-2 border border-transparent hover:border-border hover:bg-surface transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-text">
                            {a.subject}
                          </p>
                          <span className="text-text font-semibold text-caption">
                            {(
                              (a.attendedClasses / a.totalClasses) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-tint rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(a.attendedClasses / a.totalClasses) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-caption font-semibold text-text-3">
                          {a.attendedClasses} / {a.totalClasses} Lectures
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-3 font-semibold py-4">
                      No attendance records found
                    </p>
                  )}
                </Section>
              </div>

              {/* Academic Reports Download Section */}
              <Section icon={Download} title="Official Reports (PDF)">
                {(() => {
                  const uniqueSemesters = Array.from(
                    new Set([
                      ...(selectedStudent.grades?.map((g) => g.semester) || []),
                      ...(selectedStudent.attendance?.map(
                        (a) => a.semesterId,
                      ) || []),
                    ]),
                  ).filter(Boolean);

                  if (uniqueSemesters.length === 0) {
                    return (
                      <p className="text-text-3 font-semibold py-2 col-span-full">
                        No report data generated yet.
                      </p>
                    );
                  }

                  return uniqueSemesters
                    .sort()
                    .reverse()
                    .map((sem: any) => (
                      <div
                        key={sem}
                        className="p-4 bg-primary border border-head rounded-lg flex flex-col gap-3 shadow-none"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-primary-foreground font-semibold text-sm tracking-tighter">
                            {sem} Report
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              downloadFile(
                                DOWNLOAD_GRADES(sem),
                                `Grades_${selectedStudent.username}_${sem}.pdf`,
                                { studentId: selectedStudent.username },
                              )
                            }
                            className="flex-1 bg-surface text-text py-2 rounded-xl font-semibold text-caption flex items-center justify-center gap-1.5 hover:bg-surface-2 transition-[color,background-color,border-color,opacity,transform,box-shadow]"
                          >
                            <GraduationCap size={12} /> Grade
                          </button>
                          <button
                            onClick={() =>
                              downloadFile(
                                DOWNLOAD_ATTENDANCE(sem),
                                `Attendance_${selectedStudent.username}_${sem}.pdf`,
                                { studentId: selectedStudent.username },
                              )
                            }
                            className="flex-1 bg-tint text-text py-2 rounded-xl font-semibold text-caption flex items-center justify-center gap-1.5 hover:bg-tint transition-[color,background-color,border-color,opacity,transform,box-shadow] border border-border"
                          >
                            <BookOpen size={12} /> Attendance
                          </button>
                        </div>
                      </div>
                    ));
                })()}
              </Section>

              {/* History Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                  <History className="w-5 h-5 text-text" />
                  <h3 className="font-semibold text-text text-lg">
                    Request History
                  </h3>
                </div>

                {isHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-3 border-border border-t-black rounded-full animate-spin" />
                    <p className="text-text-3 font-semibold text-caption">
                      Compiling history...
                    </p>
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {history.map((req, i) => (
                        <div
                          key={i}
                          className="bg-surface p-6 rounded-lg border-2 border-border shadow-sm hover:border-border-strong transition-[color,background-color,border-color,opacity,transform,box-shadow] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group"
                        >
                          <div className="flex items-center gap-6">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center shadow-none transform transition-transform",
                                req.is_approved
                                  ? "bg-primary text-primary-foreground"
                                  : req.is_rejected
                                    ? "bg-text-3 text-primary-foreground"
                                    : "bg-surface border border-border-strong text-text",
                              )}
                            >
                              <History className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="text-caption font-semibold text-text-3">
                                  {req.type}
                                </span>
                                <Badge
                                  tone={
                                    req.is_approved
                                      ? "success"
                                      : req.is_rejected
                                        ? "error"
                                        : "warning"
                                  }
                                >
                                  {req.is_approved
                                    ? "Granted"
                                    : req.is_rejected
                                      ? "Rejected"
                                      : "Pending"}
                                </Badge>
                              </div>
                              <p className="font-semibold text-text text-lg">
                                "{req.reason}"
                              </p>
                              <p className="text-caption font-semibold text-text-3 mt-1">
                                {new Date(req.requested_time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="w-full md:w-auto p-4 bg-surface-2 rounded-lg border border-border flex flex-col items-end gap-1">
                            <p className="text-caption font-semibold text-text-3">
                              Gateway Status
                            </p>
                            <p className="text-sm font-semibold text-text tracking-tighter">
                              {req.current_level?.replace("_", " ") ||
                                "Finalized"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Pagination
                      currentPage={historyPagination.page}
                      totalPages={historyPagination.totalPages}
                      onPageChange={(p) =>
                        fetchHistory(
                          selectedStudent?.id || selectedStudent?._id || "",
                          p,
                        )
                      }
                      className="mt-8"
                    />
                  </div>
                ) : (
                  <EmptyState
                    title="No Request History"
                    body="Empty historical record for this student identifier."
                    icon={History}
                  />
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <EmptyState
            title="Ready to search"
            body="Use the search bar above to look up specific students or use the filters for advanced discovery."
            icon={Search}
          />
        )}
      </div>
    </div>
  );
}
