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
            <div className="relative group/avatar">
              <motion.img
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHoveredIndex(item.id)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{
                  scale: 2.2,
                  rotate: 0,
                  zIndex: 100,
                  y: -20,
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
                  "object-cover !m-0 !p-0 object-top rounded-full border-2 relative transition-all duration-300 cursor-pointer shadow-sm",
                  index === 0
                    ? "h-14 w-14 border-blue-500 scale-105 z-30 bottom-0.5"
                    : index === 1
                      ? "h-12 w-12 border-white z-20"
                      : index === 2
                        ? "h-10 w-10 border-white z-10 top-1"
                        : "h-9 w-9 border-white z-0 top-1",
                  hoveredIndex === item.id
                    ? "border-sky-400 shadow-2xl ring-4 ring-sky-400/20"
                    : "",
                )}
              />
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
