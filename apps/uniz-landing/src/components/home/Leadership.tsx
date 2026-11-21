import { Link } from "react-router-dom";
import { officialDoc } from "@/data/official";
import { PersonPhoto } from "../common/PersonPhoto";
import { initials } from "@/lib/initials";
import { Wrap } from "../layout/Wrap";

const OFFICES = [
  { path: "/administration/chancellor", label: "Chancellor" },
  { path: "/administration/vice-chancellor", label: "Vice Chancellor" },
  { path: "/administration/director", label: "Director" },
];

export function Leadership() {
  return (
    <Wrap>
      <section className="mt-[72px] min-[821px]:mt-[112px]" aria-labelledby="administration-heading">
        <h2 id="administration-heading" className="u-section text-head">
          Administration
        </h2>
        <p className="mt-2.5 max-w-[46ch] text-[17px] leading-[26px] text-text-2">
          The chancellor, vice-chancellor and director published by the Ongole campus.
        </p>
        <ul className="mt-8 grid gap-8 min-[821px]:grid-cols-3">
          {OFFICES.map((office) => {
            const person = officialDoc(office.path)?.people?.[0];
            if (!person) return null;
            return (
              <li key={office.path} className="border-t border-border pt-6">
                <div className="size-20 overflow-hidden rounded-full bg-navy-100 dark:bg-surface-2">
                  <PersonPhoto
                    src={person.photo}
                    name={person.name}
                    className="size-full object-cover object-top"
                    fallback={
                      <div className="flex size-full items-center justify-center text-[16px] font-medium text-navy-900 dark:text-text">
                        {initials(person.name)}
                      </div>
                    }
                  />
                </div>
                <p className="mt-4 text-[13px] leading-[18px] text-text-3">{office.label}</p>
                <h3 className="mt-1 text-[17px] font-semibold leading-6 text-head">{person.name}</h3>
                {person.role && <p className="mt-2 text-[15px] leading-6 text-text-2">{person.role}</p>}
                <Link to={office.path} className="mt-3 inline-flex min-h-11 items-center text-[15px] leading-6 text-link hover:underline">
                  View more
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </Wrap>
  );
}
