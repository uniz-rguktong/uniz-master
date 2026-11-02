import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Page not found · RGUKT Ongole");
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <p className="text-[13px] font-semibold text-crimson">404</p>
      <h1 className="mt-3 font-serif text-5xl text-ink">Page not found</h1>
      <p className="mt-4 text-lg text-ink-muted">That address is not on the Ongole site.</p>
      <Link to="/" className="editorial-link mt-8 inline-block">
        Back to the homepage
      </Link>
    </div>
  );
}
