import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { Lockup } from "../brand/Lockup";
import { portalPath } from "@/lib/portal";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

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

const iconButton =
  "focus-chrome inline-flex h-11 w-11 items-center justify-center rounded-full text-white min-[640px]:h-10 min-[640px]:w-10";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const menuOpen = menuSection !== null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setMenuSection(null);
      }
    };
    if (isSearchOpen || menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isSearchOpen, menuOpen]);

  const filteredResults = SEARCH_DIRECTORY.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = menuSection === "all"
    ? MENU_SECTIONS
    : MENU_SECTIONS.filter((section) => section.title === menuSection);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-sb-border bg-navy-900 text-white">
        <div className="mx-auto flex h-[60px] w-full max-w-[1232px] items-center gap-3 px-5 min-[821px]:h-16 min-[821px]:px-10">
          <Link to="/" className="focus-chrome inline-flex min-w-0 items-center gap-3 text-white">
            <Lockup mark={32} word={20} />
            <span className="hidden h-5 w-px shrink-0 bg-navy-700 min-[821px]:block" aria-hidden="true" />
            <span className="hidden whitespace-nowrap text-[13px] font-medium leading-[18px] text-navy-300 min-[821px]:block">
              RGUKT Ongole
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-6 hidden items-center gap-7 min-[821px]:flex">
            {MENU_SECTIONS.map((section) => (
              <button
                key={section.title}
                type="button"
                className={cn(
                  "focus-chrome text-[14px] font-medium leading-5 text-chrome-link",
                  menuSection === section.title && "text-white",
                )}
                aria-expanded={menuSection === section.title}
                onClick={() => {
                  setIsSearchOpen(false);
                  setMenuSection((current) => (current === section.title ? null : section.title));
                }}
              >
                {section.title === "Notifications" ? "Notices" : section.title}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className={cn(iconButton, "hidden min-[821px]:inline-flex")}
            >
              {dark ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={() => { setIsSearchOpen(true); setMenuSection(null); }}
              aria-label="Search"
              className={iconButton}
            >
              <Search size={20} strokeWidth={1.75} />
            </button>
            <a
              href={portalPath("/student/signin")}
              className="focus-chrome inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold leading-5 text-navy-900 min-[640px]:h-[38px]"
            >
              Sign in
            </a>
            <button
              type="button"
              onClick={() => { setMenuSection("all"); setIsSearchOpen(false); }}
              aria-label="Open menu"
              className={cn(iconButton, "min-[821px]:hidden")}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[var(--overlay)] px-4 py-4 min-[821px]:px-10 min-[821px]:pt-20"
          onClick={() => setMenuSection(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={menuSection === "all" ? "Menu" : `${menuSection} menu`}
            className="menu-in relative z-10 w-full max-w-[1232px] animate-[menu-in_200ms_ease-out_both] rounded-xl border border-border bg-panel p-6 text-text shadow-lg motion-reduce:animate-none min-[821px]:p-8 dark:shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-[15px] font-medium leading-6 text-head">
                {menuSection === "all" ? "Menu" : menuSection}
              </p>
              <button
                type="button"
                onClick={() => setMenuSection(null)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-2 hover:bg-tint-2"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className={cn("grid gap-8", sections.length > 1 && "min-[821px]:grid-cols-2")}>
              {menuSection === "all" && (
                <div className="min-[821px]:col-span-2">
                  <Link to="/" onClick={() => setMenuSection(null)} className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link">
                    Home
                  </Link>
                </div>
              )}
              {sections.map((section) => (
                <div key={section.title}>
                  {menuSection === "all" && (
                    <h2 className="mb-2 text-[15px] font-semibold leading-6 text-head">{section.title}</h2>
                  )}
                  <ul className="grid grid-cols-1 gap-x-8 min-[640px]:grid-cols-2">
                    {section.links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          onClick={() => setMenuSection(null)}
                          className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 min-[821px]:hidden">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium leading-5 text-text-2"
              >
                {dark ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
                {dark ? "Light theme" : "Dark theme"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-[var(--overlay)] px-4 pt-16 min-[821px]:pt-28"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="menu-in relative z-10 flex w-full max-w-[640px] animate-[menu-in_200ms_ease-out_both] flex-col overflow-hidden rounded-xl border border-border bg-surface text-text shadow-lg motion-reduce:animate-none dark:shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <label htmlFor="site-search" className="text-[14px] font-medium leading-5 text-text">
                Search
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Search className="shrink-0 text-text-3" size={18} strokeWidth={1.75} aria-hidden="true" />
                <input
                  id="site-search"
                  autoFocus
                  type="text"
                  placeholder="Search campus directory…"
                  className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-[15px] leading-6 text-text placeholder:text-text-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-2 hover:bg-tint-2"
                  aria-label="Close search"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
              {searchQuery.trim() === "" ? (
                <div className="px-4 py-10 text-center text-text-3">
                  <p className="text-[15px] leading-6">Search departments, academics, or notifications.</p>
                  <p className="mt-2 text-[13px] leading-[18px]">Try “CSE”, “Library”, or “Tenders”.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-10 text-center text-text-2">
                  <p className="text-[15px] leading-6">No results for “{searchQuery}”.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(item.path);
                      }}
                      className="flex min-h-11 w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-0 hover:bg-tint-2"
                    >
                      <span>
                        <span className="block text-[15px] font-medium leading-6 text-text">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-[18px] text-text-3">
                          {item.category}
                        </span>
                      </span>
                      <ArrowRight className="hidden shrink-0 text-accent sm:block" size={16} strokeWidth={1.75} aria-hidden="true" />
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
