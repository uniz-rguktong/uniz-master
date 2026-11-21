import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "../ui/button-variants";
import { Wrap } from "../layout/Wrap";
import { PORTAL_URL } from "@/lib/portal";
import { officialHome } from "@/data/official";
import { CampusCarousel } from "./CampusCarousel";
import { cn } from "@/lib/utils";

export function Masthead() {
  return (
    <Wrap>
      <div className="grid items-center gap-10 py-10 pb-14 min-[821px]:grid-cols-[minmax(0,1fr)_520px] min-[821px]:gap-20 min-[821px]:py-[88px] min-[821px]:pb-[104px]">
        <div className="min-w-0">
          <p className="text-[15px] leading-[22px] text-text-2">
            Ongole Campus
          </p>
          <h1 className="u-display mt-[14px] mb-[18px] max-w-[600px] text-head min-[821px]:mt-5 min-[821px]:mb-6">
            Rajiv Gandhi University of Knowledge Technologies
          </h1>
          <p className="u-lede mb-7 max-w-[500px] text-text-2 min-[821px]:mb-10">
            {officialHome.tagline}
          </p>
          <div className="flex flex-col gap-3 min-[640px]:flex-row">
            <a
              href={PORTAL_URL}
              className={cn(buttonVariants({ variant: "primary", size: "hero" }), "w-full min-[821px]:w-auto")}
            >
              Student Portal
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </a>
            <Link to="/admissions" className={cn(buttonVariants({ variant: "outline", size: "hero" }), "w-full min-[821px]:w-auto")}>
              Admissions
            </Link>
          </div>
        </div>
        <div className="h-[300px] overflow-hidden rounded-xl bg-tint-2 min-[821px]:h-[480px] min-[821px]:rounded-hero">
          <CampusCarousel />
        </div>
      </div>
    </Wrap>
  );
}
