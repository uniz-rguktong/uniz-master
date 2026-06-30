import { Link } from "react-router-dom";

export function SiteLegalFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-zinc-500">
        <p>© {new Date().getFullYear()} uniZ · Campus platform</p>
        <nav className="flex items-center gap-5">
          <Link
            to="/privacy"
            className="font-medium hover:text-zinc-900 transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/developers"
            className="font-medium hover:text-zinc-900 transition-colors"
          >
            Developers
          </Link>
        </nav>
      </div>
    </footer>
  );
}
