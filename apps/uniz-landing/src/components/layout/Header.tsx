import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import { Lockup } from "../brand/Lockup";
import { portalPath } from "@/lib/portal";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, searchDirectory } from "@/data/nav";
import { officialHome } from "@/data/official";

const DIRECTORY = searchDirectory();

const iconButton =
  "focus-chrome inline-flex h-11 w-11 items-center justify-center rounded-full text-white min-[640px]:h-10 min-[640px]:w-10";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [chrome, setChrome] = useState<{ path: string; section: string | null; mobile: boolean; search: boolean }>({
    path: "",
    section: null,
    mobile: false,
    search: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const searchId = useId();
  const onThisPage = chrome.path === location.pathname;
  const menuSection = onThisPage ? chrome.section : null;
  const mobileOpen = onThisPage ? chrome.mobile : false;
  const isSearchOpen = onThisPage ? chrome.search : false;

  const setMenuSection = (section: string | null) => {
    setChrome({ path: location.pathname, section, mobile: false, search: false });
  };
  const setMobileOpen = (mobile: boolean) => {
    setChrome({ path: location.pathname, section: null, mobile, search: false });
  };
  const setIsSearchOpen = (search: boolean) => {
    setChrome({ path: location.pathname, section: null, mobile: false, search });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChrome((current) => ({ ...current, section: null, mobile: false, search: false }));
      }
    };
    const locked = isSearchOpen || mobileOpen || menuSection !== null;
    if (locked) document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = mobileOpen || isSearchOpen ? "hidden" : "auto";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isSearchOpen, menuSection, mobileOpen]);

  const filteredResults = DIRECTORY.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-navy-900 text-white">
        <div className="border-b border-navy-800">
          <div className="mx-auto flex h-9 w-full max-w-[1232px] items-center justify-end gap-4 overflow-x-auto px-5 min-[821px]:px-10">
            <span className="mr-auto text-[12px] leading-4 text-navy-300">Other campuses</span>
            {officialHome.campuses.map((campus) => (
              <a
                key={campus.href}
                href={campus.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-chrome shrink-0 text-[12px] leading-4 text-chrome-link hover:underline"
              >
                {campus.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto flex h-[60px] w-full max-w-[1232px] items-center gap-3 px-5 min-[821px]:h-16 min-[821px]:px-10">
          <Link to="/" className="focus-chrome inline-flex min-w-0 items-center gap-3 text-white">
            <Lockup mark={32} word={20} />
            <span className="hidden h-5 w-px shrink-0 bg-navy-700 min-[821px]:block" aria-hidden="true" />
            <span className="hidden whitespace-nowrap text-[13px] font-medium leading-[18px] text-navy-300 min-[821px]:block">
              RGUKT Ongole
            </span>
          </Link>

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
              onClick={() => setIsSearchOpen(true)}
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
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className={cn(iconButton, "min-[1100px]:hidden")}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <nav aria-label="Primary" className="hidden border-t border-navy-800 min-[1100px]:block">
          <div className="mx-auto flex w-full max-w-[1232px] flex-wrap items-center gap-1 px-5 min-[821px]:px-8">
            {PRIMARY_NAV.map((item) => {
              if (!item.children) {
                return (
                  <Link
                    key={item.label}
                    to={item.to || "/"}
                    className="focus-chrome inline-flex h-11 items-center px-2.5 text-[14px] font-medium leading-5 text-chrome-link hover:text-white"
                  >
                    {item.label}
                  </Link>
                );
              }
              const open = menuSection === item.label;
              return (
                <div key={item.label} className="relative">
                  <button
                    type="button"
                    className={cn(
                      "focus-chrome inline-flex h-11 items-center gap-1 px-2.5 text-[14px] font-medium leading-5 text-chrome-link hover:text-white",
                      open && "text-white",
                    )}
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setMenuSection(open ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" className={cn(open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="absolute left-0 top-full z-40 mt-1 min-w-64 rounded-xl border border-border bg-panel p-2 text-text shadow-md">
                      <ul>
                        {item.children.map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="flex min-h-11 items-center rounded-lg px-3 text-[15px] leading-6 text-link hover:bg-tint-2 hover:underline"
                              onClick={() => setMenuSection(null)}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </header>

      {menuSection && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 hidden cursor-default bg-transparent min-[1100px]:block"
          onClick={() => setMenuSection(null)}
        />
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto bg-[var(--overlay)] px-4 py-4 min-[1100px]:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="menu-in relative z-10 w-full animate-[menu-in_200ms_ease-out_both] rounded-xl border border-border bg-panel p-4 text-text shadow-lg motion-reduce:animate-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[15px] font-medium leading-6 text-head">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-2 hover:bg-tint-2"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <nav aria-label="Mobile">
              {PRIMARY_NAV.map((item) =>
                item.children ? (
                  <details key={item.label} className="border-t border-border">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[15px] font-medium leading-6 text-head [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <ul className="pb-2">
                      {item.children.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={() => setMobileOpen(false)}
                            className="inline-flex min-h-11 items-center pl-3 text-[15px] leading-6 text-link hover:underline"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to || "/"}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center border-t border-border text-[15px] font-medium leading-6 text-head"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
            <div className="mt-3 border-t border-border pt-3">
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
