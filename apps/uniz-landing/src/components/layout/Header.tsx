import { Link } from "react-router-dom";

import { ChevronDown, Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="w-full px-4 lg:px-8 mx-auto flex h-[88px] items-center justify-between">
        {/* LOGO AREA */}
        <Link
          to="/"
          className="flex items-center shrink-0 mr-auto z-10 ml-2 md:ml-6 lg:ml-10"
        >
          <img
            src="/rgukt-logo.png"
            alt="RGUKT Ongole Campus"
            className="h-14 md:h-[64px] object-contain drop-shadow-none mix-blend-multiply"
          />
          <div className="hidden sm:flex flex-col justify-center gap-0.5 ml-2">
            <span className="font-extrabold text-[#113255] tracking-tight leading-none text-xl md:text-2xl whitespace-nowrap">
              RGUKT
            </span>
            <span className="text-[12px] md:text-[13px] font-bold text-[#800000] tracking-wider whitespace-nowrap uppercase">
              Ongole Campus
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[15.5px] font-medium text-slate-600 transition-all z-10">
          <Link
            to="/"
            className="hover:text-[#800000] transition-colors whitespace-nowrap py-8"
          >
            Home
          </Link>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Institute{" "}
              <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-slate-700 text-[14.5px]">
              <Link
                to="/institute/aboutrgukt"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                About RGUKT
              </Link>
              <Link
                to="/institute/campuslife"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Campus Life
              </Link>
              <Link
                to="/institute/edusys"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Education System
              </Link>
              <Link
                to="/institute/govcouncil"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Governing Council
              </Link>
              <Link
                to="/institute/rtiinfo"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                RTI Information
              </Link>
              <Link
                to="/institute/scst"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                SC/ST Cell
              </Link>
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Academics{" "}
              <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-slate-700 text-[14.5px]">
              <Link
                to="/academics/AcademicPrograms"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Academic Programs
              </Link>
              <Link
                to="/academics/AcademicCalender"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Academic Calendar
              </Link>
              <Link
                to="/academics/AcademicRegulations"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Academic Regulations
              </Link>
              <Link
                to="/academics/curicula"
                className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]"
              >
                Curricula
              </Link>
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Departments{" "}
              <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[340px] bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700 text-[14px]">
              {[
                "CSE",
                "CIVIL",
                "ECE",
                "EEE",
                "ME",
                "MATHEMATICS",
                "PHYSICS",
                "CHEMISTRY",
                "IT",
                "BIOLOGY",
                "ENGLISH",
                "LIB",
                "MANAGEMENT",
                "PED",
                "TELUGU",
                "YOGA",
              ].map((dept) => (
                <Link
                  key={dept}
                  to={`/departments/${dept}`}
                  className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-[#800000] col-span-1"
                >
                  {dept} Dept.
                </Link>
              ))}
            </div>
          </div>

          <Link
            to="/notifications"
            className="hover:text-[#800000] transition-colors py-8 whitespace-nowrap"
          >
            Notifications
          </Link>
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0 z-10 mr-2 md:mr-6 lg:mr-10 ml-auto">
          <Link
            to="/admissions"
            className="hidden sm:inline-flex items-center justify-center h-9 min-w-[96px] px-4 rounded-full bg-[#800000] text-white text-sm font-semibold hover:bg-[#600000] shadow-sm hover:shadow-md transition-all duration-300"
          >
            Admissions
          </Link>
          <Link
            to="/visit"
            className="hidden md:inline-flex items-center justify-center h-9 min-w-[96px] px-4 rounded-full bg-[#800000] text-white text-sm font-semibold hover:bg-[#600000] shadow-sm hover:shadow-md transition-all duration-300"
          >
            Visit Us
          </Link>
          <button
            aria-label="Search"
            className="ml-1 w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-[#800000] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
