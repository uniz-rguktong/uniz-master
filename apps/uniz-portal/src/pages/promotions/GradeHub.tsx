import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "react-toastify";
import { apiClient, downloadFile } from "../../api/apiClient";
import { student } from "../../store";

import { ChevronDown, Award, AlertCircle, Download } from "lucide-react";
import { GET_GRADES, DOWNLOAD_GRADES } from "../../api/endpoints";

// Helper function to truncate long text

// Pikachu image URL (you can replace with a local asset)
const PIKACHU_IMAGE = "/pikachu.png";

export default function GradeHub() {
  const user = useRecoilValue(student);
  // Hardcoded options as per requirements
  const years = ["E1", "E2", "E3", "E4"];
  const semesterOptions = ["Sem 1", "Sem 2"];

  const [selectedYear, setSelectedYear] = useState(user?.year || "E1");
  const [selectedSemester, setSelectedSemester] = useState("Sem 1");

  // Update year when user data loads
  useEffect(() => {
    if (user?.year) setSelectedYear(user.year);
  }, [user]);
  const [grades, setGrades] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultsFetched, setResultsFetched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState(
    "Pikachu is fetching your records!",
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setLoadingMessage("getting your results!");
      timer = setTimeout(() => {
        setLoadingMessage("Pikachu is looking for details...");
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

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
  const handleFetchResults = async () => {
    if (!user?.username) {
      toast.error("Please sign in to view grades");
      return;
    }

    if (!selectedYear || !selectedSemester) {
      toast.error("Please select both a year and a semester");
      return;
    }

    setIsLoading(true);
    setError("");
    setGrades(null);

    // Map "Sem 1" -> "SEM-1" and "Sem 2" -> "SEM-2"
    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";

    try {
      const data = await apiClient<any>(GET_GRADES, {
        method: "GET",
        params: {
          studentId: user.username,
          semester: mappedSemester,
          year: selectedYear,
        },
      });

      // apiClient handles status 404, 401, etc.
      if (!data) {
        setIsLoading(false);
        return;
      }

      if (data.success && data.grades) {
        const semesterKey = `${selectedYear}-${mappedSemester}`;
        const gpaData = data.gpa?.[semesterKey];
        const extractedGPA = gpaData ? gpaData.gpa : null;

        const formattedGrades = data.grades.map((g: any) => ({
          subject: g.subject.name,
          credits: g.subject.credits,
          grade: pointToGrade(g.grade),
          points: g.grade,
          contribution: g.grade * g.subject.credits,
        }));

        // Generate Visualization Data
        const gradeCounts: { [key: string]: number } = {};
        formattedGrades.forEach((g: any) => {
          gradeCounts[g.grade] = (gradeCounts[g.grade] || 0) + 1;
        });

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
          calculation_details: formattedGrades,
          visualization_data: {
            pieChart,
            barChart,
          },
          motivational_messages: data.motivation ? [data.motivation] : [],
        };

        setGrades(transformedData);
        setResultsFetched(true);
      } else {
        setError(data.msg || "No results found for this selection.");
        setGrades(null);
      }
    } catch (err: any) {
      console.error("Fetch grades error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for pie chart

  // Function to cycle through motivational messages

  return (
    <div className="font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-8">
          <p className="text-slate-500 font-medium text-[13px]">
            Academic Performance Terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Results & Transcripts
          </h1>
        </div>

        {/* Selection Criteria */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm shadow-blue-50">
              <Award size={16} />
            </div>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-700">
              Select Recording Criteria
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                Academic Year
              </label>
              <div
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-600 transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="font-bold text-sm">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className="text-slate-400 group-hover:text-blue-600 transition-colors"
                />
              </div>

              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`p-3 cursor-pointer text-sm font-semibold transition-colors ${
                        selectedYear === year
                          ? "bg-slate-950 text-white"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                      onClick={() => {
                        setSelectedYear(year);
                        setShowDropdown(false);
                        setResultsFetched(false);
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
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-sm appearance-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                >
                  {semesterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                Actions
              </label>
              <button
                onClick={handleFetchResults}
                className="w-full h-[46px] bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm"
                disabled={isLoading || !user?.username}
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    Processing...
                  </span>
                ) : (
                  <span>View Records</span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-600 font-medium">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Loading State in Display Section */}
        {isLoading && (
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-10 text-center animate-pulse">
            <img
              src={PIKACHU_IMAGE}
              alt="Pikachu"
              className="w-16 h-16 mx-auto mb-4 opacity-50 contrast-50 grayscale"
            />
            <h3 className="text-base font-semibold text-slate-600 mb-1">
              Synchronizing Terminal Data
            </h3>
            <p className="text-slate-400 text-xs font-medium">
              {loadingMessage}
            </p>
          </div>
        )}

        {/* Results Section */}
        {resultsFetched && grades && grades.success && !isLoading && (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            {/* Results Header */}
            <div className="bg-white border-b border-slate-50 px-6 py-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Transcript For
                </span>
                <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                  {grades.year} <span className="text-slate-300 mx-1">/</span>{" "}
                  {grades.semester}
                </h2>
              </div>
              <button
                onClick={async () => {
                  const mappedSemester =
                    selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
                  const semId = `${selectedYear}-${mappedSemester}`;
                  await downloadFile(
                    DOWNLOAD_GRADES(semId),
                    `Grades_${user.username}_${semId}.pdf`,
                    { studentId: user.username },
                  );
                }}
                className="h-10 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border border-slate-100"
              >
                <Download size={14} />
                Export PDF
              </button>
            </div>

            {/* Content */}
            {grades.gpa === null || grades.gpa === undefined ? (
              <div className="p-12 text-center">
                <AlertCircle
                  size={48}
                  className="mx-auto mb-4 text-slate-300"
                />
                <h3 className="text-xl font-bold mb-2">
                  Results Not Available
                </h3>
                <p className="text-slate-500">
                  These details are not yet updated, please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 space-y-6">
                  {/* Grades Section */}
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-500 rounded-full"></div>{" "}
                      Detailed Grades
                    </h3>
                    <div className="rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-sm table-fixed">
                        <thead>
                          <tr className="bg-blue-50/50 border-b border-slate-200">
                            <th className="px-2 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[55%]">
                              Subjects
                            </th>
                            <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[15%]">
                              Cr
                            </th>
                            <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[15%]">
                              Gr
                            </th>
                            <th className="px-2 py-3 text-center font-bold text-[10px] uppercase tracking-widest text-slate-500 w-[15%]">
                              Pt
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.calculation_details?.map(
                            (item: any, index: any) => (
                              <tr
                                key={index}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0"
                              >
                                <td className="px-2 py-2.5 font-bold text-slate-800 text-xs leading-tight">
                                  {item.subject}
                                </td>
                                <td className="px-2 py-2.5 text-center text-slate-600 font-medium text-xs">
                                  {item.credits}
                                </td>
                                <td className="px-2 py-2.5 text-center">
                                  <span
                                    className={`inline-block w-8 h-6 leading-6 rounded font-bold text-xs ${
                                      item.grade === "Ex"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-800"
                                    }`}
                                  >
                                    {item.grade}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold text-slate-800 text-xs">
                                  {item.points}
                                </td>
                              </tr>
                            ),
                          )}
                          {!grades.calculation_details &&
                            grades.grade_data &&
                            Object.entries(grades.grade_data).map(
                              ([subject, grade]: any, index) => (
                                <tr
                                  key={index}
                                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0"
                                >
                                  <td className="px-2 py-2.5 font-bold text-slate-800 text-xs leading-tight">
                                    {subject}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-400 text-xs">
                                    -
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    <span
                                      className={`inline-block w-8 h-6 leading-6 rounded font-bold text-xs ${
                                        grade === "Ex"
                                          ? "bg-blue-600 text-white"
                                          : "bg-slate-100 text-slate-800"
                                      }`}
                                    >
                                      {grade}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-400 text-xs">
                                    -
                                  </td>
                                </tr>
                              ),
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* GPA Display - Centered below table */}
                <div className="px-6 py-8 bg-slate-50/30 flex flex-col items-center justify-center border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Semester GPA :
                    </span>
                    <span className="text-3xl font-semibold text-slate-900 tracking-tighter">
                      {grades.gpa !== null && grades.gpa !== undefined
                        ? Number(grades.gpa).toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                  {(grades.gpa === null || grades.gpa === undefined) && (
                    <div className="mt-1 text-xs text-slate-400">
                      Results not formatted
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            {/* Action Buttons */}
          </div>
        )}

        {/* Not Logged In State */}
        {!user?.username && !isLoading && !resultsFetched && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <AlertCircle size={40} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-black mb-3">Sign In Required</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
              Please sign in to your student account to access your academic
              performance records and grades.
            </p>
            <button className="uniz-primary-btn px-8 h-[54px]">
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Empty State */}
        {user?.username && !isLoading && !resultsFetched && !error && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <Award size={40} className="text-blue-600" />
            </div>

            <h3 className="text-2xl font-black mb-3">No Results Selected</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto font-medium">
              Select an academic year and semester above, then click "View
              Results" to see your grades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
