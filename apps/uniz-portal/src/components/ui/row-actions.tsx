import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  adminModalDescClass,
  adminModalShellClass,
  adminModalTitleClass,
} from "@/components/admin/admin-ui";

export type RowActionItem = {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  /** Ask before running. Destructive actions should set this. */
  confirm?: {
    title: string;
    body: string;
    confirmLabel?: string;
  };
};

/**
 * One control for a table row. The menu stays on a single line at every width.
 * A destructive item with `confirm` asks in a dialog before it runs.
 */
export function RowActions({
  items,
  label = "More actions",
}: {
  items: RowActionItem[];
  label?: string;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<RowActionItem | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;
    const button = buttonRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - button.bottom;
    const top =
      spaceBelow < menu.height + gap + 8
        ? Math.max(8, button.top - menu.height - gap)
        : button.bottom + gap;
    const left = Math.min(
      Math.max(8, button.right - menu.width),
      window.innerWidth - menu.width - 8,
    );
    setPosition({ top, left });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function run(item: RowActionItem) {
    if (item.disabled) return;
    if (item.confirm) {
      setOpen(false);
      setPending(item);
      return;
    }
    setOpen(false);
    item.onSelect();
  }

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          setPosition(null);
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal size={16} aria-hidden />
      </Button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              style={{
                top: position?.top ?? -9999,
                left: position?.left ?? 0,
              }}
              className={cn(
                adminModalShellClass,
                "fixed z-[70] min-w-44 py-1",
                position ? "visible" : "invisible",
              )}
              onClick={(event) => event.stopPropagation()}
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-dense disabled:opacity-[0.45]",
                      item.destructive
                        ? "text-error hover:bg-tint"
                        : "text-text hover:bg-tint",
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      run(item);
                    }}
                  >
                    {Icon ? <Icon size={15} aria-hidden /> : null}
                    <span className="min-w-0 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
      {pending?.confirm
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-overlay"
                aria-label="Cancel"
                onClick={() => setPending(null)}
              />
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`${menuId}-confirm-title`}
                aria-describedby={`${menuId}-confirm-body`}
                className={cn(adminModalShellClass, "relative z-10 w-full max-w-md p-6")}
              >
                <h2 id={`${menuId}-confirm-title`} className={adminModalTitleClass}>
                  {pending.confirm.title}
                </h2>
                <p id={`${menuId}-confirm-body`} className={cn("mt-3", adminModalDescClass)}>
                  {pending.confirm.body}
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <Button type="button" variant="ghost" size="compact" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={pending.destructive ? "destructive" : "primary"}
                    size="compact"
                    onClick={() => {
                      const action = pending;
                      setPending(null);
                      action.onSelect();
                    }}
                  >
                    {pending.confirm.confirmLabel || pending.label}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
