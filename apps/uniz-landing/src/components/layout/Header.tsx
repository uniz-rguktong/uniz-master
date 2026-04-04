import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Search, X, ArrowRight } from "lucide-react";

const SEARCH_DIRECTORY = [
  { title: "Home", path: "/", category: "General" },
  { title: "News & Updates", path: "/notifications/news", category: "Notifications" },
  { title: "Tenders", path: "/notifications/tenders", category: "Notifications" },
  { title: "Careers", path: "/notifications/careers", category: "Notifications" },
  { title: "About RGUKT", path: "/institute/aboutrgukt", category: "Institute" },
  { title: "Campus Life", path: "/institute/campuslife", category: "Institute" },
  { title: "Education System", path: "/institute/edusys", category: "Institute" },
  { title: "Governing Council", path: "/institute/govcouncil", category: "Institute" },
  { title: "RTI Information", path: "/institute/rtiinfo", category: "Institute" },
  { title: "SC/ST Cell", path: "/institute/scst", category: "Institute" },
  { title: "Academic Programs", path: "/academics/AcademicPrograms", category: "Academics" },
  { title: "Academic Calendar", path: "/academics/AcademicCalender", category: "Academics" },
  { title: "Academic Regulations", path: "/academics/AcademicRegulations", category: "Academics" },
  { title: "Curricula", path: "/academics/curicula", category: "Academics" },
  { title: "Computer Science Engineering (CSE)", path: "/departments/CSE", category: "Departments" },
  { title: "Civil Engineering", path: "/departments/CIVIL", category: "Departments" },
  { title: "Electronics and Communication (ECE)", path: "/departments/ECE", category: "Departments" },
  { title: "Electrical & Electronics (EEE)", path: "/departments/EEE", category: "Departments" },
  { title: "Mechanical Engineering (ME)", path: "/departments/ME", category: "Departments" },
  { title: "Mathematics", path: "/departments/MATHEMATICS", category: "Departments" },
  { title: "Physics", path: "/departments/PHYSICS", category: "Departments" },
  { title: "Chemistry", path: "/departments/CHEMISTRY", category: "Departments" },
  { title: "Information Technology (IT)", path: "/departments/IT", category: "Departments" },
  { title: "Biology", path: "/departments/BIOLOGY", category: "Departments" },
  { title: "English", path: "/departments/ENGLISH", category: "Departments" },
  { title: "Library", path: "/departments/LIB", category: "Departments" },
  { title: "Management", path: "/departments/MANAGEMENT", category: "Departments" },
  { title: "Physical Education (PED)", path: "/departments/PED", category: "Departments" },
  { title: "Telugu", path: "/departments/TELUGU", category: "Departments" },
  { title: "Yoga", path: "/departments/YOGA", category: "Departments" }
];

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Close search on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    if (isSearchOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isSearchOpen]);

  const filteredResults = SEARCH_DIRECTORY.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="w-full px-4 lg:px-8 mx-auto flex h-[76px] items-center justify-between">

        {/* LOGO AREA */}
        <Link to="/" className="flex items-center shrink-0 mr-auto z-10 ml-2 md:ml-6 lg:ml-10">
          <img
            src="/rgukt-logo.png"
            alt="RGUKT Ongole Campus"
            className="h-12 md:h-[54px] object-contain drop-shadow-none mix-blend-multiply"
          />
          <div className="hidden sm:flex flex-col justify-center gap-0.5 ml-3">
            <span className="font-extrabold text-[#113255] tracking-tight leading-none text-xl md:text-[22px] whitespace-nowrap">
              RGUKT
            </span>
            <span className="text-[11px] md:text-[12px] font-bold text-[#800000] tracking-[0.08em] whitespace-nowrap uppercase">
              Ongole Campus
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[15.5px] font-medium text-slate-600 transition-all z-10">
          <Link to="/" className="hover:text-[#800000] transition-colors whitespace-nowrap py-8">Home</Link>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Institute <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-slate-700 text-[14.5px]">
              <Link to="/institute/aboutrgukt" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">About RGUKT</Link>
              <Link to="/institute/campuslife" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Campus Life</Link>
              <Link to="/institute/edusys" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Education System</Link>
              <Link to="/institute/govcouncil" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Governing Council</Link>
              <Link to="/institute/rtiinfo" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">RTI Information</Link>
              <Link to="/institute/scst" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">SC/ST Cell</Link>
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Academics <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-0 w-56 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-slate-700 text-[14.5px]">
              <Link to="/academics/AcademicPrograms" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Academic Programs</Link>
              <Link to="/academics/AcademicCalender" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Academic Calendar</Link>
              <Link to="/academics/AcademicRegulations" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Academic Regulations</Link>
              <Link to="/academics/curicula" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Curricula</Link>
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Departments <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[340px] bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700 text-[14px]">
              {[
                "CSE", "CIVIL", "ECE", "EEE", "ME",
                "MATHEMATICS", "PHYSICS", "CHEMISTRY",
                "IT", "BIOLOGY", "ENGLISH", "LIB",
                "MANAGEMENT", "PED", "TELUGU", "YOGA"
              ].map(dept => (
                <Link key={dept} to={`/departments/${dept}`} className="block px-3 py-2 rounded-md hover:bg-slate-50 hover:text-[#800000] col-span-1">{dept} Dept.</Link>
              ))}
            </div>
          </div>

          <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#800000] transition-colors py-8 h-full whitespace-nowrap">
            <span className="flex items-center gap-1">
              Notifications <ChevronDown className="w-[14px] h-[14px] text-slate-400 group-hover:text-[#800000] transition-colors" />
            </span>
            <div className="absolute top-[80px] left-0 w-52 bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50 transform origin-top translate-y-2 group-hover:translate-y-0 text-slate-700 text-[14.5px]">
              <Link to="/notifications/news" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">News & Updates</Link>
              <Link to="/notifications/tenders" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Tenders</Link>
              <Link to="/notifications/careers" className="block px-5 py-2 hover:bg-slate-50 hover:text-[#800000]">Careers</Link>
            </div>
          </div>
        </nav>

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center shrink-0 z-10 mr-2 md:mr-6 lg:mr-10 ml-auto">
          <button 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search" 
            className="w-10 h-10 flex items-center justify-center text-slate-800 hover:text-[#800000] hover:scale-110 transition-all duration-300 bg-transparent outline-none"
          >
            <Search className="w-[22px] h-[22px] stroke-[2.5]" />
          </button>
        </div>

      </div>
    </header>

    {/* Search Modal Overlay */}
    {isSearchOpen && (
      <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-start justify-center pt-24 sm:pt-32 px-4 transition-all duration-300 opacity-100">
        <div 
          className="absolute inset-0" 
          onClick={() => setIsSearchOpen(false)} 
        />
        
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 translate-y-0 scale-100">
          <div className="relative flex items-center border-b border-slate-100 px-6 py-4">
            <Search className="w-5 h-5 text-[#800000]" />
            <input
              autoFocus
              type="text"
              placeholder="Search campus directory, departments, or notifications..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-slate-800 text-lg placeholder:text-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
            {searchQuery.trim() === "" ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <p className="text-base font-medium">Type something to search the campus directory.</p>
                <p className="text-sm mt-1 opacity-80">Try searching for "CSE", "Library", or "Tenders".</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <p className="text-base font-medium">No results found for "{searchQuery}".</p>
                <p className="text-sm mt-1 opacity-80">Double-check your spelling or try a different term.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(item.path, { state: (item as any).state });
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left px-5 py-3.5 hover:bg-slate-50 rounded-xl transition-colors group border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <span className="block text-slate-800 font-semibold group-hover:text-[#800000] transition-colors">{item.title}</span>
                      <span className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mt-0.5">{item.category}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#800000] transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:block" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
