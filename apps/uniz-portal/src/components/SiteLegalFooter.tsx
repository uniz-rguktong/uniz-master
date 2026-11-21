import { Link } from "react-router-dom";

export function SiteLegalFooter() {
  return (
    <footer className="bg-bg">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-2 px-4 py-4 text-small leading-[18px] text-text-2 min-[821px]:flex-row min-[821px]:items-center min-[821px]:justify-between min-[821px]:px-10">
        <p>© {new Date().getFullYear()} uniZ · Campus platform</p>
        <nav className="flex items-center gap-5">
          <Link to="/privacy" className="text-link underline-offset-[1px] hover:underline">
            Privacy
          </Link>
          <Link to="/developers" className="text-link underline-offset-[1px] hover:underline">
            Developers
          </Link>
        </nav>
      </div>
    </footer>
  );
}
