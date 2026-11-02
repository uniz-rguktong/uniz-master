import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ExternalLink, Download, Smartphone } from "lucide-react";
import { useIsAuth } from "../hooks/is_authenticated";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";

const NAV_LINKS = [
  { label: "Academic services", hash: "#academic-services" },
  { label: "Circulars", hash: "#campus-updates" },
  { label: "Mobile access", hash: "#mobile-apps" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuth = isAuthenticated.is_authenticated;
  const dashboardPath = isAuthenticated.type === "admin" ? "/admin" : "/student";

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleAnchorClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${hash}`);
      return;
    }
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const goPortal = () => navigate(isAuth ? dashboardPath : "/student/signin");

  return (
 <header className="sticky top-0 z-50 w-full border-b border-line bg-white">
 <div className="border-b border-white/10 bg-navy-850 text-white/80">
 <div className="mx-auto flex h-8 w-full max-w-[90rem] items-center justify-between px-5 text-[11.5px] tracking-[0.03em] sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-2 truncate">
 <span className="font-semibold text-white/95">RGUKT ANDHRA PRADESH</span>
 <span className="hidden text-white/30 sm:inline">·</span>
 <span className="hidden text-white/75 sm:inline">
              Catering to the Educational Needs of Gifted Rural Youth
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <a
              href="https://rguktong.in"
              target="_blank"
              rel="noopener noreferrer"
 className="hidden items-center gap-1 text-white/80 transition-colors duration-150 hover:text-white md:inline-flex"
            >
              Main site
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
            <a
              href={UNIZ_APK_PATH}
              download="uniz-android.apk"
 className="inline-flex items-center gap-1 text-white/85 transition-colors duration-150 hover:text-white"
            >
              <Download className="h-3 w-3 opacity-80" />
              Android App
            </a>
            <button
              type="button"
              onClick={() => openIosDownloadModal()}
 className="inline-flex cursor-pointer items-center gap-1 text-white/85 transition-colors duration-150 hover:text-white"
            >
              <Smartphone className="h-3 w-3 opacity-80" />
              iOS App
            </button>
            <Link
              to="/developers"
 className="hidden text-white/85 transition-colors duration-150 hover:text-white sm:inline"
            >
              Software Development Cell
            </Link>
          </div>
        </div>
      </div>

 <div className="mx-auto flex h-[68px] w-full max-w-[90rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <img
            src="/rgukt-logo.png"
            alt="RGUKT Ongole"
            className="h-10 w-10 object-contain md:h-11 md:w-11"
          />
          <div className="hidden flex-col justify-center sm:flex">
 <span className="font-serif text-[1.35rem] font-semibold leading-none tracking-tight text-navy-900 md:text-[1.5rem]">
              uniZ
            </span>
 <span className="mt-1 text-[11px] font-medium text-ink-muted md:text-xs">
              Ongole campus portal
            </span>
          </div>
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((item) => (
            <button
              key={item.hash}
              type="button"
              onClick={() => handleAnchorClick(item.hash)}
 className="inline-flex h-10 cursor-pointer items-center rounded-md px-3.5 text-[15px] font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2 hover:text-navy"
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/developers"
 className={`inline-flex h-10 items-center rounded-md px-3.5 text-[15px] font-medium transition-colors duration-150 hover:bg-surface-2 ${
 location.pathname === "/developers"
 ? "bg-surface-2 text-navy"
 : "text-navy-900 hover:text-navy"
 }`}
          >
            Developers
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            to="/admin/signin"
 className="hidden h-10 items-center rounded-md px-3 text-[14px] font-medium text-navy-900 transition-colors duration-150 hover:bg-surface-2 hover:text-navy xl:inline-flex"
          >
            Faculty & staff
          </Link>
          <button
            type="button"
            onClick={goPortal}
 className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-red px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#C81A20]"
          >
            <span>{isAuth ? "Open portal" : "Sign in"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
 className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-navy-900 transition-colors duration-150 hover:bg-surface-2 lg:hidden"
          >
            <Menu className="h-5 w-5 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
 <div className="fixed inset-0 z-[100] overflow-y-auto bg-navy-950 text-white">
 <div className="mx-auto flex max-w-[90rem] items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
 <span className="font-serif text-xl font-semibold tracking-tight">uniZ</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
 className="flex h-10 w-10 items-center justify-center text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
 <nav className="mx-auto flex max-w-[90rem] flex-col gap-1 px-5 py-10 sm:px-8 lg:px-12">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/");
              }}
 className="py-3 text-left font-serif text-3xl text-white"
            >
              Home
            </button>
            {NAV_LINKS.map((item) => (
              <button
                key={item.hash}
                type="button"
                onClick={() => handleAnchorClick(item.hash)}
 className="py-3 text-left text-[17px] text-white/85 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/developers"
              onClick={() => setMobileMenuOpen(false)}
 className="py-3 text-[17px] text-white/85 hover:text-white"
            >
              Developers
            </Link>
            <Link
              to="/admin/signin"
              onClick={() => setMobileMenuOpen(false)}
 className="py-3 text-[17px] text-white/85 hover:text-white"
            >
              Faculty & staff
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                goPortal();
              }}
 className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-brand-red px-5 text-sm font-medium text-white"
            >
              {isAuth ? "Open portal" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
