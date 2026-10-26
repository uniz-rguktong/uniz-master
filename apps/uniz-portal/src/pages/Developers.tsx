import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SEO } from "../components/SEO";
import { SiteLegalFooter } from "../components/SiteLegalFooter";
import MeetTheDevelopersSection from "../components/MeetTheDevelopersSection";
import {
  LandingDivider,
  LandingMeshBackdrop,
} from "../components/ui/landing-section";
import { cn } from "@/lib/utils";

const GlobeFeature = lazy(() => import("../components/ui/globe-feature-section"));

function GlobeSectionSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      <div
        className={cn(
          "h-72 w-full animate-pulse rounded-[2px] border border-navy-100 bg-navy-50/60",
        )}
      />
    </div>
  );
}

export default function Developers() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-navy-900 font-sans selection:bg-navy-100">
      <SEO
        title="Developers | UniZ"
        description="Meet the student engineers and creators behind the UniZ contributor platform for RGUKT Ongole."
        canonical="/developers"
      />

      <LandingMeshBackdrop />

      <div className="relative z-10 w-full pt-20 md:pt-24">
        <div className="max-w-[1280px] mx-auto px-6 pt-2 pb-2 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[4px] border border-navy-200 bg-white px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#0A2540] hover:bg-navy-50 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/student/signin"
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0A2540] px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#061B33] transition-colors"
          >
            <span>Student &amp; Staff Login</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <MeetTheDevelopersSection />

        <LandingDivider />

        <Suspense fallback={<GlobeSectionSkeleton />}>
          <GlobeFeature hideTitleOnMobile />
        </Suspense>
      </div>

      <SiteLegalFooter />
    </div>
  );
}
