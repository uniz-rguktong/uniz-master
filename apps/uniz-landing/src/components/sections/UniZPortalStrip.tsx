import { ArrowRight } from "lucide-react";

export function UniZPortalStrip() {
  return (
    <section
      aria-labelledby="uniz-portal-heading"
      className="border-b border-line bg-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2
              id="uniz-portal-heading"
              className="text-base sm:text-lg font-medium text-navy-900"
            >
              UniZ — campus ERP for RGUKT Ongole
            </h2>
            <p className="mt-2 text-sm sm:text-[15px] text-ink-muted leading-relaxed">
              Students, faculty, and administrators use UniZ for attendance, grades,
              outpass, notifications, and day-to-day campus workflows at{" "}
              <span className="text-ink">uniz.rguktong.in</span>
            </p>
          </div>
          <a
            href="https://uniz.rguktong.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-navy-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Open UniZ portal
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
