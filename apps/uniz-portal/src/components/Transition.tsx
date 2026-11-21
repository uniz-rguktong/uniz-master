// Minimal utility for transitions that falls back to CSS logic mostly
// but keeps structure compatible if we ever want to re-add motion.
import { ReactNode } from "react";

interface TransitionProps {
 children: ReactNode;
 type?: "page" | "component" | "list" | "modal";
 delay?: number;
 className?: string; // Add className prop
}

export const PageTransition = ({ children, className }: TransitionProps) => {
 // Just a div wrapper that can accept classes - removing framer motion logic
 // We rely on simple CSS animations or no animation for sharpness.
 return (
 <div
 className={`duration-200 ease-out motion-safe:animate-in motion-safe:fade-in ${className || ""}`}
 >
 {children}
 </div>
 );
};

export const ListItemTransition = ({
 children,
}: {
 children: ReactNode;
 index?: number;
}) => {
 return (
 <div className="duration-150 ease-out motion-safe:animate-in motion-safe:fade-in">
 {children}
 </div>
 );
};
