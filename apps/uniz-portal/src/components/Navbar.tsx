import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ExternalLink, Download, Smartphone } from "lucide-react";
import { useIsAuth } from "../hooks/is_authenticated";
import { UNIZ_APK_PATH, openIosDownloadModal } from "../constants/downloads";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuth = isAuthenticated.is_authenticated;
  const dashboardPath = isAuthenticated.type === "admin" ? "/admin" : "/student";

  const handleAnchorClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${hash}`);
      return;
    }
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full font-sans shadow-[0_1px_3px_rgba(6,21,39,0.12)]">
      {/* Tier 1: Harvard/MIT-style Slim Institutional Utility Bar */}
      <div className="bg-[#061527] text-white/80 border-b border-white/10">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 text-[11.5px] tracking-[0.03em]">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white/95 tracking-[0.04em]">
              RGUKT ONGOLE
            </span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="hidden sm:inline text-white/75">
              Rajiv Gandhi University of Knowledge Technologies, Andhra Pradesh
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <a
              href="https://rguktong.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-white/75 hover:text-white transition-colors"
            >
              Main University Site
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <span className="hidden md:inline text-white/20">|</span>
            <a
              href={UNIZ_APK_PATH}
              download="uniz-android.apk"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors"
              title="Download Official UniZ Android App (.apk)"
            >
              <Download className="w-3 h-3 opacity-80" />
              <span>Android App</span>
            </a>
            <button
              type="button"
              onClick={() => openIosDownloadModal()}
              className="inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Install Official UniZ iOS App"
            >
              <Smartphone className="w-3 h-3 opacity-80" />
              <span>iOS App</span>
            </button>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link
              to="/developers"
              className="hidden sm:inline text-white/80 hover:text-white transition-colors"
            >
              Software Development Cell
            </Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <Link
              to="/admin/signin"
              className="text-white/85 hover:text-white font-medium transition-colors"
            >
              Faculty &amp; Staff
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 2: Primary Institutional Masthead */}
      <div className="bg-[#0A2540] text-white border-b border-[#163A5C]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3.5 text-white no-underline group"
          >
            <img
              src="/logo.png"
              alt="RGUKT Ongole UniZ Seal"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/25 bg-[#061527]"
              decoding="async"
            />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[21px] font-bold tracking-[0.03em] text-white leading-none">
                  uniZ
                </span>
                <span className="hidden sm:inline text-white/30 font-light">|</span>
                <span className="hidden sm:inline text-[13px] font-medium tracking-[0.02em] text-white/90 leading-none">
                  Academic &amp; Examination Portal
                </span>
              </div>
              <span className="text-[10.5px] tracking-[0.08em] uppercase text-white/65 mt-1 leading-none">
                Office of the Controller of Examinations · Ongole Campus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary Institutional Navigation"
            className="hidden lg:flex items-center gap-7"
          >
            <button
              type="button"
              onClick={() => handleAnchorClick("#academic-services")}
              className="text-[13.5px] font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
            >
              Academic Services
            </button>
            <button
              type="button"
              onClick={() => handleAnchorClick("#campus-updates")}
              className="text-[13.5px] font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
            >
              Circulars &amp; Notices
            </button>
            <button
              type="button"
              onClick={() => handleAnchorClick("#mobile-apps")}
              className="text-[13.5px] font-medium text-white/85 hover:text-white transition-colors cursor-pointer"
            >
              Mobile Access
            </button>
            <Link
              to="/developers"
              className={`text-[13.5px] font-medium transition-colors ${
                location.pathname === "/developers"
                  ? "text-white underline underline-offset-8 decoration-2"
                  : "text-white/85 hover:text-white"
              }`}
            >
              Developers
            </Link>

            <div className="h-5 w-px bg-white/15" />

            <button
              type="button"
              onClick={() => navigate(isAuth ? dashboardPath : "/student/signin")}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-[2px] bg-white text-[#0A2540] hover:bg-[#F1F5F9] text-[13px] font-bold tracking-[0.03em] transition-colors cursor-pointer shadow-xs"
            >
              <span>{isAuth ? "Open Portal" : "Sign In to Portal"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>

          {/* Mobile Compact Actions */}
          <div className="flex lg:hidden items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(isAuth ? dashboardPath : "/student/signin")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[2px] bg-white text-[#0A2540] text-[12px] font-bold tracking-[0.03em]"
            >
              <span>{isAuth ? "Portal" : "Sign In"}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle institutional navigation menu"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[2px] border border-white/20 text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#061527] border-t border-white/15 px-4 py-4 space-y-3">
            <div className="grid grid-cols-1 gap-1 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => handleAnchorClick("#academic-services")}
                className="text-left py-2 px-2 text-[14px] font-medium text-white/90 hover:bg-white/5 rounded-[2px]"
              >
                Academic Services Directory
              </button>
              <button
                type="button"
                onClick={() => handleAnchorClick("#campus-updates")}
                className="text-left py-2 px-2 text-[14px] font-medium text-white/90 hover:bg-white/5 rounded-[2px]"
              >
                Official Circulars &amp; Notices
              </button>
              <Link
                to="/developers"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-2 text-[14px] font-medium text-white/90 hover:bg-white/5 rounded-[2px]"
              >
                Software Development Cell (Developers)
              </Link>
              <Link
                to="/admin/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-2 text-[14px] font-medium text-white/90 hover:bg-white/5 rounded-[2px]"
              >
                Faculty &amp; Administration Sign In
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={UNIZ_APK_PATH}
                download="uniz-android.apk"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[2px] border border-white/25 bg-white/5 text-white text-[12px] font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Android App (.apk)
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openIosDownloadModal();
                }}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[2px] border border-white/25 bg-white/5 text-white text-[12px] font-semibold"
              >
                <Smartphone className="w-3.5 h-3.5" />
                iOS App
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
