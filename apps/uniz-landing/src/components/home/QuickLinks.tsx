import { Link } from "react-router-dom";
import { QUICK_LINKS } from "@/data/nav";
import { Wrap } from "../layout/Wrap";

export function QuickLinks() {
  return (
    <Wrap>
      <nav className="mt-10" aria-label="Quick links">
        <h2 className="text-[15px] font-semibold leading-6 text-head">Quick links</h2>
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {QUICK_LINKS.map((link) => (
            <li key={link.to + link.label} className="shrink-0">
              <Link
                to={link.to}
                className="inline-flex h-11 items-center rounded-full border border-border-strong px-4 text-[14px] font-medium leading-5 text-head hover:bg-tint-2"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Wrap>
  );
}
