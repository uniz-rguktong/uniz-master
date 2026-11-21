import { developerTestimonials } from "@/constants/developerTestimonials";
import { cn } from "@/lib/utils";

interface MeetTheDevelopersSectionProps {
  subtitle?: string;
  compact?: boolean;
  /** Kept so existing callers compile. The grid does not tilt or crop to one viewport. */
  fitScreen?: boolean;
  className?: string;
}

export default function MeetTheDevelopersSection({
  subtitle = "The minds behind UniZ.",
  className,
}: MeetTheDevelopersSectionProps) {
  return (
    <section className={cn("bg-bg", className)}>
      <h1 className="font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head min-[821px]:text-[32px] min-[821px]:leading-10">
        Meet the developers
      </h1>
      <p className="mt-3 max-w-[40rem] text-body leading-6 text-text-2">{subtitle}</p>
      <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
        {developerTestimonials.map((person) => (
          <li key={person.name} className="flex items-center gap-4">
            <img
              src={person.src}
              alt={`${person.name}, ${person.designation}`}
              className="h-24 w-24 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-[17px] font-semibold leading-6 text-head">{person.name}</p>
              <p className="text-body leading-6 text-text-2">{person.designation}</p>
              {person.linkedin ? (
                <a
                  href={person.linkedin}
                  className="text-dense font-medium text-link underline-offset-[1px] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
