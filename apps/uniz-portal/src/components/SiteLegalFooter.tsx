import { Link } from "react-router-dom";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { Code2 } from "lucide-react";

export function SiteLegalFooter() {
  return (
    <footer className="border-t border-navy-200/80 bg-[#EEEEEE] font-form text-[13px] font-bold tracking-[0.5px] text-[#061B33]">
      <div className="mx-auto flex min-h-[56px] max-w-[1280px] flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-0">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="UniZ"
            className="h-6 w-6 shrink-0 rounded-full bg-white object-contain ring-1 ring-[#0A2540]/15 shadow-sm"
          />
          <p className="truncate uppercase text-[12px] sm:text-[13px]">
            Copyright © {UNIZ_CAMPUS_LABEL}
          </p>
        </div>

        <Link
          to="/developers"
          className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#0A2540] hover:underline"
        >
          <Code2 size={14} className="shrink-0" />
          <span>Developed By Software Development Cell</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-4 sm:gap-5 text-[12px] sm:text-[13px]">
          <Link
            to="/student/signin"
            className="font-bold uppercase tracking-[0.5px] text-[#061B33] hover:underline"
          >
            Login
          </Link>
          <Link
            to="/developers"
            className="font-bold uppercase tracking-[0.5px] text-[#061B33] hover:underline"
          >
            Developers
          </Link>
          <Link
            to="/privacy"
            className="font-bold uppercase tracking-[0.5px] text-[#061B33] hover:underline"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
