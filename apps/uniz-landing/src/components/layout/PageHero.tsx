interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

/** Shared inner-page hero — flat page header on the page background. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <header className="mx-auto w-full max-w-[1232px] px-5 pt-10 pb-2 min-[821px]:px-10 min-[821px]:pt-14">
      {eyebrow && (
        <p className="mb-3 max-w-[65ch] text-[15px] leading-6 text-text-2">{eyebrow}</p>
      )}
      <h1 className="u-page text-balance text-head">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-[65ch] text-[15px] leading-6 text-text-2">
          {description}
        </p>
      )}
    </header>
  );
}
