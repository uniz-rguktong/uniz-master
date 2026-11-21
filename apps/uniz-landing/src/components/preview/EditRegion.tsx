import type { ElementType, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useSiteContent } from "@/components/site-context";

export function EditRegion({
  region,
  className,
  children,
  blockNavigation = false,
}: {
  region: string;
  className?: string;
  children: ReactNode;
  blockNavigation?: boolean;
}) {
  const { authorized, activeRegion, select } = useSiteContent();
  if (!authorized) return <div className={className}>{children}</div>;
  return (
    <div
      data-edit={region}
      data-active={activeRegion === region ? "true" : undefined}
      className={className}
      onClick={(event) => {
        if (blockNavigation) event.preventDefault();
        event.stopPropagation();
        select(region);
      }}
    >
      {children}
    </div>
  );
}

export function EditableText({
  region,
  value,
  className,
  as: Tag = "span",
  patchValue,
}: {
  region: string;
  value: string;
  className?: string;
  as?: ElementType;
  patchValue?: (text: string) => unknown;
}) {
  const { authorized, activeRegion, select, patch } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const bind = (node: HTMLElement | null) => {
    ref.current = node;
    if (!node || document.activeElement === node) return;
    if (node.textContent !== value) node.textContent = value;
  };

  useEffect(() => {
    const node = ref.current;
    if (!node || document.activeElement === node) return;
    if (node.textContent !== value) node.textContent = value;
  }, [value]);

  if (!authorized) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      ref={bind}
      data-edit={region}
      data-active={activeRegion === region ? "true" : undefined}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={region.replace(/-/g, " ")}
      className={className}
      onClick={(event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        select(region);
      }}
      onBlur={(event: { currentTarget: HTMLElement }) => {
        const text = event.currentTarget.textContent ?? "";
        patch(region, patchValue ? patchValue(text) : text);
      }}
    />
  );
}
