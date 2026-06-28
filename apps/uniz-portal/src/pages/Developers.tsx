import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MeetTheDevelopersSection from "@/components/MeetTheDevelopersSection";
import { SEO } from "@/components/SEO";

export default function Developers() {
  return (
    <div className="min-h-screen bg-white pt-16 font-sans">
      <SEO
        title="Developers — uniZ"
        description="Meet the RGUKT Ongole student team behind the UniZ campus platform."
        canonical="https://uniz.rguktong.in/developers"
      />

      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <MeetTheDevelopersSection subtitle="The minds behind UniZ." />
    </div>
  );
}
