import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import axios from "axios";
import { student } from "../../store";
import {
  ChevronDown,
  Award,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import { GET_ATTENDANCE, DOWNLOAD_ATTENDANCE } from "../../api/endpoints";
import { downloadFile } from "../../api/apiClient";

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

// Pikachu image URL (same as GradeHub)
const PIKACHU_IMAGE = "https://img.pokemondb.net/artwork/large/pikachu.jpg";

export default function Attendance() {
  const user = useRecoilValue(student);
  const [selectedYear, setSelectedYear] = useState("E1");
  const [selectedSemester, setSelectedSemester] = useState("Sem - 1");
  const [attendanceData, setAttendanceData] =
    useState<AttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsFetched, setResultsFetched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("g your attendance!");

  // Get available semesters for the selected year
  const availableSemesters = semesterOptions
    .filter((opt) => opt.year === selectedYear)
    .map((opt) => opt.name)
    .sort();

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
  const handleFetchAttendance = async () => {
    if (!user?.username) {
      setError("Please sign in to view attendance");
      return;
    }

    if (!selectedYear || !selectedSemester) {
      setError("Please select both a year and a semester");
      return;
    }

    setIsLoading(true);
    setError("");
    setAttendanceData(null);

    try {
      const token = localStorage
        .getItem("student_token")
        ?.replace(/^"|"$/g, "");

      // Map "Sem - 1" -> "SEM-1" for API consistency
      const mappedSemester = selectedSemester.replace("Sem - ", "SEM-");

      // Fetch attendance with mapped parameters: studentId, year, semester
      const response = await axios.get<AttendanceResponse>(GET_ATTENDANCE, {
        params: {
          studentId: user.username,
          year: selectedYear,
          semester: mappedSemester,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setAttendanceData(response.data);
        setResultsFetched(true);
      } else {
        setError(response.data.msg || "Failed to fetch attendance");
        setAttendanceData(null);
      }
    } catch (err) {
      setError("An error occurred while fetching attendance");
      setAttendanceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton Loader Component
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl font-black tracking-tighter text-black mb-2">
          Attendance
        </h1>
        <p className="text-neutral-500 font-medium text-sm">
          Track your daily attendance and semester progress.
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Selection Criteria */}
        <div className="mb-8 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-md text-white">
              <CheckCircle size={16} />
            </div>
            Select Criteria
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block ml-0.5">
                Academic Year
              </label>
              <div
                className="w-full flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-lg p-3 cursor-pointer hover:border-black transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="font-bold text-sm">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
                />
              </div>

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`p-3 cursor-pointer text-sm font-medium hover:bg-neutral-50 transition-colors ${
                        selectedYear === year
                          ? "bg-black text-white hover:bg-black"
                          : "text-neutral-600"
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block ml-0.5">
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-bold text-sm appearance-none focus:outline-none focus:border-black transition-colors cursor-pointer"
                >
                  {availableSemesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"
                  size={16}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleFetchAttendance}
                className={`w-full h-[46px] flex items-center justify-center font-bold text-sm rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                  isLoading
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
                disabled={isLoading || !user?.username}
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    View Attendance
                  </span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 bg-black text-white rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-white flex-shrink-0" />
              <div className="font-medium">{error}</div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full p-4 border border-neutral-100 shadow-sm flex items-center justify-center">
              <img
                src={PIKACHU_IMAGE}
                alt="Pikachu"
                className="w-full h-full object-contain animate-bounce"
              />
            </div>
            <h3 className="text-2xl font-black mb-3">
              Pikachu is on the case!
            </h3>
            <p className="text-neutral-500 font-medium">{loadingMessage}</p>
          </div>
        )}

        {/* Results Section */}
        {resultsFetched &&
          attendanceData &&
          attendanceData.success &&
          !isLoading && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
              {/* Header */}
              <div className="flex items-end justify-between border-b pb-2 border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-0.5">
                    Attendance For
                  </span>
                  <h2 className="text-xl font-black tracking-tight">
                    {selectedYear} - {selectedSemester}
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
                      { studentId: user.username },
                    );
                  }}
                  className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-black transition-all shadow-sm hover:shadow-md ml-auto"
                >
                  <Download size={16} />
                  Download Report
                </button>
              </div>

              {/* Content */}
              {!attendanceData.attendance ||
              !Array.isArray(attendanceData.attendance) ||
              attendanceData.attendance.length === 0 ? (
                <div className="bg-neutral-50 rounded-xl p-8 text-center border border-neutral-200">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
                    <AlertCircle size={28} className="text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Attendance Not Available
                  </h3>
                  <p className="text-neutral-500 font-medium">
                    These details are not yet updated, please check back
                    shortly...
                  </p>
                </div>
              ) : (
                <div className="glass-panel rounded-xl overflow-hidden border border-neutral-200 shadow-sm mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50/50">
                          <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Subject
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Total Classes
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Attended
                          </th>
                          <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {Array.isArray(attendanceData.attendance) &&
                          attendanceData.attendance.map(
                            (record: any, index: number) => (
                              <tr
                                key={index}
                                className="group hover:bg-neutral-50 transition-colors"
                              >
                                <td className="px-4 py-2 font-bold text-xs text-neutral-900">
                                  {typeof record.subject === "string"
                                    ? record.subject
                                    : record.subject?.name || "Unknown Subject"}
                                </td>
                                <td className="px-4 py-2 text-center text-neutral-600 font-medium text-xs">
                                  {record.totalClasses}
                                </td>
                                <td className="px-4 py-2 text-center text-neutral-600 font-medium text-xs">
                                  {record.attendedClasses}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      parseFloat(record.percentage) >= 75
                                        ? "bg-black text-white"
                                        : parseFloat(record.percentage) >= 65
                                          ? "bg-neutral-200 text-neutral-700"
                                          : "bg-neutral-100 text-neutral-400"
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

                  <div className="px-6 py-4 bg-neutral-900 text-white mt-0">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="text-lg font-black">
                          Overall Attendance
                        </h3>
                      </div>
                      {/* Summary calculation if available, or just a placeholder */}
                      <div className="flex items-center gap-6">
                        <div className="text-right flex items-center gap-2">
                          <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                            Calculated Avg :
                          </p>
                          <p className="text-2xl font-black text-white">
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

        {/* Not Logged In State */}
        {!user?.username && !isLoading && !resultsFetched && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
              <AlertCircle size={40} className="text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">Sign In Required</h3>
            <p className="text-neutral-500 mb-8 max-w-md mx-auto font-medium">
              Please sign in to your student account to view your attendance
              records.
            </p>
            <button className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Empty State */}
        {user?.username && !isLoading && !resultsFetched && !error && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
              <Award size={40} className="text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">No Attendance Selected</h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto font-medium">
              Select an academic year and semester above, then click "View
              Attendance" to see your complete records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
