import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MeetTheDevelopersSection from "@/components/MeetTheDevelopersSection";
import GlobeFeature from "@/components/ui/globe-feature-section";
import { SEO } from "@/components/SEO";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";

export default function Developers() {
  return (
    <div className="min-h-screen bg-white pt-16 font-sans">
      <SEO
        title="Developers — uniZ"
        description="Meet the RGUKT Ongole student team behind the UniZ campus platform."
        canonical="https://uniz.rguktong.in/developers"
      />

      <header className="max-w-7xl mx-auto px-4 py-2 md:px-6 md:py-6 flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <MeetTheDevelopersSection
        subtitle="The minds behind UniZ."
        compact
        fitScreen
      />

      {/* Mobile peek into the contribution section below */}
      <div className="md:hidden border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 text-center">
        <p className="text-[1.05rem] font-semibold tracking-tight text-zinc-900 leading-tight">
          Make your{" "}
          <span className="text-zinc-400">first contribution.</span>
        </p>
      </div>

      <section className="border-t border-zinc-100 bg-zinc-50/40">
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-2 md:pt-16 md:pb-4 text-center hidden md:block">
          <p className="text-[clamp(1.35rem,3vw,1.875rem)] font-semibold tracking-tight text-zinc-900 leading-snug">
            Wanna make it here?{" "}
            <span className="text-zinc-400">
              Contribute to the uniZ ecosystem now.
            </span>
          </p>
        </div>
        <GlobeFeature hideTitleOnMobile />
      </section>
      <SiteLegalFooter />
    </div>
  );
}
