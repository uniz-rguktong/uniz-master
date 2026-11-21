import MeetTheDevelopersSection from "@/components/MeetTheDevelopersSection";
import { SEO } from "@/components/SEO";
import { PublicFooter, PublicHeader } from "@/components/public/PublicFrame";
import { portalPrimaryButtonClass } from "@/lib/portal-ui";
import { cn } from "@/lib/utils";
import { hasPortalSession } from "@/utils/portalSession";

const REPO_URL = "https://github.com/uniz-rguktong/uniz-master";

function DevelopersBody() {
  return (
    <>
      <MeetTheDevelopersSection subtitle="Engineering, design, and security — built by students, for campus." />
      <section className="mt-10 border-t border-border pt-8">
        <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
          Wanna make it here?
        </h2>
        <p className="mt-3 max-w-[46ch] text-[16px] leading-[26px] text-text-2">
          Contribute to the uniZ ecosystem.
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(portalPrimaryButtonClass, "mt-5")}
        >
          Contribute on GitHub
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>
    </>
  );
}

export default function Developers() {
  const signedIn = hasPortalSession();

  return (
    <>
      <SEO
        title="Developers — uniZ"
        description="Meet the RGUKT Ongole student team behind the UniZ campus platform."
        canonical="https://uniz.rguktong.in/developers"
      />
      {signedIn ? (
        <div className="mx-auto w-full max-w-[880px]">
          <DevelopersBody />
        </div>
      ) : (
        <div className="bg-bg font-sans text-text">
          <PublicHeader />
          <main className="mx-auto w-full max-w-[1232px] px-5 py-10 min-[821px]:px-10 min-[821px]:py-14">
            <DevelopersBody />
          </main>
          <PublicFooter />
        </div>
      )}
    </>
  );
}
