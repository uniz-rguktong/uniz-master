"use client";

import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ className, children, delay = 1000 }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const childrenArray = React.Children.toArray(children);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;

      const observer = new IntersectionObserver(
        ([entry]) => setIsActive(entry.isIntersecting),
        { rootMargin: "80px", threshold: 0.1 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (!isActive || reduceMotion || childrenArray.length <= 1) return;

      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % childrenArray.length);
      }, delay);

      return () => clearInterval(interval);
    }, [childrenArray.length, delay, isActive, reduceMotion]);

    const itemsToShow = useMemo(() => {
      if (reduceMotion) {
        return childrenArray.slice(0, 3);
      }
      return childrenArray.slice(0, index + 1).reverse();
    }, [index, childrenArray, reduceMotion]);

    return (
      <div
        ref={containerRef}
        className={`flex flex-col items-center gap-4 ${className || ""}`}
      >
        <AnimatePresence initial={false}>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as ReactElement).key}>
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
  const reduceMotion = useReducedMotion();

  const animations = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { scale: 0.96, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.96, opacity: 0 },
        transition: { type: "spring" as const, stiffness: 400, damping: 35 },
      };

  return (
    <motion.div {...animations} className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
