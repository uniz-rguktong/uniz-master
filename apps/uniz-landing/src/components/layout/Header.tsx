import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, Menu } from "lucide-react";

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

const MENU_SECTIONS = [
  {
    title: "Institute",
    links: [
      { label: "About RGUKT", path: "/institute/aboutrgukt" },
      { label: "Campus Life", path: "/institute/campuslife" },
      { label: "Education System", path: "/institute/edusys" },
      { label: "Governing Council", path: "/institute/govcouncil" },
      { label: "RTI Information", path: "/institute/rtiinfo" },
      { label: "SC/ST Cell", path: "/institute/scst" },
    ],
  },
  {
    title: "Academics",
    links: [
      { label: "Academic Programs", path: "/academics/AcademicPrograms" },
      { label: "Academic Calendar", path: "/academics/AcademicCalender" },
      { label: "Academic Regulations", path: "/academics/AcademicRegulations" },
      { label: "Curricula", path: "/academics/curicula" },
    ],
  },
  {
    title: "Departments",
    links: [
      "CSE", "CIVIL", "ECE", "EEE", "ME",
      "MATHEMATICS", "PHYSICS", "CHEMISTRY",
      "IT", "BIOLOGY", "ENGLISH", "LIB",
      "MANAGEMENT", "PED", "TELUGU", "YOGA",
    ].map((dept) => ({ label: `${dept}`, path: `/departments/${dept}` })),
  },
  {
    title: "Notifications",
    links: [
      { label: "News & Updates", path: "/notifications/news" },
      { label: "Tenders", path: "/notifications/tenders" },
      { label: "Careers", path: "/notifications/careers" },
    ],
  },
];

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };
    if (isSearchOpen || isMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isSearchOpen, isMenuOpen]);

  const filteredResults = SEARCH_DIRECTORY.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
        <div className="w-full max-w-[90rem] mx-auto px-5 sm:px-8 lg:px-12 flex h-[64px] items-center justify-between">

          {/* Wordmark */}
          <Link to="/" className="flex items-center shrink-0 gap-3 group">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT Ongole Campus"
              className="h-10 md:h-11 object-contain mix-blend-multiply"
            />
            <div className="hidden sm:flex flex-col justify-center">
              <span className="font-serif text-[1.35rem] md:text-[1.5rem] font-semibold text-[#061B33] tracking-tight leading-none">
                RGUKT
              </span>
              <span className="mt-1 text-[10px] md:text-[11px] font-medium text-[#0A2540] tracking-[0.14em] uppercase">
                Ongole Campus
              </span>
            </div>
          </Link>

          {/* Search + Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <a
              href="https://uniz.rguktong.in/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center h-9 px-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#061B33] hover:text-[#0A2540] hover:bg-slate-100 rounded-[4px] transition-colors"
            >
              Developers
            </a>
            <a
              href="https://uniz.rguktong.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 bg-[#0A2540] hover:bg-[#061B33] text-white text-[12px] font-bold uppercase tracking-[0.08em] rounded-[4px] transition-colors"
            >
              <span>UniZ Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
              aria-label="Search"
              className="w-10 h-10 flex items-center justify-center text-[#061B33] hover:text-[#0A2540] transition-colors"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>
            <button
              onClick={() => { setIsMenuOpen(true); setIsSearchOpen(false); }}
              aria-label="Open menu"
              className="flex items-center gap-2 h-10 px-2 sm:px-3 text-[#061B33] hover:text-[#0A2540] transition-colors"
            >
              <span className="hidden sm:inline text-[13px] font-medium tracking-wide uppercase">Menu</span>
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu panel */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#061B33] text-white overflow-y-auto">
          <div className="max-w-[90rem] mx-auto px-5 sm:px-8 lg:px-12 py-5 flex items-center justify-between border-b border-white/10">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="font-serif text-xl font-semibold tracking-tight"
            >
              RGUKT Ongole
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="max-w-[90rem] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
            <div className="mb-10">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="font-serif text-3xl sm:text-4xl text-white hover:text-white/80 transition-colors"
              >
                Home
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
              {MENU_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-5">
                    {section.title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {section.links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-[15px] sm:text-base text-white/85 hover:text-white underline-offset-[0.22em] hover:underline transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-[#061B33]/50 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-28 px-4">
          <div
            className="absolute inset-0"
            onClick={() => setIsSearchOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-white overflow-hidden flex flex-col shadow-2xl">
            <div className="relative flex items-center border-b border-slate-200 px-5 py-4">
              <Search className="w-5 h-5 text-[#0A2540]" />
              <input
                autoFocus
                type="text"
                placeholder="Search campus directory…"
                className="flex-1 bg-transparent border-none outline-none px-4 text-slate-800 text-lg placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {searchQuery.trim() === "" ? (
                <div className="px-4 py-10 text-center text-slate-500">
                  <p className="text-base">Search departments, academics, or notifications.</p>
                  <p className="text-sm mt-2 text-slate-400">Try “CSE”, “Library”, or “Tenders”.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-10 text-center text-slate-500">
                  <p className="text-base">No results for “{searchQuery}”.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(item.path, { state: (item as any).state });
                      }}
                      className="flex items-center justify-between w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="block text-slate-900 font-medium group-hover:text-[#0A2540] transition-colors">
                          {item.title}
                        </span>
                        <span className="block text-xs tracking-wider uppercase text-slate-400 mt-0.5">
                          {item.category}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0A2540] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
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
