import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";
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
}

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  primaryItems,
  moreItems,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const active = primaryItems.findIndex(item => item.isActive);
    if (active !== -1) setActiveIndex(active);
  }, [primaryItems]);

  const toggleMore = () => setIsMoreOpen(!isMoreOpen);

  const getPopupItemStyle = (index: number, total: number) => {
    const radius = 95;
    const startAngle = -155;
    const endAngle = -25;
    const angleStep = total > 1 ? (endAngle - startAngle) / (total - 1) : 0;
    const angle = startAngle + index * angleStep;
    const radian = (angle * Math.PI) / 180;

    return {
      x: radius * Math.cos(radian),
      y: radius * Math.sin(radian),
    };
  };

  const middleIndex = Math.floor(primaryItems.length / 2);
  const leftItems = primaryItems.slice(0, middleIndex);
  const rightItems = primaryItems.slice(middleIndex + 1);
  const middleItem = primaryItems[middleIndex];

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      {/* Pop-up Arc (More Menu) */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[70]">
            {moreItems.map((item, index) => {
              const { x, y } = getPopupItemStyle(index, moreItems.length);
              return (
                <motion.button
                  key={item.label}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ scale: 1, x, y, opacity: 1 }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 28,
                    mass: 0.8,
                    delay: index * 0.03
                  }}
                  onClick={() => {
                    item.onClick?.();
                    setIsMoreOpen(false);
                  }}
                  className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-600 shadow-2xl border border-slate-100 hover:bg-slate-50 active:scale-90 transition-transform"
                  style={{ left: -24, top: -24 }}
                >
                  <item.icon size={20} />
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <div className="relative w-full">
        {/* The Dock Container with Custom SVG Background */}
        <div className="relative h-[72px] w-full">
          {/* SVG Notch Background */}
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

          {/* Navigation Items */}
          <nav className="relative z-10 flex items-center justify-between h-full px-6 overflow-visible pt-1">
            {/* Left Items */}
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

            {/* Middle Raised Button */}
            <div className="relative w-24 flex justify-center overflow-visible">
              <div className="absolute -top-14 transform transition-all duration-300">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    rotate: isMoreOpen ? 90 : 0,
                    scale: isMoreOpen ? 1.1 : 1
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  onClick={toggleMore}
                  className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-colors duration-500 border-4 border-white",
                    isMoreOpen
                      ? "bg-navy-900 text-white"
                      : "bg-[#0B2A47] text-white"
                  )}
                >
                  {middleItem ? (
                    (() => {
                      const Icon = middleItem.icon;
                      return <Icon size={28} strokeWidth={2.5} />;
                    })()
                  ) : <Plus size={28} />}
                </motion.button>
              </div>
            </div>

            {/* Right Items */}
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

      {/* Backdrop */}
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[55]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const NavItem = ({ item, isActive, onClick }: { item: InteractiveMenuItem; isActive: boolean; onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-all active:scale-95">
      <div className={cn(
        "flex items-center justify-center transition-all duration-300",
        isActive ? "text-navy-900" : "text-slate-400"
      )}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={cn(
        "text-[10px] font-bold tracking-tight transition-colors duration-300",
        isActive ? "text-navy-900" : "text-slate-400 font-medium"
      )}>
        {item.label}
      </span>
    </button>
  );
};

export { InteractiveMenu };

