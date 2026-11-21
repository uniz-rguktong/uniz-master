import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, searchDirectory } from "@/data/nav";

const DIRECTORY = searchDirectory();

const iconButton =
  "focus-chrome inline-flex h-11 w-11 items-center justify-center rounded-full text-white min-[640px]:h-10 min-[640px]:w-10";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chrome, setChrome] = useState<{ path: string; section: string | null; search: boolean }>({
    path: "",
    section: null,
    search: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const searchId = useId();
  const onThisPage = chrome.path === location.pathname;
  const menuSection = onThisPage ? chrome.section : null;
  const isSearchOpen = onThisPage ? chrome.search : false;
  const menuOpen = menuSection !== null;

  // Each opener writes the whole chrome record once. Calling both setters in one
  // click lets the last write win and the panel never opens.
  const setMenuSection = (section: string | null) => {
    setChrome({ path: location.pathname, section, search: false });
  };
  const setIsSearchOpen = (search: boolean) => {
    setChrome({ path: location.pathname, section: null, search });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChrome((current) => ({ ...current, section: null, search: false }));
      }
    };
    if (isSearchOpen || menuOpen) document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = isSearchOpen || menuOpen ? "hidden" : "auto";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isSearchOpen, menuOpen]);

  const filteredResults = DIRECTORY.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sections = menuSection === "all"
    ? PRIMARY_NAV.filter((item) => item.children)
    : PRIMARY_NAV.filter((item) => item.label === menuSection);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-sb-border bg-navy-900 text-white">
        <div className="mx-auto flex h-[60px] w-full max-w-[1232px] items-center gap-3 px-5 min-[821px]:h-16 min-[821px]:px-10">
          <Link to="/" className="focus-chrome inline-flex min-w-0 items-center gap-2.5 text-white">
            <img src="/rgukt-logo.png" alt="" width={36} height={42} className="h-9 w-auto" />
            <span className="whitespace-nowrap font-serif text-[16px] font-semibold leading-none tracking-[-0.01em] min-[640px]:text-[20px]">
              RGUKT Ongole
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className={iconButton}
            >
              <Search size={20} strokeWidth={1.75} />
            </button>
            <a
              href={PORTAL_URL}
              className="focus-chrome inline-flex h-11 items-center whitespace-nowrap rounded-full bg-white px-3 text-[12px] font-semibold leading-5 text-navy-900 min-[640px]:h-[38px] min-[640px]:px-4 min-[640px]:text-[14px]"
            >
              Student Portal
            </a>
            <button
              type="button"
              onClick={() => setMenuSection("all")}
              aria-label="Open menu"
              aria-expanded={menuSection === "all"}
              className={cn(iconButton, "min-[1100px]:hidden")}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <nav aria-label="Primary" className="mx-auto hidden w-full max-w-[1232px] flex-wrap items-center gap-x-1 border-t border-navy-800 px-5 min-[1100px]:flex min-[821px]:px-8">
            {PRIMARY_NAV.map((item) => {
              if (!item.children) {
                return (
                  <Link
                    key={item.label}
                    to={item.to || "/"}
                    className="focus-chrome inline-flex h-10 items-center rounded-md px-2 text-[14px] font-medium leading-5 text-chrome-link hover:bg-navy-600 hover:text-white"
                  >
                    {item.label}
                  </Link>
                );
              }
              const open = menuSection === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "focus-chrome inline-flex h-10 items-center rounded-md px-2 text-[14px] font-medium leading-5 text-chrome-link hover:bg-navy-600 hover:text-white",
                    open && "text-white",
                  )}
                  aria-expanded={open}
                  onClick={() => setMenuSection(open ? null : item.label)}
                >
                  {item.label}
                </button>
              );
            })}
        </nav>
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
            className="menu-in relative z-10 w-full max-w-[1232px] animate-[menu-in_200ms_ease-out_both] rounded-xl border border-border bg-panel p-6 text-text shadow-lg motion-reduce:animate-none min-[821px]:p-8"
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
              {menuSection === "all" && PRIMARY_NAV.filter((item) => !item.children).map((item) => (
                <div key={item.label} className="min-[821px]:col-span-2">
                  <Link
                    to={item.to || "/"}
                    onClick={() => setMenuSection(null)}
                    className="inline-flex min-h-11 items-center text-[15px] leading-6 text-link"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              {sections.map((section) => (
                <div key={section.label}>
                  {menuSection === "all" && (
                    <h2 className="mb-2 text-[15px] font-semibold leading-6 text-head">{section.label}</h2>
                  )}
                  <ul className="grid grid-cols-1 gap-x-8 min-[640px]:grid-cols-2">
                    {section.children?.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
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
            className="menu-in relative z-10 flex w-full max-w-[640px] animate-[menu-in_200ms_ease-out_both] flex-col overflow-hidden rounded-xl border border-border bg-surface text-text shadow-lg motion-reduce:animate-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-5 py-4">
              <label htmlFor={searchId} className="text-[14px] font-medium leading-5 text-text">
                Search
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Search className="shrink-0 text-text-3" size={18} strokeWidth={1.75} aria-hidden="true" />
                <input
                  id={searchId}
                  autoFocus
                  type="text"
                  placeholder="Search the campus site…"
                  className="h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-[15px] leading-6 text-text placeholder:text-text-3"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                  <p className="text-[15px] leading-6">Search departments, offices, or notifications.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-10 text-center text-text-2">
                  <p className="text-[15px] leading-6">No results for “{searchQuery}”.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredResults.slice(0, 20).map((item) => (
                    <button
                      key={`${item.category}-${item.path}-${item.title}`}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(item.path);
                      }}
                      className="flex min-h-11 w-full items-center justify-between border-b border-border px-4 py-3 text-left last:border-0 hover:bg-tint-2"
                    >
                      <span>
                        <span className="block text-[15px] font-medium leading-6 text-text">{item.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-[18px] text-text-3">{item.category}</span>
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
