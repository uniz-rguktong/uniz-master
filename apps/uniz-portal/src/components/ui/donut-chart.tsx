"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface DonutChartSegment {
  value: number;
  color: string; // Should be a valid CSS color (e.g., hsl(var(--primary)))
  label: string;
  [key: string]: any; // Allow other data
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  /** Minimum percentage for a segment to be visually visible (0-100) */
  minVisiblePercentage?: number;
  /** Callback function when a segment is hovered */
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 200,
      strokeWidth = 20,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
      highlightOnHover = true,
      centerContent,
      minVisiblePercentage = 4,
      onSegmentHover,
      className,
      ...props
    },
    ref
  ) => {
    const [hoveredSegment, setHoveredSegment] =
      React.useState<DonutChartSegment | null>(null);

    const internalTotalValue = React.useMemo(
      () =>
        propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue]
    );

    // Calculate visual segments ensuring small values are visible
    const visualSegments = React.useMemo(() => {
      if (internalTotalValue === 0) return [];
      
      const nonZeroSegments = data.filter(s => s.value > 0);
      if (nonZeroSegments.length === 0) return [];

      // If we have very skewed data, we ensure a minimum visibility for small segments
      let usedPercentage = 0;
      const countBelowMin = nonZeroSegments.filter(s => (s.value / internalTotalValue) * 100 < minVisiblePercentage).length;
      
      // Total percentage dedicated to small segments
      const totalMinAllocated = countBelowMin * minVisiblePercentage;
      const remainingPercentage = 100 - totalMinAllocated;
      
      const largeSegmentsTotalValue = nonZeroSegments
        .filter(s => (s.value / internalTotalValue) * 100 >= minVisiblePercentage)
        .reduce((sum, s) => sum + s.value, 0);

      let cumulative = 0;
      return data.map((segment) => {
        if (segment.value === 0) return { ...segment, visualPercentage: 0, visualOffset: 0 };

        const actualPercentage = (segment.value / internalTotalValue) * 100;
        let visualPercentage = actualPercentage;

        if (actualPercentage < minVisiblePercentage) {
          visualPercentage = minVisiblePercentage;
        } else if (largeSegmentsTotalValue > 0) {
          // Proportionally scale down large segments to make room for min-width small segments
          visualPercentage = (segment.value / largeSegmentsTotalValue) * remainingPercentage;
        }

        const offset = cumulative;
        cumulative += visualPercentage;
        
        return {
          ...segment,
          visualPercentage,
          visualOffset: offset
        };
      });
    }, [data, internalTotalValue, minVisiblePercentage]);

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    // Effect to call the onSegmentHover prop when internal state changes
    React.useEffect(() => {
      onSegmentHover?.(hoveredSegment);
    }, [hoveredSegment, onSegmentHover]);

    const handleMouseLeave = () => {
      setHoveredSegment(null);
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible -rotate-90" // Rotate to start at 12 o'clock
        >
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--border) / 0.5)" // Use theme variable for bg
            strokeWidth={strokeWidth}
          />
          
          {/* Data Segments */}
          <AnimatePresence>
            {visualSegments.map((segment, index) => {
              if (segment.visualPercentage === 0) return null;

              const strokeDasharray = `${(segment.visualPercentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (segment.visualOffset / 100) * circumference;
              
              const isActive = hoveredSegment?.label === segment.label;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset} // Negative offset to draw correctly
                  strokeLinecap="round" // Makes rounded edges
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{ 
                    opacity: 1, 
                    strokeDashoffset: -strokeDashoffset,
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: index * animationDelayPerSegment },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn(
                    "origin-center transition-transform duration-200",
                    highlightOnHover && "cursor-pointer"
                  )}
                  style={{
                    filter: isActive
                      ? `drop-shadow(0px 0px 6px ${segment.color}) brightness(1.1)`
                      : 'none',
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                    transition: "filter 0.2s ease-out, transform 0.2s ease-out",
                  }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Center Content */}
        {centerContent && (
          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              width: size - strokeWidth * 2.5, // Ensure content fits inside
              height: size - strokeWidth * 2.5,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  }
);

DonutChart.displayName = "DonutChart";

export { DonutChart };
