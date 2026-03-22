"use client";
import { useState } from "react";
import {
    motion,
    useTransform,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "framer-motion";
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

    const springConfig = { stiffness: 100, damping: 5 };
    const x = useMotionValue(0);
    const rotate = useSpring(
        useTransform(x, [-100, 100], [-45, 45]),
        springConfig
    );
    const translateX = useSpring(
        useTransform(x, [-100, 100], [-50, 50]),
        springConfig
    );
    const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const halfWidth = rect.width / 2;
        x.set(event.clientX - rect.left - halfWidth);
    };


    return (
        <div className={cn("flex items-center gap-2", className)}>
            {items.map((item) => {
                const content = (
                    <div
                        className="-mr-4 relative group"
                        key={item.name}
                        onMouseEnter={() => setHoveredIndex(item.id)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <AnimatePresence mode="popLayout">
                            {hoveredIndex === item.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.6 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 10,
                                        },
                                    }}
                                    exit={{ opacity: 0, y: 20, scale: 0.6 }}
                                    style={{
                                        translateX: translateX,
                                        rotate: rotate,
                                        whiteSpace: "nowrap",
                                    }}
                                    className="absolute -top-16 left-1/2 -translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-xl bg-slate-900/90 backdrop-blur-md text-white z-50 shadow-2xl px-4 py-2 border border-white/20"
                                >
                                    <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-sky-400 to-transparent h-[2px] blur-[1px]" />
                                    <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent h-px" />
                                    <div className="font-bold text-white relative z-30 text-base flex items-center gap-1.5">
                                        {item.name}
                                        {item.id === 1 && (
                                            <motion.div
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                                            />
                                        )}
                                    </div>
                                    <div className="text-slate-300 text-[9px] font-bold tracking-widest uppercase">
                                        {item.designation}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="relative group/avatar">
                            <motion.img
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => {
                                    setHoveredIndex(item.id);
                                }}
                                onMouseLeave={() => {
                                    setHoveredIndex(null);
                                }}
                                whileHover={{ 
                                    scale: item.id === 1 ? 1.45 : 1.35, 
                                    rotate: item.id === 1 ? 4 : (item.id % 2 === 0 ? 5 : -5),
                                    zIndex: 60 
                                }}
                                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                                src={item.image}
                                alt={item.name}
                                className={cn(
                                    "object-cover !m-0 !p-0 object-top rounded-full h-10 w-10 border-2 relative transition-all duration-500 cursor-pointer shadow-sm",
                                    hoveredIndex === item.id 
                                        ? "border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.3)]" 
                                        : "border-white z-20 grayscale-[0.35] hover:grayscale-0",
                                    item.id === 1 && "ring-[3px] ring-sky-500/5 ring-offset-0"
                                )}
                            />
                            {item.id === 1 && (
                                <div className="absolute -inset-[2px] rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all duration-1000 pointer-events-none ring-[1.5px] ring-sky-400/40 blur-[0.5px]" />
                            )}
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
