interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

/** Shared inner-page hero — flat navy, no decorative grids or radial washes. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <div className="bg-navy-900 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 text-left">
        {eyebrow && (
          <p className="text-sm text-white/60 mb-3 max-w-2xl">{eyebrow}</p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-medium text-white tracking-tight leading-[1.12] max-w-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
