"use client";

import React from "react";
import { ClientOnly } from "@/components/ClientOnly";

interface SafeDateProps {
  date: string | Date;
  className?: string;
  type?: "date" | "time";
}

export function SafeDate({ date, className, type = "date" }: SafeDateProps) {
  const d = new Date(date);

  // Stable ISO-like fallback for SSR to minimize layout shift if possible,
  // though ClientOnly will return null by default.
  const fallback = <span className={className}>...</span>;

  return (
    <ClientOnly fallback={fallback}>
      <div className={className}>
        {type === "date"
          ? d.toLocaleDateString()
          : d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
      </div>
    </ClientOnly>
  );
}
