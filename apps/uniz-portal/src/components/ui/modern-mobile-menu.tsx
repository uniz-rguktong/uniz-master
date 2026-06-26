import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, LayoutGrid, X } from "lucide-react";
import { cn } from "../../utils/cn";

type IconComponentType = LucideIcon | React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  onClick?: () => void;
  isActive?: boolean;
}

export interface InteractiveMenuProps {
  primaryItems: InteractiveMenuItem[];
  moreItems: InteractiveMenuItem[];
  moreTitle?: string;
}

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  primaryItems,
  moreItems,
  moreTitle = "Academics & more",
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const moreActive = moreItems.some((item) => item.isActive);

  useEffect(() => {
    const active = primaryItems.findIndex((item) => item.isActive);
    if (active !== -1) setActiveIndex(active);
  }, [primaryItems]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMoreOpen]);

  const middleIndex = Math.floor(primaryItems.length / 2);
  const leftItems = primaryItems.slice(0, middleIndex);
  const rightItems = primaryItems.slice(middleIndex + 1);

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-[55] bg-zinc-900/25 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="fixed bottom-[88px] left-3 right-3 z-[70] rounded-2xl border border-zinc-200/80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.14)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <p className="text-[13px] font-bold text-zinc-900 tracking-tight">
                  {moreTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        setIsMoreOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 transition-all active:scale-[0.97]",
                        item.isActive
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
                      )}
                    >
                      <Icon size={22} strokeWidth={2.25} />
                      <span className="text-[10px] font-bold leading-tight text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative w-full">
        <div className="relative h-[72px] w-full">
          <div className="absolute inset-0 z-0">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="fill-white filter drop-shadow-[0_-10px_25px_rgba(0,0,0,0.08)]"
            >
              <path
                d="M 0,10 
                   Q 0,0 10,0 
                   L 38,0 
                   C 42,0 44,48 50,48 
                   C 56,48 58,0 62,0 
                   L 90,0 
                   Q 100,0 100,10 
                   L 100,100 
                   L 0,100 Z"
              />
            </svg>
          </div>

          <nav className="relative z-10 flex items-center justify-between h-full px-4 overflow-visible pt-1">
            <div className="flex flex-1 justify-around items-center">
              {leftItems.map((item, idx) => (
                <NavItem
                  key={item.label}
                  item={item}
                  isActive={activeIndex === idx && !isMoreOpen}
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsMoreOpen(false);
                    item.onClick?.();
                  }}
                />
              ))}
            </div>

            <div className="relative w-20 flex justify-center overflow-visible">
              <div className="absolute -top-12">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: isMoreOpen ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => setIsMoreOpen((open) => !open)}
                  className={cn(
                    "flex flex-col items-center justify-center w-[60px] h-[60px] rounded-full shadow-xl transition-colors duration-300 border-4 border-white",
                    isMoreOpen || moreActive
                      ? "bg-zinc-900 text-white"
                      : "bg-[#0B2A47] text-white",
                  )}
                  aria-label={isMoreOpen ? "Close menu" : "Open academics menu"}
                  aria-expanded={isMoreOpen}
                >
                  <LayoutGrid size={24} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-1 justify-around items-center">
              {rightItems.map((item, idx) => {
                const actualIdx = middleIndex + 1 + idx;
                return (
                  <NavItem
                    key={item.label}
                    item={item}
                    isActive={activeIndex === actualIdx && !isMoreOpen}
                    onClick={() => {
                      setActiveIndex(actualIdx);
                      setIsMoreOpen(false);
                      item.onClick?.();
                    }}
                  />
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
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
      className="flex flex-col items-center gap-1 min-w-[56px] transition-all active:scale-95"
    >
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300",
          isActive ? "text-zinc-900" : "text-zinc-400",
        )}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span
        className={cn(
          "text-[10px] font-bold tracking-tight transition-colors duration-300 max-w-[64px] truncate",
          isActive ? "text-zinc-900" : "text-zinc-400 font-medium",
        )}
      >
        {item.label}
      </span>
    </button>
  );
};

export { InteractiveMenu };
