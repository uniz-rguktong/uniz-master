import { useEffect, useId, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePortalTheme,
  type ThemePreference,
} from "@/hooks/usePortalTheme";

const options: { id: ThemePreference; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

/**
 * Ghost icon that opens the light / dark / system menu.
 * The choice is persisted by `usePortalTheme`.
 */
export function ThemeToggle({
  className,
  tone = "default",
}: {
  className?: string;
  /** `chrome` is for navy bars (white icon). */
  tone?: "default" | "chrome";
}) {
  const { preference, resolved, setPreference } = usePortalTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const Icon = resolved === "dark" ? Moon : preference === "system" ? Monitor : Sun;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          tone === "chrome"
            ? "text-white hover:bg-white/10"
            : "text-text-2 hover:bg-tint",
        )}
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-border bg-surface p-2 shadow-md dark:shadow-none"
        >
          {options.map((option) => {
            const active = preference === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(
                  "flex h-10 w-full items-center rounded-sm px-3 text-left text-dense font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active ? "bg-selected text-head" : "text-text-2 hover:bg-tint",
                )}
                onClick={() => {
                  setPreference(option.id);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
