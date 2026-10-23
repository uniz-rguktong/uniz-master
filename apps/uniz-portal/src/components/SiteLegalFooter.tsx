import { Link } from "react-router-dom";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

export function SiteLegalFooter() {
  return (
    <footer className="h-[50px] bg-[#EEEEEE] font-form text-[14px] font-bold tracking-[0.5px] text-[#061B33]">
      <div className="mx-auto flex h-full w-[94%] items-center justify-between gap-4">
        <p className="truncate uppercase">
          Copyright © {UNIZ_CAMPUS_LABEL}
        </p>
        <nav className="flex shrink-0 items-center gap-5">
          <Link
            to="/privacy"
            className="font-bold uppercase tracking-[0.5px] text-[#061B33] hover:underline"
          >
            Privacy
          </Link>
          <Link
            to="/developers"
            className="hidden font-bold tracking-[0.5px] text-[#061B33] hover:underline sm:inline"
          >
            Developers
          </Link>
        </nav>
      </div>
    </footer>
  );
}
