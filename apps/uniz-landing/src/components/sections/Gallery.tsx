export function Gallery({ images }: { images: readonly string[] }) {
  const shown = images.slice(0, 8);
  if (!shown.length) return null;

  return (
    <section id="photo-gallery" className="section-editorial bg-paper">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[13px] font-semibold text-crimson">Campus</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Life on campus
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
          Classrooms, gatherings, and the grounds at Ongole.
        </p>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {shown.map((src, idx) => (
            <li key={`${src}-${idx}`} className={idx === 0 ? "col-span-2 row-span-2" : ""}>
              <img
                src={src}
                alt={`Campus photograph ${idx + 1}`}
                className="h-full w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
