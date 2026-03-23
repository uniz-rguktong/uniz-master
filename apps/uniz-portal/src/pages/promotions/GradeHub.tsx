import { useState, useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "@/utils/toast-ref";
import { apiClient, downloadFile } from "../../api/apiClient";
import { student, studentAuthLoading } from "../../store";
import { writeAcademicCache, readAcademicCache, isCacheStale } from "../../utils/academicCache";

import {
  ChevronDown,
  GraduationCap,
  AlertCircle,
  Download,
  PartyPopper,
} from "lucide-react";
import { GET_GRADES, DOWNLOAD_GRADES } from "../../api/endpoints";
import { cn } from "../../utils/cn";

// Helper function to truncate long text

// Pikachu image URL (you can replace with a local asset)
const PIKACHU_IMAGE = "/pikachu.png";

export default function GradeHub() {
  const user = useRecoilValue(student);
  const authLoading = useRecoilValue(studentAuthLoading);
  // Hardcoded options as per requirements
  const years = ["E1", "E2", "E3", "E4"];
  const semesterOptions = ["Sem 1", "Sem 2"];

  const [selectedYear, setSelectedYear] = useState(user?.year || "E1");
  const [selectedSemester, setSelectedSemester] = useState("Sem 1");

  // Update year when user data loads
  // Only sync the initially-selected year once user data arrives — do NOT depend
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ref for auto-scrolling to results table
  const resultsRef = useRef<HTMLDivElement>(null);
  // Guard: prevents concurrent duplicate API calls
  const isFetchingRef = useRef(false);

  // Load from cache whenever year/semester selection changes
  useEffect(() => {
    if (!userUsername) return;
    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
    const cached = readAcademicCache<any>("grades", userUsername, selectedYear, mappedSemester, true);
    if (cached) {
      setGrades(cached);
      setResultsFetched(true);
      // Background refresh only if stale AND not already fetching
      if (isCacheStale("grades", userUsername, selectedYear, mappedSemester) && !isFetchingRef.current) {
        handleFetchResults(true);
      }
    } else {
      setGrades(null);
      setResultsFetched(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, userUsername]);

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

        const regularGrades = formattedGrades.filter((g: any) => g.attemptNumber === 1);
        
        const latestGradesMap = new Map();
        formattedGrades.forEach((g: any) => {
          const existing = latestGradesMap.get(g.subject);
          if (!existing || g.attemptNumber > existing.attemptNumber) {
            latestGradesMap.set(g.subject, g);
          }
        });
        const hasRemedial = formattedGrades.some((g: any) => g.isRemedial || g.attemptNumber > 1);
        const remedialGrades = hasRemedial ? Array.from(latestGradesMap.values()) : [];
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
        writeAcademicCache("grades", userUsername!, selectedYear, mappedSemester, transformedData);

        // Auto-scroll to results table (only for manual fetches)
        if (!silent) {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }

        // Party blast if GPA > 9.0 (only for manual/first-time fetches)
        if (!silent && extractedGPA > 9.0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
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

  // Prepare data for pie chart

  // Function to cycle through motivational messages

  return (
    <div className="font-sans text-slate-900">

      {/* Party Confetti Blast Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          {/* Animated confetti particles */}
          {Array.from({ length: 60 }).map((_, i) => {
            const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c", "#f472b6"];
            const color = colors[i % colors.length];
            const left = `${Math.random() * 100}%`;
            const size = `${6 + Math.random() * 10}px`;
            const delay = `${Math.random() * 0.6}s`;
            const duration = `${1.2 + Math.random() * 1}s`;
            const rotate = `${Math.random() * 720}deg`;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "-20px",
                  left,
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: i % 3 === 0 ? "50%" : "2px",
                  animation: `confettiFall ${duration} ${delay} ease-in forwards`,
                  transform: `rotate(${rotate})`,
                }}
              />
            );
          })}
          {/* Centered celebration badge */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-2xl border border-yellow-100 flex flex-col items-center gap-3 animate-bounce">
              <PartyPopper size={48} className="text-yellow-500" />
              <p className="text-2xl font-black text-slate-900 tracking-tight">Outstanding GPA! 🎉</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Above 9.0 — Exceptional Performance</p>
            </div>
          </div>
          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-8">
          <p className="text-slate-500 font-medium text-[13px]">
            Academic Performance Terminal
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Results
          </h1>
        </div>

        {/* Selection Criteria */}
        <div className="mb-8 md:bg-white p-6 px-0 md:px-6 md:rounded-xl md:border md:border-slate-100 md:shadow-sm bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
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
                  className="text-slate-400 group-hover:text-navy-900 transition-colors"
                />
              </div>

              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                  {years.map((year) => (
                    <div
                      key={year}
                      className={`p-3 cursor-pointer text-sm font-semibold transition-colors ${
                        selectedYear === year
                          ? "bg-navy-900 text-white"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-sm appearance-none focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-all"
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

            <div className="flex flex-col md:flex-row gap-4 flex-1">
              
                <div className="md:w-48">
                <button
                  onClick={() => handleFetchResults(false)}
                  className="w-full h-[46px] bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                  disabled={isLoading || !user?.username}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      Processing...
                    </span>
                  ) : (
                    <span>Get Results</span>
                  )}
                </button>
              </div>
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

            <p className="text-slate-400 text-xs font-medium">
              {loadingMessage}
            </p>
          </div>
        )}

        {/* Results Section */}
        {resultsFetched && grades && grades.success && !isLoading && (
          <div ref={resultsRef} className="-mx-4 md:mx-0 md:bg-white md:border md:border-slate-100 md:rounded-xl overflow-hidden md:shadow-sm bg-transparent scroll-mt-4">
            {/* Results Header */}
            <div className="md:bg-white border-b border-slate-100 md:px-6 px-4 py-5 flex justify-between items-center bg-transparent">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Transcript For
                </span>
                <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                  {grades.year} <span className="text-slate-300 mx-1">/</span>{" "}
                  {grades.semester}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
                    const semId = `${selectedYear}-${mappedSemester}`;
                    await downloadFile(
                      DOWNLOAD_GRADES(semId),
                      `Full_Grades_${user.username}_${semId}.pdf`,
                      { studentId: user.username, reportType: 'REGULAR' }
                    );
                  }}
                  className="h-10 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download size={14} /> Output PDF
                </button>
              </div>
            </div>

            {/* Content */}
            {!grades.calculation_details ||
            grades.calculation_details.length === 0 ? (
              <div className="p-12 text-center bg-slate-50/30">
                <AlertCircle
                  size={48}
                  className="mx-auto mb-4 text-slate-300"
                />
                <h3 className="text-xl font-bold mb-2">
                  No Results Available
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Calculated records for this semester are not yet finalized. Please check back later or contact your department.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 md:px-6 py-6 space-y-12">
                  {/* Regular Section */}
                  {grades.regular?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-4 rounded-full bg-navy-900"></div>
                          REGULAR RESULTS
                        </h3>
                      </div>
                      <div className="md:rounded-2xl md:bg-white bg-transparent border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm table-fixed">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="px-5 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[55%]">
                                Subjects
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Credits
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Grade
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {grades.regular.map((item: any, gIdx: number) => (
                              <tr key={gIdx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-5 py-4">
                                  <span className="font-bold text-slate-800 text-xs leading-tight">
                                    {item.subject}
                                  </span>
                                </td>
                                <td className="px-2 py-4 text-center text-slate-500 font-medium text-xs">
                                  {Number(item.credits).toFixed(1)}
                                </td>
                                <td className="px-2 py-4 text-center">
                                  <span className={cn(
                                    "inline-block px-2.5 py-1 rounded-md font-bold text-[11px]",
                                    item.grade === "Ex" || item.grade === "A"
                                      ? "bg-navy-900 text-white"
                                      : item.grade === "R"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-slate-100 text-slate-800"
                                  )}>
                                    {item.grade}
                                  </span>
                                </td>
                                <td className="px-2 py-4 text-center">
                                  {item.grade === "R" ? (
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Failed</span>
                                  ) : (
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Passed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {/* Remedial Section */}
                  {grades.remedial?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-4 rounded-full bg-orange-500"></div>
                          REMEDIAL RESULTS
                        </h3>
                        <button
                          onClick={async () => {
                            const mappedSemester = selectedSemester === "Sem 1" ? "SEM-1" : "SEM-2";
                            const semId = `${selectedYear}-${mappedSemester}`;
                            await downloadFile(
                              DOWNLOAD_GRADES(semId),
                              `Remedial_Grades_${user.username}_${semId}.pdf`,
                              { studentId: user.username, reportType: 'REMEDIAL' }
                            );
                          }}
                          className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Download size={14} /> Output Remedial PDF
                        </button>
                      </div>
                      <div className="md:rounded-2xl md:bg-white bg-transparent border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm table-fixed">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="px-5 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[55%]">
                                Subjects
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Credits
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Grade
                              </th>
                              <th className="px-2 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400 w-[15%]">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {grades.remedial.map((item: any, gIdx: number) => (
                              <tr key={gIdx} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 text-xs leading-tight">
                                        {item.subject}
                                      </span>
                                      {item.attemptNumber > 1 && (
                                        <span className="shrink-0 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black uppercase tracking-tighter border border-amber-100/50">
                                          Remedial
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-4 text-center text-slate-500 font-medium text-xs">
                                  {Number(item.credits).toFixed(1)}
                                </td>
                                <td className="px-2 py-4 text-center">
                                  <span className={cn(
                                    "inline-block px-2.5 py-1 rounded-md font-bold text-[11px]",
                                    item.grade === "Ex" || item.grade === "A"
                                      ? "bg-navy-900 text-white"
                                      : item.grade === "R"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-slate-100 text-slate-800"
                                  )}>
                                    {item.grade}
                                  </span>
                                </td>
                                <td className="px-2 py-4 text-center">
                                  {item.grade === "R" ? (
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Failed</span>
                                  ) : (
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Passed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* GPA Display - Centered below table */}
                <div className="px-6 py-8 md:bg-slate-50/30 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 border-t border-slate-50 bg-transparent">
                  {/* SGPA Section */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Semester GPA
                    </span>
                    <span className="text-4xl font-black text-navy-900 tracking-tighter">
                      {grades.gpa !== null && grades.gpa !== undefined
                        ? Number(grades.gpa).toFixed(2)
                        : "N/A"}
                    </span>
                  </div>

                  {/* Subtle Divider */}
                  <div className="w-[1px] h-12 bg-slate-200 hidden md:block"></div>

                  {/* CGPA Section */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Cumulative GPA
                    </span>
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                      {grades.cgpa !== null && grades.cgpa !== undefined
                        ? Number(grades.cgpa).toFixed(2)
                        : "N/A"}
                    </span>
                  </div>

                  {/* Backlogs Section */}
                  {grades.totalBacklogs !== undefined &&
                    grades.totalBacklogs > 0 && (
                      <>
                        <div className="w-[1px] h-12 bg-slate-200 hidden md:block"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            Active Backlogs
                          </span>
                          <span className="text-4xl font-black text-red-500 tracking-tighter flex items-center gap-2">
                            {grades.totalBacklogs}
                          </span>
                        </div>
                      </>
                    )}
                </div>

                {grades.motivational_messages && (
                  <div className="px-6 pb-8 bg-slate-50/30 text-center">
                    <p className="text-slate-500 font-medium italic text-sm max-w-2xl mx-auto">
                      "{grades.motivational_messages}"
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            {/* Action Buttons */}
          </div>
        )}

        {/* Not Logged In State — only show AFTER /me has resolved */}
        {!authLoading && !user?.username && !isLoading && !resultsFetched && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
              <AlertCircle size={40} className="text-navy-900" />
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

        {/* Empty State — only show after /me has resolved */}
        {!authLoading &&
          user?.username &&
          !isLoading &&
          !resultsFetched &&
          !error && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
              <div className="md:bg-white w-20 h-20 md:rounded-2xl flex items-center justify-center mx-auto mb-6 md:shadow-sm md:border md:border-slate-100 bg-transparent">
                <GraduationCap size={40} className="text-navy-900" />
              </div>

              <h3 className="text-2xl font-black mb-3">No Results Selected</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto font-medium">
                Select an academic year and semester above, then click "Get
                Results" to see your grades.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
