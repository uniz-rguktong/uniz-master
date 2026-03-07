"use client";
import { useState } from "react";
import { Star, Award, Users } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OutgoingStudentsPublicView({
  initialStudents,
}: {
  initialStudents: any[];
}) {
  const [filterGender, setFilterGender] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");

  const years = Array.from(
    new Set(initialStudents.map((s: any) => s.awardYear)),
  ).sort((a: any, b: any) => b - a);
  const branches = ["CSE", "ECE", "MECH", "CIVIL", "EEE"];

  const filteredStudents = initialStudents.filter((student: any) => {
    if (!student.isPublished) return false;
    const matchesGender =
      filterGender === "all" ||
      student.gender?.toLowerCase() === filterGender.toLowerCase();
    const matchesYear =
      filterYear === "all" || String(student.awardYear) === String(filterYear);
    const matchesBranch =
      filterBranch === "all" || student.branch === filterBranch;
    return matchesGender && matchesYear && matchesBranch;
  });

  const overallStudents = filteredStudents.filter((s) => s.isOverall);
  const branchStudents = filteredStudents.filter((s) => !s.isOverall);

  return (
    <div className="space-y-12">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex gap-2">
          {["all", "male", "female"].map((g) => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterGender === g ? "bg-[#1A1A1A] text-white shadow-lg" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            >
              {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Winners */}
      {overallStudents.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-green-100">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">
                Overall Best Students
              </h2>
              <p className="text-gray-500">
                The highest honor for our graduating class
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {overallStudents.map((student) => (
              <StudentCard key={student.id} student={student} isFeatured />
            ))}
          </div>
        </section>
      )}

      {/* Branch Winners */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-100">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">
              Branch-wise Excellence
            </h2>
            <p className="text-gray-500">Top performers from each department</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branchStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
        {branchStudents.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No students found for current selection.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StudentCard({
  student,
  isFeatured = false,
}: {
  student: any;
  isFeatured?: boolean;
}) {
  return (
    <div
      className={`group relative bg-white rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border ${isFeatured ? "border-[#10B981]/20 bg-gradient-to-br from-white to-[#F0FFF4]" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          {student.photo ? (
            <Image
              src={student.photo}
              alt={student.name}
              width={80}
              height={80}
              className={`w-20 h-20 rounded-2xl object-cover ring-4 ${isFeatured ? "ring-[#10B981]/20" : "ring-gray-50"}`}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div
            className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${student.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
          >
            {isFeatured ? (
              <Award className="w-4 h-4 text-white" />
            ) : (
              <Star className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-xl font-bold text-[#1A1A1A] truncate leading-tight mb-1">
            {student.name}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {student.branch} • {student.rollNumber}
          </p>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isFeatured ? "bg-[#10B981] text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {isFeatured ? "🏆 OVERALL BEST" : `BEST ${student.gender}`} •{" "}
            {student.awardYear}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50/50 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">CGPA</p>
          <p className="text-lg font-bold text-[#1A1A1A]">{student.cgpa}</p>
        </div>
        <div className="bg-gray-50/50 rounded-2xl p-3 text-center">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">
            Status
          </p>
          <p className="text-[11px] font-bold text-[#1A1A1A] truncate">
            {student.placementStatus === "Placed"
              ? student.company || "Placed"
              : student.placementStatus || "Graduated"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
          Key Achievements
        </p>
        <div className="space-y-2">
          {student.achievements?.slice(0, 3).map((a: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white/50 p-2 rounded-xl border border-gray-50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {student.package && (
        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs">
          <span className="text-gray-400">
            {student.placementStatus === "Placed" ? "Offer Details" : "Details"}
          </span>
          <span className="font-bold text-[#10B981]">{student.package}</span>
        </div>
      )}
    </div>
  );
}
