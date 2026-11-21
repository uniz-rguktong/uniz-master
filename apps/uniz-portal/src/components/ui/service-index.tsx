import { ArrowRight, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export type ServiceIndexItem = {
  icon: LucideIcon;
  label: string;
  line: string;
  href: string;
};

/** Open link grid. Each cell has a top rule, no box. */
export function ServiceIndex({ items }: { items: ServiceIndexItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-14 min-[821px]:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          className="block border-t border-border-strong py-8 pb-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon icon={item.icon} size={28} className="text-accent" />
          <span className="mt-4 flex items-center gap-3">
            <span className="text-[19px] font-semibold leading-7 text-head">{item.label}</span>
            <ArrowRight size={20} strokeWidth={1.75} className="ml-auto shrink-0 text-accent" aria-hidden />
          </span>
          <span className="mt-2 block max-w-[300px] text-body leading-6 text-text-2">{item.line}</span>
        </a>
      ))}
    </div>
  );
}
