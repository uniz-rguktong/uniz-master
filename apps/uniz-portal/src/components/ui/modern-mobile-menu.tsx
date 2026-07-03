import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "../../utils/cn";

type IconComponentType = LucideIcon | React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  onClick?: () => void;
  isActive?: boolean;
  description?: string;
}

export interface InteractiveMenuProps {
  primaryItems: InteractiveMenuItem[];
  moreItems: InteractiveMenuItem[];
  moreTitle?: string;
}

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  primaryItems,
  moreItems,
  moreTitle = "Academics",
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const moreActive = moreItems.some((item) => item.isActive);

  useEffect(() => {
    const active = primaryItems.findIndex((item) => item.isActive);
    if (active !== -1) setActiveIndex(active);
  }, [primaryItems]);

  const middleIndex = Math.floor(primaryItems.length / 2);
  const leftItems = primaryItems.slice(0, middleIndex);
  const rightItems = primaryItems.slice(middleIndex + 1);
  const middleItem = primaryItems[middleIndex];

  const closeMore = () => setIsMoreOpen(false);

  return (
    <>
      <AnimatePresence>
        {isMoreOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMore}
            className="fixed inset-0 z-40 bg-zinc-900/10 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <AnimatePresence>
          {isMoreOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              className="overflow-hidden border-t border-zinc-200/80 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="px-4 pt-3 pb-2">
                <p className="text-[11px] font-bold tracking-[0.12em] text-zinc-400 uppercase">
                  {moreTitle}
                </p>
              </div>
              <div className="px-2 pb-2 space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        closeMore();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99]",
                        item.isActive
                          ? "bg-[#0B2A47] text-white"
                          : "hover:bg-[#F7FAFD] text-[#0B2A47]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          item.isActive
                            ? "bg-white/15 text-white"
                            : "bg-[#EDF5FB] text-[#0F3B63]",
                        )}
                      >
                        <Icon size={20} strokeWidth={2.25} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold leading-tight">
                          {item.label}
                        </span>
                        {item.description && (
                          <span
                            className={cn(
                              "block text-[11px] mt-0.5 truncate",
                              item.isActive ? "text-white/70" : "text-zinc-400",
                            )}
                          >
                            {item.description}
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        size={18}
                        className={cn(
                          "shrink-0",
                          item.isActive ? "text-white/70" : "text-zinc-300",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav
          className="bg-white/98 backdrop-blur-xl border-t border-[#D4E8F5] px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          style={{ boxShadow: "0 -4px 24px rgba(11,42,71,0.06)" }}
        >
          <div className="flex items-end justify-between">
            <div className="flex flex-1 justify-around">
              {leftItems.map((item, idx) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isActive={activeIndex === idx && !isMoreOpen}
                  onClick={() => {
                    setActiveIndex(idx);
                    closeMore();
                    item.onClick?.();
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col items-center px-1 -mt-0.5">
              <button
                type="button"
                onClick={() => setIsMoreOpen((open) => !open)}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[64px] transition-all active:scale-95",
                  isMoreOpen || moreActive ? "text-[#0B2A47]" : "text-zinc-500",
                )}
                aria-label={isMoreOpen ? "Close academics menu" : "Open academics menu"}
                aria-expanded={isMoreOpen}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                    isMoreOpen || moreActive
                      ? "bg-[#0B2A47] text-white"
                      : "bg-[#EDF5FB] text-[#0F3B63]",
                  )}
                >
                  {middleItem ? (
                    (() => {
                      const Icon = middleItem.icon;
                      return isMoreOpen ? (
                        <ChevronUp size={18} strokeWidth={2.5} />
                      ) : (
                        <Icon size={18} strokeWidth={2.25} />
                      );
                    })()
                  ) : (
                    <ChevronUp size={18} strokeWidth={2.5} />
                  )}
                </span>
                <span className="text-[10px] font-bold tracking-tight">
                  {middleItem?.label || "Menu"}
                </span>
              </button>
            </div>

            <div className="flex flex-1 justify-around">
              {rightItems.map((item, idx) => {
                const actualIdx = middleIndex + 1 + idx;
                return (
                  <NavItem
                    key={item.label}
                    item={item}
                    isActive={activeIndex === actualIdx && !isMoreOpen}
                    onClick={() => {
                      setActiveIndex(actualIdx);
                      closeMore();
                      item.onClick?.();
                    }}
                  />
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

const NavItem = ({
  item,
  isActive,
  onClick,
}: {
  item: InteractiveMenuItem;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[56px] py-0.5 transition-all active:scale-95"
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-all",
          isActive ? "bg-[#0B2A47] text-white" : "text-zinc-400",
        )}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      </span>
      <span
        className={cn(
          "text-[10px] font-bold tracking-tight max-w-[64px] truncate",
          isActive ? "text-[#0B2A47]" : "text-zinc-400",
        )}
      >
        {item.label}
      </span>
    </button>
  );
};

export { InteractiveMenu };
