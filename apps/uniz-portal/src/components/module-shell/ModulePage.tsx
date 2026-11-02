import type { ReactNode } from "react";
import { DisabledState } from "./DisabledState";

interface ModulePageProps {
  title: string;
  description?: string;
  /** When set, the page renders a disabled state with this reason instead of children. */
  disabledReason?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ModulePage({
  title,
  description,
  disabledReason,
  actions,
  children,
}: ModulePageProps) {
  return (
    <section className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
 <h1 className="font-serif text-3xl font-medium tracking-tight text-navy-900">{title}</h1>
          {description ? (
 <p className="mt-2 text-base leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
        {actions}
      </header>
      {disabledReason ? <DisabledState reason={disabledReason} /> : children}
    </section>
  );
}

export default ModulePage;
