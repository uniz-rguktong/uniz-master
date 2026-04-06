"use client";
import { useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export const AnimatedTooltip = ({
  items,
  className,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
    url?: string;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const x = useMotionValue(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    x.set(event.clientX - rect.left - halfWidth);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item, index) => {
        const content = (
          <div
            className={cn(
              "-mr-3 relative group",
              index === 0 ? "z-30" : "z-20",
            )}
            key={item.name}
            onMouseEnter={() => setHoveredIndex(item.id)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative group/avatar flex flex-col items-center">
              <motion.img
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHoveredIndex(item.id)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{
                  scale: 1.1,
                  rotate: 0,
                  zIndex: 100,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 20,
                  mass: 0.8,
                }}
                src={item.image}
                alt={item.name}
                className={cn(
                  "object-cover !m-0 !p-0 object-top rounded-full border-2 relative transition-all duration-300 cursor-pointer shadow-sm h-14 w-14",
                  index === 0
                    ? "border-blue-500 z-30"
                    : index === 1
                      ? "border-white z-20"
                      : index === 2
                        ? "border-white z-10"
                        : "border-white z-0",
                  hoveredIndex === item.id
                    ? "border-sky-400 shadow-2xl ring-4 ring-sky-400/20"
                    : "",
                )}
              />
              <span
                className={cn(
                  "absolute top-full mt-2 text-[10px] font-bold text-slate-500 whitespace-nowrap transition-all duration-200 pointer-events-none tracking-wider",
                  hoveredIndex === item.id
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-1",
                )}
              >
                {item.name}
              </span>
            </div>
          </div>
        );

        if (item.url) {
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {content}
            </a>
          );
        }

        return content;
      })}
    </div>
  );
};
