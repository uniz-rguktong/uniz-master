import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "react-toastify";
import { apiClient } from "../../api/apiClient";
import { student } from "../../store";

import { ChevronDown, Award, AlertCircle } from "lucide-react";
import { GET_GRADES } from "../../api/endpoints";

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
    <div className="min-h-screen bg-white font-sans text-neutral-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-black mb-2">
            Results
          </h1>
          <p className="text-neutral-500 font-medium text-sm">
            Track your academic performance across semesters.
          </p>
        </div>

        {/* Selection Criteria */}
        <div className="mb-8 bg-white p-6 rounded-3xl border border-neutral-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-black text-white p-1.5 rounded-md">
              <Award size={16} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Select Criteria
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">
                Academic Year
              </label>
              <div
                className="w-full flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-lg p-3 cursor-pointer hover:border-black transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="font-bold text-sm">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className="text-neutral-400 group-hover:text-black transition-colors"
                />
              </div>

              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`p-3 cursor-pointer text-sm font-medium transition-colors ${
                        selectedYear === year
                          ? "bg-black text-white"
                          : "hover:bg-neutral-50 text-neutral-700"
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">
                Semester
              </label>
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setResultsFetched(false);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-bold text-sm appearance-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                >
                  {semesterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">
                Actions
              </label>
              <button
                onClick={handleFetchResults}
                className={`w-full h-[46px] flex items-center justify-center font-bold text-sm rounded-lg transition-all duration-300 ${
                  isLoading
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-neutral-800 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                }`}
                disabled={isLoading || !user?.username}
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">Loading...</span>
                ) : (
                  <span>View Results</span>
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <img
              src={PIKACHU_IMAGE}
              alt="Pikachu"
              className="w-24 h-24 mx-auto mb-4 animate-bounce"
            />
            <h3 className="text-xl font-semibold mb-2">
              Pikachu is on the case!
            </h3>
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        )}

        {/* Results Section */}
        {resultsFetched && grades && grades.success && !isLoading && (
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden">
            {/* Results Header */}
            <div className="bg-white border-b border-neutral-100 px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-0.5">
                  Results For
                </span>
                <h2 className="text-xl font-black text-black">
                  {grades.year} <span className="text-neutral-300">/</span>{" "}
                  {grades.semester}
                </h2>
              </div>
            </div>

            {/* Content */}
            {grades.gpa === null || grades.gpa === undefined ? (
              <div className="p-12 text-center">
                <AlertCircle
                  size={48}
                  className="mx-auto mb-4 text-neutral-300"
                />
                <h3 className="text-xl font-bold mb-2">
                  Results Not Available
                </h3>
                <p className="text-neutral-500">
                  These details are not yet updated, please check back shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 space-y-6">
                  {/* Grades Section */}
                  <div>
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-black"></div> Grades
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                              S.no
                            </th>
                            <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                              Subjects
                            </th>
                            <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                              Credits
                            </th>
                            <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                              Grade
                            </th>
                            <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-widest text-neutral-500">
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.calculation_details?.map(
                            (item: any, index: any) => (
                              <tr
                                key={index}
                                className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors last:border-0"
                              >
                                <td className="px-3 py-2 text-neutral-400 font-medium text-xs">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-2 font-bold text-neutral-800 text-xs">
                                  {item.subject}
                                </td>
                                <td className="px-3 py-2 text-center text-neutral-600 font-medium text-xs">
                                  {item.credits}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span
                                    className={`inline-block w-8 h-6 leading-6 rounded font-bold text-xs ${
                                      item.grade === "Ex"
                                        ? "bg-black text-white"
                                        : "bg-neutral-100 text-neutral-800"
                                    }`}
                                  >
                                    {item.grade}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-neutral-800 text-xs">
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
                                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors last:border-0"
                                >
                                  <td className="px-3 py-2 text-neutral-400 font-medium text-xs">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-neutral-800 text-xs">
                                    {subject}
                                  </td>
                                  <td className="px-3 py-2 text-center text-neutral-400 text-xs">
                                    -
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span
                                      className={`inline-block w-8 h-6 leading-6 rounded font-bold text-xs ${
                                        grade === "Ex"
                                          ? "bg-black text-white"
                                          : "bg-neutral-100 text-neutral-800"
                                      }`}
                                    >
                                      {grade}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center text-neutral-400 text-xs">
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
                <div className="px-6 pb-6 bg-white flex flex-col items-center justify-center border-t border-neutral-100 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-600 uppercase tracking-widest">
                      Your SGPA IS :
                    </span>
                    <span className="text-2xl font-black text-black">
                      {grades.gpa !== null && grades.gpa !== undefined
                        ? Number(grades.gpa).toFixed(2)
                        : "N/A"}
                    </span>
                  </div>
                  {(grades.gpa === null || grades.gpa === undefined) && (
                    <div className="mt-1 text-xs text-neutral-400">
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
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
              <AlertCircle size={40} className="text-black" />
            </div>
            <h3 className="text-2xl font-black mb-3">Sign In Required</h3>
            <p className="text-neutral-500 mb-8 max-w-md mx-auto font-medium">
              Please sign in to your student account to access your academic
              performance records and grades.
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

            <h3 className="text-2xl font-black mb-3">No Results Selected</h3>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto font-medium">
              Select an academic year and semester above, then click "View
              Results" to see your grades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
