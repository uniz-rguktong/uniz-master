export function PageIntro({
  kicker = "RGUKT Ongole",
  title,
  lede,
}: {
  kicker?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-sans text-[13px] font-semibold text-crimson">{kicker}</p>
        <h1 className="mt-3 max-w-4xl font-serif text-[2.25rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">{lede}</p>
        ) : null}
      </div>
    </header>
  );
}
