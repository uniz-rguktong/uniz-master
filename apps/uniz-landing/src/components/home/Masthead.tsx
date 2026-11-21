import { Link } from "react-router-dom";
import { buttonVariants } from "../ui/button-variants";
import { Wrap } from "../layout/Wrap";
import { portalPath } from "@/lib/portal";
import { officialHome } from "@/data/official";
import { CampusCarousel } from "./CampusCarousel";

export function Masthead() {
  return (
    <Wrap>
      <div className="grid items-center gap-8 py-10 min-[821px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[821px]:gap-16 min-[821px]:py-16">
        <div className="min-w-0">
          <p className="text-[15px] leading-[22px] text-text-2">Ongole Campus · IIIT Ongole</p>
          <h1 className="u-display mt-3 max-w-[16ch] text-head">
            Rajiv Gandhi University of Knowledge Technologies
          </h1>
          <p className="u-lede mt-4 max-w-[36ch] text-text-2">{officialHome.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 min-[640px]:flex-row">
            <a
              href={portalPath("/student/signin")}
              className={buttonVariants({ variant: "primary", size: "hero" })}
            >
              Sign in
            </a>
            <Link to="/admissions" className={buttonVariants({ variant: "outline", size: "hero" })}>
              Admissions
            </Link>
          </div>
        </div>
        <CampusCarousel />
      </div>
    </Wrap>
  );
}
