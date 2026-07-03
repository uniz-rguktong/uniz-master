import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MeetTheDevelopersSection from "@/components/MeetTheDevelopersSection";
import GlobeFeature from "@/components/ui/globe-feature-section";
import { LandingMeshBackdrop } from "@/components/ui/landing-section";
import { SEO } from "@/components/SEO";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";
import { landingContainerClass, landingDividerClass } from "@/lib/landing-ui";
import { cn } from "@/lib/utils";

export default function Developers() {
  return (
    <div className="relative min-h-screen bg-white pt-16 font-sans">
      <SEO
        title="Developers — uniZ"
        description="Meet the RGUKT Ongole student team behind the UniZ campus platform."
        canonical="https://uniz.rguktong.in/developers"
      />

      <LandingMeshBackdrop />

      <div className={cn(landingContainerClass, "relative")}>
        <header className="flex items-center py-4 md:py-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-portal-lg px-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </header>

        <MeetTheDevelopersSection
          subtitle="Engineering, design, and security — built by students, for campus."
          compact
          fitScreen
        />

        <div className={cn(landingDividerClass, "my-2 md:my-4")} />

        <section className="pb-2 md:pb-6">
          <div className="mx-auto max-w-3xl px-2 pb-6 pt-4 text-center md:pb-8 md:pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Open source
            </p>
            <h2 className="mt-2 text-[clamp(1.35rem,3vw,1.875rem)] font-semibold leading-snug tracking-tight text-zinc-950">
              Wanna make it here?{" "}
              <span className="font-normal text-zinc-400">
                Contribute to the uniZ ecosystem.
              </span>
            </h2>
          </div>
          <GlobeFeature hideTitleOnMobile />
        </section>
      </div>

      <SiteLegalFooter />
    </div>
  );
}
