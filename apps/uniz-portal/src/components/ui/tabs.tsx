import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
};

/**
 * Underline tabs. They scroll sideways under 821px and keep the active tab in view.
 * No icons and no segmented control.
 */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
  label = "Sections",
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  label?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [value]);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cn(
        "flex gap-0 overflow-x-auto border-b border-border no-scrollbar",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-3 text-[15px] font-medium leading-[22px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected ? "border-head text-head" : "border-transparent text-text-2 hover:text-head",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
