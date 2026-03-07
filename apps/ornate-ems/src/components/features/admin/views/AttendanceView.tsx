"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { MetricCard } from "@/components/MetricCard";
import { MetricCardSkeleton, TableRowSkeleton } from "@/components/ui/skeleton";
import {
  getEventRegistrations,
  type EventAttendee,
} from "@/actions/registrationGetters";
import { updateRegistrationStatus } from "@/actions/registrationActions";
import Link from "next/link";

interface AttendanceViewProps {
  eventId: string;
  backPath: string;
  backLabel: string;
}

const ITEMS_PER_PAGE = 10;

export function AttendanceView({
  eventId,
  backPath,
  backLabel,
}: AttendanceViewProps) {
  const { showToast } = useToast();
  const [students, setStudents] = useState<EventAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewType, setViewType] = useState("table");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    const response = await getEventRegistrations(eventId);

    if (response.success) {
      setStudents((response as any).data ?? []);
    } else {
      showToast("Failed to load registrations", "error");
    }
    setIsLoading(false);
  }, [eventId, showToast]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleMarkAttendance = async (id: string, status: string) => {
    // Optimistic Update
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );

    // DB Status Mapping
    let dbStatus = "CONFIRMED";
    if (status === "present") dbStatus = "ATTENDED";
    else if (status === "absent") dbStatus = "CANCELLED";
    else if (status === "not-marked") dbStatus = "CONFIRMED";

    const result = await updateRegistrationStatus(id, dbStatus);

    if (result.success) {
      showToast(`Attendance marked as ${status}`, "success");
    } else {
      showToast("Failed to update attendance", "error");
      fetchRegistrations(); // Reload to be safe
    }
  };

  const stats = {
    total: students.length,
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    pending: students.filter((s) => s.status === "not-marked").length,
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  return (
    <div className="p-4 md:p-8 animate-page-entrance max-w-[1400px] mx-auto">
      <div className="mb-8">
        <Link
          href={backPath}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] mb-3 hover:text-[#1A1A1A] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {backLabel}
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-bold text-[#1A1A1A] mb-2 flex items-center gap-3">
              Live Attendance Tracking
            </h1>
            <p className="text-sm text-[#6B7280]">
              Mark and monitor real-time attendance for your event
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Registered"
              value={stats.total.toString()}
              icon={Users}
              iconBgColor="#DBEAFE"
              iconColor="#3B82F6"
              subtitle="For this event"
              infoText="Total students registered"
              delay={0}
            />
            <MetricCard
              title="Present Today"
              value={stats.present.toString()}
              icon={UserCheck}
              iconBgColor="#D1FAE5"
              iconColor="#10B981"
              subtitle="Checked in"
              infoText="Students marked as present"
              delay={40}
            />
            <MetricCard
              title="Absent"
              value={stats.absent.toString()}
              icon={UserX}
              iconBgColor="#FEE2E2"
              iconColor="#EF4444"
              subtitle="Marked absent"
              infoText="Students marked absent"
              delay={80}
            />
            <MetricCard
              title="Pending"
              value={stats.pending.toString()}
              icon={Clock}
              iconBgColor="#FEF3C7"
              iconColor="#F59E0B"
              subtitle="Awaiting check-in"
              infoText="Students yet to check in"
              delay={120}
            />
          </>
        )}
      </div>

      {/* Main Content Wrapper */}
      <div className="bg-[#F4F2F0] rounded-[22px] p-[10px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-[12px] mt-[10px] mb-[16px]">
          <div className="flex-1 relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full sm:w-auto justify-end">
            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-full p-1 shrink-0 shadow-sm">
              {["all", "present", "absent", "not-marked"].map((t: any) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    filter === t
                      ? "bg-[#1A1A1A] text-white shadow-sm"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {t === "not-marked" ? "Pending" : t.replace("-", " ")}
                </button>
              ))}
            </div>

            <div className="flex bg-white border border-[#E5E7EB] rounded-xl p-1 shrink-0 shadow-sm">
              <button
                onClick={() => setViewType("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewType === "grid" ? "bg-[#1A1A1A] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType("table")}
                className={`p-1.5 rounded-lg transition-all ${viewType === "table" ? "bg-[#1A1A1A] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                fetchRegistrations();
                setSearchQuery("");
                setFilter("all");
                showToast("Data refreshed successfully", "success");
              }}
              className="p-2.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F3F4F6] text-[#6B7280] shrink-0 active:scale-95 transition-all shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden shadow-sm min-h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i: any) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : viewType === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student: any, idx: any) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-[#FAFAFA] transition-all animate-row-entrance ${idx === paginatedStudents.length - 1 ? "border-b-0" : ""}`}
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#1A1A1A]">
                                {student.name}
                              </div>
                              <div className="text-xs font-medium text-[#6B7280]">
                                {student.roll}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-[#F3F4F6] text-[#4B5563] text-[10px] font-bold uppercase tracking-wider rounded-lg">
                            {student.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleMarkAttendance(student.id, "present")
                              }
                              className={`p-2 rounded-xl transition-all ${
                                student.status === "present"
                                  ? "bg-[#ECFDF5] text-[#10B981] cursor-default"
                                  : "text-[#6B7280] hover:bg-[#ECFDF5] hover:text-[#10B981]"
                              }`}
                              title="Mark Present"
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleMarkAttendance(student.id, "absent")
                              }
                              className={`p-2 rounded-xl transition-all ${
                                student.status === "absent"
                                  ? "bg-[#FEE2E2] text-[#EF4444] cursor-default"
                                  : "text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                              }`}
                              title="Mark Absent"
                            >
                              <UserX className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              student.status === "present"
                                ? "bg-[#ECFDF5] text-[#10B981]"
                                : student.status === "absent"
                                  ? "bg-[#FEE2E2] text-[#EF4444]"
                                  : "bg-gray-100 text-[#6B7280]"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                student.status === "present"
                                  ? "bg-[#10B981]"
                                  : student.status === "absent"
                                    ? "bg-[#EF4444]"
                                    : "bg-[#6B7280]"
                              }`}
                            />
                            {student.status === "not-marked"
                              ? "Pending"
                              : student.status.replace("-", " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-20 text-center text-[#6B7280] text-sm"
                      >
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student: any, idx: any) => (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 animate-card-entrance flex flex-col group"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#F9FAFB] text-[#1A1A1A] rounded-2xl flex items-center justify-center font-bold text-xl uppercase shadow-sm group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors duration-300">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-base font-bold text-[#1A1A1A] line-clamp-1">
                            {student.name}
                          </div>
                          <div className="text-xs font-semibold text-[#6B7280]">
                            {student.roll}
                          </div>
                          <div className="mt-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                            {student.department}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full shadow-sm animate-pulse ${
                          student.status === "present"
                            ? "bg-[#10B981]"
                            : student.status === "absent"
                              ? "bg-[#EF4444]"
                              : "bg-[#E5E7EB]"
                        }`}
                      />
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() =>
                          handleMarkAttendance(student.id, "present")
                        }
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          student.status === "present"
                            ? "bg-[#10B981] text-white"
                            : "bg-[#F9FAFB] text-[#1A1A1A] hover:bg-[#ECFDF5] hover:text-[#10B981]"
                        }`}
                      >
                        <UserCheck className="w-4 h-4" /> PRESENT
                      </button>
                      <button
                        onClick={() =>
                          handleMarkAttendance(student.id, "absent")
                        }
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          student.status === "absent"
                            ? "bg-[#EF4444] text-white"
                            : "bg-[#F9FAFB] text-[#1A1A1A] hover:bg-[#FEE2E2] hover:text-[#EF4444]"
                        }`}
                      >
                        <UserX className="w-4 h-4" /> ABSENT
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-[#6B7280] text-sm">
                  No students found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-[12px] mt-[16px] mb-[6px]">
            <p className="text-xs font-semibold text-[#6B7280]">
              Showing{" "}
              <span className="text-[#1A1A1A]">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              –
              <span className="text-[#1A1A1A]">
                {Math.min(safePage * ITEMS_PER_PAGE, filteredStudents.length)}
              </span>{" "}
              of{" "}
              <span className="text-[#1A1A1A]">{filteredStudents.length}</span>{" "}
              students
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F9FAFB] shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>PREV</span>
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - safePage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "ellipsis")[]>((acc, page, i, arr) => {
                    if (i > 0 && page - (arr[i - 1] as number) > 1) {
                      acc.push("ellipsis");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item: any, i: any) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-[#9CA3AF] text-xs font-bold"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-90 ${
                          safePage === item
                            ? "bg-[#1A1A1A] text-white shadow-md"
                            : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F9FAFB] shadow-sm active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
