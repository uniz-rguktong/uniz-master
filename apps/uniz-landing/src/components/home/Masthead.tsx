import { ArrowRight } from "lucide-react";
import { buttonVariants } from "../ui/button-variants";
import { CampusIllustration } from "./CampusIllustration";
import { Wrap } from "../layout/Wrap";
import { SHOW_OUTPASS, portalPath } from "@/lib/portal";
import { cn } from "@/lib/utils";

const LEDE = SHOW_OUTPASS
  ? "Results, attendance, outpasses, registration and notices for students, faculty and administrators."
  : "Results, attendance, registration and notices for students, faculty and administrators.";

export function Masthead() {
  return (
    <Wrap>
      <div className="grid items-center gap-10 py-10 pb-14 min-[821px]:grid-cols-[minmax(0,1fr)_520px] min-[821px]:gap-20 min-[821px]:py-[88px] min-[821px]:pb-[104px]">
        <div className="min-w-0">
          <p className="text-[15px] leading-[22px] text-text-2">
            Rajiv Gandhi University of Knowledge Technologies, Ongole
          </p>
          <h1 className="u-display mt-[14px] mb-[18px] max-w-[600px] text-head min-[821px]:mt-5 min-[821px]:mb-6">
            Sign in to UniZ, the campus portal.
          </h1>
          <p className="u-lede mb-7 max-w-[500px] text-text-2 min-[821px]:mb-10">
            {LEDE}
          </p>
          <a
            href={portalPath("/student/signin")}
            className={cn(buttonVariants({ variant: "primary", size: "hero" }), "w-full min-[821px]:w-auto")}
          >
            Sign in
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>
        <div className="h-[300px] overflow-hidden rounded-xl bg-tint-2 min-[821px]:h-[480px] min-[821px]:rounded-hero dark:border dark:border-border">
          <CampusIllustration />
        </div>
      </div>
    </Wrap>
  );
}
