"use client";

import React, { useEffect, useMemo, useState, type ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface AnimatedListProps {
    className?: string;
    children: React.ReactNode;
    delay?: number;
}

export const AnimatedList = React.memo(
    ({ className, children, delay = 3500 }: AnimatedListProps) => {
        const [index, setIndex] = useState(0);
        const childrenArray = React.Children.toArray(children);

        useEffect(() => {
            if (childrenArray.length === 0) return;
            const interval = setInterval(() => {
                setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length);
            }, delay);

            return () => clearInterval(interval);
        }, [childrenArray.length, delay]);

        const itemsToShow = useMemo(() => {
            // Show all items up to the current index in reverse chronological order
            // This makes it seem as if the latest item pushes the older ones down
            return childrenArray.slice(0, index + 1).reverse();
        }, [index, childrenArray]);

        return (
            <div className={cn("flex flex-col gap-4", className)}>
                <AnimatePresence initial={false}>
                    {itemsToShow.map((item) => (
                        <AnimatedListItem key={(item as ReactElement).key || Math.random()}>
                            {item}
                        </AnimatedListItem>
                    ))}
                </AnimatePresence>
            </div>
        );
    },
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
    const animations = {
        initial: { scale: 0.9, opacity: 0, y: -20 },
        animate: { scale: 1, opacity: 1, y: 0, originY: 0 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring" as const, stiffness: 350, damping: 40 },
    };

    return (
        <motion.div {...animations} layout className="w-full">
            {children}
        </motion.div>
    );
}
