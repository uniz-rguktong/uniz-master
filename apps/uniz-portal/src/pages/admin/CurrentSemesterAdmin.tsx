import { formatStatus } from "@/utils/displayText";
import { useState, useEffect } from "react";
import { apiClient } from "../../api/apiClient";
import { GET_SEMESTER_OVERVIEW } from "../../api/endpoints";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Users,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CurrentSemesterAdmin() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient<any>(GET_SEMESTER_OVERVIEW);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to fetch semester overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0A2540] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-navy-400 font-bold text-xs tracking-[0.14em]">
            Syncing Academic Data...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.semester) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="bg-navy-50 p-12 rounded-[2px] border border-dashed border-navy-200 text-center">
          <Layers className="w-12 h-12 text-navy-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900">
            No Session Active
          </h2>
          <p className="text-navy-500 text-sm mt-1">
            Please initialize a semester record in Curriculum Management.
          </p>
        </div>
      </div>
    );
  }

  const { semester, data: adminData } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-navy-100 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-[#0A2540] text-white px-2 py-0.5 rounded text-[10px] font-semibold tracking-tighter">
              Active Session
            </div>
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-tighter ${
                semester.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {formatStatus(semester.status)}
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-navy-900">
            {semester.name}
          </h1>
          <p className="text-navy-500 font-medium text-sm italic">
            Institutional Academic Structure Overview
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-navy-50 p-4 rounded-[2px] border border-navy-100 min-w-[140px]">
            <p className="text-[10px] font-bold text-navy-400 tracking-[0.14em] mb-1">
              Total Branches
            </p>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-navy-400" />
              <span className="text-2xl font-semibold text-navy-900">
                {adminData?.summary?.totalBranches || 0}
              </span>
            </div>
          </div>
          <div className="bg-navy-50 p-4 rounded-[2px] border border-navy-100 min-w-[140px]">
            <p className="text-[10px] font-bold text-navy-400 tracking-[0.14em] mb-1">
              Total Subjects
            </p>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-navy-400" />
              <span className="text-2xl font-semibold text-navy-900">
                {adminData?.summary?.totalSubjects || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <LayoutGrid className="w-4 h-4 text-navy-400" />
          <h2 className="text-xs font-bold text-navy-400 tracking-[0.14em]">
            Branch Allocations
          </h2>
        </div>

        {adminData?.branches?.map((branch: any) => (
          <div
            key={branch.branch}
            className="border border-navy-100 rounded-[2px] overflow-hidden bg-white shadow-sm hover:border-navy-200 transition-all"
          >
            <button
              onClick={() =>
                setExpandedBranch(
                  expandedBranch === branch.branch ? null : branch.branch,
                )
              }
              className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 text-left hover:bg-navy-50/50 transition-colors"
            >
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className="w-14 h-14 bg-navy-900 text-white rounded-[2px] flex items-center justify-center font-semibold text-xl shadow-lg ring-4 ring-navy-50">
                  {branch.branch}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-navy-900">
                    {branch.branch} Department
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-navy-400" />
                      <span className="text-[11px] font-bold text-navy-400 tracking-tight">
                        Years: {branch.academicYears?.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-navy-400 tracking-[0.14em] mb-0.5">
                    Stats
                  </p>
                  <p className="text-sm font-semibold text-navy-900">
                    {branch.subjectCount} Subjects • {branch.totalCredits}{" "}
                    Credits
                  </p>
                </div>
                {expandedBranch === branch.branch ? (
                  <ChevronUp className="w-5 h-5 text-navy-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-navy-400" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedBranch === branch.branch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-navy-50/30 border-t border-navy-50 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {branch.subjects?.map((sub: any) => (
                        <div
                          key={sub.code}
                          className="bg-white p-4 rounded-[2px] border border-navy-100 shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-semibold text-navy-400 ">
                                {sub.year} Session
                              </span>
                              {sub.isApproved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <h4 className="font-bold text-navy-900 leading-tight mb-1">
                              {sub.name}
                            </h4>
                            <p className="text-[11px] font-bold text-navy-400">
                              {sub.code}
                            </p>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3">
                            <span className="text-[10px] font-semibold text-navy-300 tracking-[0.14em]">
                              {formatStatus(sub.status)}
                            </span>
                            <span className="text-xs font-semibold text-navy-900">
                              {sub.credits} Units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
