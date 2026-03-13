import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";

type IconComponentType = LucideIcon | React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  onClick?: () => void;
  isActive?: boolean;
}

export interface InteractiveMenuProps {
  primaryItems: InteractiveMenuItem[]; // 0: Home/Profile, 1: Money/More, 2: You/Grievance
  moreItems: InteractiveMenuItem[]; // Items for the inverted C popup
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

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Pop-up Arc (More Menu) */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[60]">
            {moreItems.map((item, index) => {
              const { x, y } = getPopupItemStyle(index, moreItems.length);
              return (
                <motion.button
                  key={item.label}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ scale: 1, x, y, opacity: 1 }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                  onClick={() => {
                    item.onClick?.();
                    setIsMoreOpen(false);
                  }}
                  className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-600 shadow-xl border border-slate-100 hover:bg-slate-50"
                  style={{ left: -24, top: -24 }}
                >
                  <item.icon size={20} />
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main GPay Style Dock (White Theme) */}
      <nav 
        onClick={() => isMoreOpen && setIsMoreOpen(false)}
        className="relative z-[60] flex items-center justify-around w-full h-[70.5px] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6"
      >

        {/* Support / Grievance (Left) */}
        <NavItem
          item={primaryItems[0]}
          isActive={activeIndex === 0 && !isMoreOpen}
          onClick={() => {
            setActiveIndex(0);
            setIsMoreOpen(false); // Close animation when switching tabs
            primaryItems[0].onClick?.();
          }}
        />

        {/* Explore / More (Middle) */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMore}
            className={`flex items-center justify-center w-[52px] h-[32px] rounded-2xl transition-all duration-300
              ${isMoreOpen ? 'bg-navy-900 text-white' : 'text-slate-400 hover:text-navy-900'}`}
          >
            {primaryItems[1] ? (
              (() => {
                const Icon = primaryItems[1].icon;
                return <Icon size={22} strokeWidth={2.5} />;
              })()
            ) : <Plus size={22} />}
          </motion.button>
          <span className={`text-[10px] font-bold tracking-tight transition-colors ${isMoreOpen ? 'text-navy-900' : 'text-slate-400'}`}>
            {primaryItems[1]?.label || "More"}
          </span>
        </div>

        {/* Profile (Right) */}
        <NavItem
          item={primaryItems[primaryItems.length - 1]}
          isActive={activeIndex === primaryItems.length - 1 && !isMoreOpen}
          onClick={() => {
            setActiveIndex(primaryItems.length - 1);
            setIsMoreOpen(false); // Close animation when switching tabs
            primaryItems[primaryItems.length - 1].onClick?.();
          }}
        />
      </nav>

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
    <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[64px]">
      <div className={`relative flex items-center justify-center w-[52px] h-[32px] rounded-2xl transition-all duration-300
        ${isActive ? 'bg-navy-100 text-navy-900' : 'text-slate-400 hover:text-navy-900'}`}>
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={`text-[10px] font-bold tracking-tight transition-colors ${isActive ? 'text-navy-900' : 'text-slate-400'}`}>
        {item.label}
      </span>
    </button>
  );
};

export { InteractiveMenu };
