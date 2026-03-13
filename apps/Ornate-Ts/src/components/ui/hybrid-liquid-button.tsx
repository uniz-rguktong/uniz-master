"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
    motion,
    useAnimationFrame,
    useMotionTemplate,
    useMotionValue,
    useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * LIQUID GLASS LOGIC
 */
const liquidbuttonVariants = cva(
    "inline-flex items-center transition-colors justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default: "bg-transparent hover:scale-105 duration-300 transition text-white",
                destructive: "bg-destructive text-white hover:bg-destructive/90",
                outline: "border border-input bg-background hover:bg-accent",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 text-xs gap-1.5 px-4",
                lg: "h-10 rounded-md px-6",
                xl: "h-12 rounded-md px-8",
                xxl: "h-14 rounded-md px-10",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "xxl",
        },
    }
);

function GlassFilter() {
    return (
        <svg className="hidden">
            <defs>
                <filter
                    id="hybrid-glass"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    colorInterpolationFilters="sRGB"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.05 0.05"
                        numOctaves="1"
                        seed="1"
                        result="turbulence"
                    />
                    <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="blurredNoise"
                        scale="70"
                        xChannelSelector="R"
                        yChannelSelector="B"
                        result="displaced"
                    />
                    <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
                    <feComposite in="finalBlur" in2="finalBlur" operator="over" />
                </filter>
            </defs>
        </svg>
    );
}

/**
 * MOVING BORDER LOGIC
 */
export const MovingBorder = ({
    children,
    duration = 3000,
    rx,
    ry,
    ...otherProps
}: {
    children: React.ReactNode;
    duration?: number;
    rx?: string;
    ry?: string;
    [key: string]: any;
}) => {
    const pathRef = useRef<any>(null);
    const progress = useMotionValue<number>(0);

    useAnimationFrame((time) => {
        const length = pathRef.current?.getTotalLength();
        if (length) {
            const pxPerMillisecond = length / duration;
            progress.set((time * pxPerMillisecond) % length);
        }
    });

    const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x);
    const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y);

    const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="absolute h-full w-full"
                width="100%"
                height="100%"
                {...otherProps}
            >
                <rect
                    fill="none"
                    width="100%"
                    height="100%"
                    rx={rx}
                    ry={ry}
                    ref={pathRef}
                />
            </svg>
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "inline-block",
                    transform,
                }}
            >
                {children}
            </motion.div>
        </>
    );
};

/**
 * HYBRID HYBRID LIQUID GLASS + MOVING BORDER BUTTON
 */
export function HybridLiquidButton({
    className,
    variant,
    size,
    asChild = false,
    children,
    duration = 3000,
    borderRadius = "0.75rem",
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof liquidbuttonVariants> & {
        asChild?: boolean;
        duration?: number;
        borderRadius?: string;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <div className="relative group p-[2px] overflow-hidden" style={{ borderRadius }}>
            {/* Moving Border Layer */}
            <div className="absolute inset-0 z-0">
                <MovingBorder duration={duration} rx="40%" ry="40%">
                    <div className="h-20 w-20 opacity-[0.8] bg-[radial-gradient(var(--color-neon)_40%,transparent_60%)]" />
                </MovingBorder>
            </div>

            {/* Main Button with Liquid Glass Effect */}
            <Comp
                data-slot="button"
                className={cn(
                    "relative z-10 w-full h-full",
                    liquidbuttonVariants({ variant, size, className })
                )}
                style={{ borderRadius: `calc(${borderRadius} - 2px)` }}
                {...props}
            >
                {/* Glass Background - Shadow removed as per user request */}
                <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full 
        transition-all 
        bg-black/60 backdrop-blur-md"
                    style={{ borderRadius: `calc(${borderRadius} - 2px)` }}
                />

                {/* Distortion Filter Layer */}
                <div
                    className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden"
                    style={{
                        borderRadius: `calc(${borderRadius} - 2px)`,
                        backdropFilter: 'url("#hybrid-glass")'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center pointer-events-none">
                    {children}
                </div>

                <GlassFilter />
            </Comp>
        </div>
    );
}
