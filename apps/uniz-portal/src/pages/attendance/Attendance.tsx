import { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { student, studentAuthLoading } from "../../store";
import {
  ChevronDown,
  CalendarCheck,
  AlertCircle,
  Download,
  CheckCircle2,
} from "lucide-react";
import { GET_ATTENDANCE, DOWNLOAD_ATTENDANCE } from "../../api/endpoints";
import { apiClient, downloadFile } from "../../api/apiClient";
import { writeAcademicCache, readAcademicCache, isCacheStale } from "../../utils/academicCache";

interface AttendanceRecord {
  subject: string | { name: string;[key: string]: any };
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

// Pikachu image URL (same as GradeHub)
const PIKACHU_IMAGE = "https://img.pokemondb.net/artwork/large/pikachu.jpg";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("g your attendance!");
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
    const cached = readAcademicCache<AttendanceResponse>("attendance", userUsername, selectedYear, mappedSemester, true);
    if (cached) {
      setAttendanceData(cached);
      setResultsFetched(true);
      setFromCache(true);
      // Background refresh only if stale AND not already in-flight
      if (isCacheStale("attendance", userUsername, selectedYear, mappedSemester) && !isFetchingRef.current) {
        handleFetchAttendance(true);
      }
    } else {
      setAttendanceData(null);
      setResultsFetched(false);
      setFromCache(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, userUsername]);

  // Handle dynamic loading message
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingMessage("g your attendance!");
      timer = setTimeout(() => {
        setLoadingMessage("Pikachu is asking Sreecharan for details...");
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

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
        }
      });

      if (data && data.success) {
        setAttendanceData(data);
        setResultsFetched(true);
        setFromCache(false);
        writeAcademicCache("attendance", userUsername!, selectedYear, mappedSemester, data);

        // Auto-scroll only on manual fetches
        if (!silent) {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  if (authLoading) {
    return (
      <div className="font-sans text-slate-900">
        <div className="max-w-6xl mx-auto px-4 pb-10">
          <div className="flex flex-col gap-1.5 mb-8 animate-pulse">
            <div className="h-4 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-7 w-64 bg-slate-200 rounded" />
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-pulse">
            <div className="h-5 w-48 bg-slate-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="h-12 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex flex-col gap-1.5 mb-8">
          <p className="text-slate-500 font-medium text-[13px]">
            Institutional Attendance Terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Attendance Tracking
          </h1>
        </div>
        {/* Selection Criteria */}
        <div className="mb-8 md:bg-white p-6 md:rounded-xl md:border md:border-slate-100 md:shadow-sm bg-transparent transition-all duration-300 px-0 md:px-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                Academic Year
              </label>
              <div
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-navy-900 transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="font-bold text-sm">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showDropdown ? "rotate-180" : ""} group-hover:text-navy-900`}
                />
              </div>

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`p-3 cursor-pointer text-sm font-semibold hover:bg-slate-50 transition-colors ${selectedYear === year
                        ? "bg-navy-900 text-white"
                        : "text-slate-600"
                        }`}
                      onClick={() => {
                        setSelectedYear(year);
                        setSelectedSemester(
                          semesterOptions.filter((opt) => opt.year === year)[0]
                            .name,
                        );
                        setShowDropdown(false);
                        setResultsFetched(false);
                        setAttendanceData(null);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                Semester
              </label>
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setResultsFetched(false);
                    setAttendanceData(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-sm appearance-none focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-colors cursor-pointer"
                >
                  {availableSemesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                  size={16}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1">

              <div className="md:w-56">
                <button
                  onClick={() => handleFetchAttendance(false)}
                  className="w-full h-[46px] bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm flex items-center justify-center disabled:opacity-50"
                  disabled={isLoading || !user?.username}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1.5 text-sm uppercase tracking-widest">
                      Syncing...
                    </span>
                  ) : fromCache ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Refresh
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">Get Attendance</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-8 bg-navy-900 text-white rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-navy-100">
              <AlertCircle size={20} className="text-white flex-shrink-0" />
              <div className="font-medium">{error}</div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-10 text-center animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/50 rounded-full flex items-center justify-center">
              <img
                src={PIKACHU_IMAGE}
                alt="Pikachu"
                className="w-12 h-12 object-contain grayscale opacity-30"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-600 mb-1">
              Terminal Synchronization
            </h3>
            <p className="text-slate-400 text-xs font-medium">
              {loadingMessage}
            </p>
          </div>
        )}

        {/* Results Section */}
        {resultsFetched &&
          attendanceData &&
          attendanceData.success &&
          !isLoading && (
            <div ref={resultsRef} className="-mx-4 md:mx-0 space-y-0 animate-in fade-in slide-in-from-bottom-8 duration-500 scroll-mt-4 bg-white md:bg-transparent md:space-y-4 rounded-none md:rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-end justify-between border-b pb-4 border-slate-100 px-4 md:px-0 pt-5 md:pt-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Matrix Snapshot
                  </span>
                  <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
                    {selectedYear}{" "}
                    <span className="text-slate-300 mx-1">/</span>{" "}
                    {selectedSemester}
                  </h2>
                </div>
                <button
                  onClick={async () => {
                    const mappedSemester = selectedSemester.replace(
                      "Sem - ",
                      "SEM-",
                    );
                    const semId = `${selectedYear}-${mappedSemester}`;
                    await downloadFile(
                      DOWNLOAD_ATTENDANCE(semId),
                      `Attendance_${user.username}_${semId}.pdf`,
                      { 
                        studentId: user.username,
                      },
                    );
                  }}
                  className="h-10 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border border-slate-100 disabled:opacity-50"
                  disabled={false}
                >
                  <Download size={14} />
                  Export PDF
                </button>
              </div>

              {/* Content */}
              {!attendanceData.attendance ||
                !Array.isArray(attendanceData.attendance) ||
                attendanceData.attendance.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                    <AlertCircle size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Attendance Not Available
                  </h3>
                  <p className="text-slate-500 font-medium">
                    These details are not yet updated, please check back
                    shortly...
                  </p>
                </div>
              ) : (
                <div className="md:bg-white md:rounded-xl overflow-hidden md:border md:border-slate-100 md:shadow-sm bg-transparent">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 md:bg-slate-50/50 bg-transparent">
                          <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Subject
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Total Classes
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Attended
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.isArray(attendanceData.attendance) &&
                          attendanceData.attendance.map(
                            (record: any, index: number) => (
                              <tr
                                key={index}
                                className="group hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-4 py-2 font-bold text-xs text-slate-900">
                                  {typeof record.subject === "string"
                                    ? record.subject
                                    : record.subject?.name || "Unknown Subject"}
                                </td>
                                <td className="px-4 py-2 text-center text-slate-600 font-medium text-xs">
                                  {record.totalClasses}
                                </td>
                                <td className="px-4 py-2 text-center text-slate-600 font-medium text-xs">
                                  {record.attendedClasses}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${parseFloat(String(record.percentage)) >=
                                      75
                                      ? "bg-navy-900 text-white"
                                      : parseFloat(
                                        String(record.percentage),
                                      ) >= 65
                                        ? "bg-slate-200 text-slate-700"
                                        : "bg-slate-100 text-slate-400"
                                      }`}
                                  >
                                    {record.percentage}%
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-8 md:bg-navy-900 text-white md:mt-0 shadow-inner bg-transparent mt-4 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-slate-800 md:text-white">
                          Aggregate Attendance
                        </h3>
                      </div>
                      {/* Summary calculation if available, or just a placeholder */}
                      <div className="flex items-center gap-6">
                        <div className="text-right flex items-center gap-3">
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            Semester Avg :
                          </p>
                          <p className="text-3xl font-semibold text-slate-900 md:text-white tracking-tighter">
                            {(
                              attendanceData.attendance.reduce(
                                (acc, curr: any) =>
                                  acc +
                                  (parseFloat(curr?.percentage || "0") || 0),
                                0,
                              ) / (attendanceData.attendance.length || 1)
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Not Logged In State — only show AFTER /me has resolved */}
        {!authLoading && !user?.username && !isLoading && !resultsFetched && (
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-12 text-center">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50">
              <AlertCircle size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800">
              Authorization Required
            </h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto text-xs font-medium leading-relaxed">
              Please authenticate to access your institutional attendance
              terminal.
            </p>
            <button className="h-[46px] px-8 bg-navy-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-navy-800 active:scale-[0.98]">
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Empty State — only show after /me resolved and user is known */}
        {!authLoading &&
          user?.username &&
          !isLoading &&
          !resultsFetched &&
          !error && (
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-12 text-center">
              <div className="md:bg-white w-16 h-16 md:rounded-2xl flex items-center justify-center mx-auto mb-6 md:shadow-sm md:border md:border-slate-50 bg-transparent">
                <CalendarCheck size={32} className="text-slate-300" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-slate-800">
                No Snapshot Selected
              </h3>
              <p className="text-slate-500 mb-6 max-w-xs mx-auto font-medium text-xs leading-relaxed">
                Specify an academic year and semester to generate your
                attendance matrix.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
