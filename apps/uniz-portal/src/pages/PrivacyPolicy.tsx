import { SEO } from "@/components/SEO";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { PublicFooter, PublicHeader } from "@/components/public/PublicFrame";

const sections = [
  {
    title: "Overview",
    body: `uniZ is the campus platform operated for ${UNIZ_CAMPUS_LABEL} students, faculty, and staff. This policy describes how we handle information when you use the website, progressive web app (PWA), or Android app published on Google Play.`,
  },
  {
    title: "Information we collect",
    body: "Account identifiers (username, email where provided), profile and academic records (grades, attendance, registration, outpass and grievance requests), device push notification subscription tokens, and basic usage or security logs (IP address, browser type, timestamps) needed to operate and protect the service.",
  },
  {
    title: "How we use information",
    body: "To authenticate users, deliver campus workflows (academics, outpass, notifications), improve reliability and security, and communicate service-related alerts you opt into (including browser or app push notifications).",
  },
  {
    title: "Push notifications",
    body: "If you grant permission, we store a push subscription token linked to your account so administrators can send campus alerts. You can disable notifications in your device or browser settings at any time.",
  },
  {
    title: "Sharing",
    body: "We do not sell personal data. Information is shared only with authorized campus roles (faculty, wardens, administrators) as required for official workflows, and with infrastructure providers that host the service (cloud hosting, email delivery, CDN) under contractual safeguards.",
  },
  {
    title: "Security & retention",
    body: "Access is role-based and encrypted in transit (HTTPS). Data is retained while your account is active and as required for institutional records, then deleted or anonymized according to campus policy.",
  },
  {
    title: "Your choices",
    body: "Contact your campus administrator to correct profile data that is managed institutionally. You may sign out, uninstall the app, or revoke notification permission at any time.",
  },
  {
    title: "Contact",
    body: "Questions about this policy: use the Contact page on uniZ or reach the development team via the Developers page.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SEO
        title="Privacy Policy — uniZ"
        description={`Privacy policy for the uniZ campus platform at ${UNIZ_CAMPUS_LABEL}.`}
        canonical="https://uniz.rguktong.in/privacy"
      />
      <PublicHeader />
      <main className="mx-auto w-full max-w-[65ch] px-4 py-10 min-[821px]:px-0 min-[821px]:py-16">
        <h1 className="font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head min-[821px]:text-[32px] min-[821px]:leading-10">
          Privacy Policy
        </h1>
        <p className="mt-3 text-body leading-6 text-text-2">
          Last updated: June 2026 · {UNIZ_CAMPUS_LABEL}
        </p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
                {section.title}
              </h2>
              <p className="mt-2 text-[16px] leading-[26px] text-text">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
