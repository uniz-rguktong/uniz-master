import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lockup } from "@/components/brand/Mark";

/** Navy header shared by the portal's public pages. */
export function PublicHeader({
  signInTo = "/student/signin",
}: {
  signInTo?: string;
}) {
  return (
    <header className="border-b border-[var(--sb-border)] bg-navy-900">
      <div className="mx-auto flex h-16 w-full max-w-[1232px] items-center justify-between px-5 min-[821px]:px-10">
        <Link to="/" aria-label="UniZ home" className="text-white">
          <Lockup height={36} tone="chrome" />
        </Link>
        <Link
          to={signInTo}
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-dense font-semibold text-navy-900 hover:bg-navy-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-[639px]:h-11"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--sb-border)] bg-navy-900 text-white">
      <div className="mx-auto flex w-full max-w-[1232px] flex-col gap-6 px-5 py-10 min-[821px]:flex-row min-[821px]:items-end min-[821px]:justify-between min-[821px]:px-10">
        <div>
          <Lockup height={40} tone="chrome" title="uniZ" />
          <p className="mt-4 max-w-[360px] text-dense leading-[22px] text-navy-300">
            Rajiv Gandhi University of Knowledge Technologies, Ongole.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-dense text-navy-300">
          <Link to="/student/signin" className="hover:text-white">
            Student sign in
          </Link>
          <Link to="/admin/signin" className="hover:text-white">
            Faculty and admin sign in
          </Link>
          <Link to="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link to="/developers" className="hover:text-white">
            Developers
          </Link>
        </nav>
      </div>
      <div className="border-t border-navy-700">
        <p className="mx-auto w-full max-w-[1232px] px-5 py-5 text-small text-navy-300 min-[821px]:px-10">
          © {new Date().getFullYear()} UniZ · RGUKT Ongole
        </p>
      </div>
    </footer>
  );
}

/**
 * Flat campus placeholder for the portal home and the 404 page.
 * PLACEHOLDER: replace with a real RGUKT Ongole campus photo (object-fit: cover, same box and radius); then delete the --ill-* tokens.
 */
export function CampusIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-full w-full"}
      viewBox="0 0 520 480"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden="true"
    >
      <g fill="var(--ill-cloud)" opacity="var(--ill-cloud-o)">
        <rect x="64" y="60" width="110" height="20" rx="10" />
        <rect x="92" y="44" width="56" height="24" rx="12" />
        <rect x="340" y="104" width="100" height="18" rx="9" />
      </g>
      <rect x="0" y="330" width="520" height="86" fill="var(--ill-far)" />
      <rect x="372" y="86" width="84" height="332" fill="var(--ill-main)" />
      <rect x="364" y="76" width="100" height="14" fill="var(--ill-roof)" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="396" y="112" width="36" height="34" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="396" y="168" width="36" height="34" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="396" y="224" width="36" height="34" rx="2" />
      <rect x="52" y="176" width="320" height="240" fill="var(--ill-main)" />
      <rect x="40" y="160" width="344" height="18" fill="var(--ill-roof)" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="72" y="204" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="132" y="204" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="192" y="204" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="252" y="204" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="312" y="204" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="72" y="290" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="132" y="290" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="252" y="290" width="44" height="50" rx="2" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="312" y="290" width="44" height="50" rx="2" />
      <rect x="190" y="290" width="104" height="126" fill="var(--ill-roof)" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="198" y="298" width="42" height="118" rx="1" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="244" y="298" width="42" height="118" rx="1" />
      <rect x="176" y="404" width="132" height="12" fill="var(--ill-roof)" />
      <path d="M100 160V112" stroke="var(--ill-roof)" strokeWidth="3" strokeLinecap="round" />
      <rect fill="var(--navy-300)" opacity="var(--ill-win-o)" x="102" y="112" width="30" height="16" />
      <rect x="0" y="416" width="520" height="64" fill="var(--ill-ground)" />
      <polygon points="196,416 288,416 326,480 158,480" fill="var(--ill-far)" />
      <rect x="21" y="358" width="6" height="58" fill="var(--ill-roof)" />
      <circle cx="24" cy="358" r="32" fill="var(--navy-600)" />
      <rect x="483" y="366" width="6" height="50" fill="var(--ill-roof)" />
      <circle cx="486" cy="366" r="34" fill="var(--navy-600)" />
    </svg>
  );
}

export function PublicProse({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[65ch] px-4 py-10 min-[821px]:px-10 min-[821px]:py-16">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
