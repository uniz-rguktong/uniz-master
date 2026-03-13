import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { LucideIcon } from "lucide-react";

interface DockProps {
  className?: string;
  items: {
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    activeColor?: string;
    hoverColor?: string;
  }[];
}

interface DockIconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  activeColor?: string;
  hoverColor?: string;
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  (
    {
      icon: Icon,
      label,
      onClick,
      isActive,
      className,
      activeColor,
      hoverColor,
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-3 rounded-xl transition-all duration-200 bg-transparent",
          isActive
            ? activeColor || "text-navy-900"
            : `text-slate-400 ${hoverColor || "hover:text-navy-900"}`,
          className,
        )}
      >
        <Icon className="w-5 h-5 stroke-[2.5]" />
        <span
          className={cn(
            "absolute left-full ml-4 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
            "bg-slate-900 text-white shadow-lg pointer-events-none",
            "opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[300]",
          )}
        >
          {label}
        </span>
      </motion.button>
    );
  },
);
DockIconButton.displayName = "DockIconButton";

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex flex-col items-center bg-white border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1.5 rounded-2xl gap-2",
          className,
        )}
      >
        {items.map((item) => (
          <DockIconButton key={item.label} {...item} />
        ))}
      </div>
    );
  },
);
Dock.displayName = "Dock";

export { Dock };
