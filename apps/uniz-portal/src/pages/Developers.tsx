import MeetTheDevelopersSection from "@/components/MeetTheDevelopersSection";
import { SEO } from "@/components/SEO";
import { PublicFooter, PublicHeader } from "@/components/public/PublicFrame";

export default function Developers() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <SEO
        title="Developers — uniZ"
        description="Meet the RGUKT Ongole student team behind the UniZ campus platform."
        canonical="https://uniz.rguktong.in/developers"
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-[1232px] px-4 py-10 min-[821px]:px-10 min-[821px]:py-16">
        <MeetTheDevelopersSection
          subtitle="Engineering, design, and security — built by students, for campus."
          compact
          fitScreen
        />
        <section className="mt-16 max-w-[65ch]">
          <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
            Wanna make it here?
          </h2>
          <p className="mt-3 text-[16px] leading-[26px] text-text-2">
            Contribute to the uniZ ecosystem.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
