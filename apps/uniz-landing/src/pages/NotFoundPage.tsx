import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";
import { CampusIllustration } from "../components/home/CampusIllustration";
import { buttonVariants } from "../components/ui/button-variants";

export function NotFoundPage() {
  usePageTitle("Page not found · RGUKT Ongole");
  return (
    <div className="mx-auto flex w-full max-w-[1232px] flex-col items-center px-5 py-16 text-center min-[821px]:px-10 min-[821px]:py-24">
      <div className="h-64 w-[280px] overflow-hidden rounded-hero bg-tint-2 dark:border dark:border-border" aria-hidden="true">
        <CampusIllustration />
      </div>
      <h1 className="mt-8 font-serif text-[28px] font-normal leading-9 tracking-[-0.01em] text-head">Page not found</h1>
      <p className="mt-3 text-[15px] leading-6 text-text-2">404</p>
      <Link to="/" className={`${buttonVariants({ variant: "primary", size: "default" })} mt-8`}>
        Go back home
      </Link>
    </div>
  );
}
