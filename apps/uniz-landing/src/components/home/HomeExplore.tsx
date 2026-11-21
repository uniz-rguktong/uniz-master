import { Link } from "react-router-dom";
import { officialHome } from "@/data/official";
import { Wrap } from "../layout/Wrap";

export function HomeExplore() {
  return (
    <Wrap>
      <section className="mt-[72px] min-[821px]:mt-[112px]" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="u-section text-head">
          Explore campus
        </h2>
        <ul className="mt-8 grid gap-10 min-[821px]:grid-cols-2">
          {officialHome.explore.map((card) => (
            <li key={card.title} className="border-t border-border pt-6">
              {card.image && (
                <img
                  src={card.image}
                  alt={card.alt}
                  loading="lazy"
                  decoding="async"
                  className="mb-5 aspect-[16/10] w-full rounded-xl object-cover"
                />
              )}
              <h3 className="text-[19px] font-semibold leading-7 text-head">
                <Link to={card.href} className="hover:underline">
                  {card.title}
                </Link>
              </h3>
              <p className="mt-2 max-w-[48ch] text-[15px] leading-6 text-text-2">{card.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </Wrap>
  );
}
