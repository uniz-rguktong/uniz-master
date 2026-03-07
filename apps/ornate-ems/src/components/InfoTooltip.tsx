"use client";

import { Info } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

import React from "react";

export const InfoTooltip = React.memo(function InfoTooltip({
  text,
  size = "sm",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <Tooltip.Root>
      <Tooltip.Trigger className="text-[#9CA3AF]/60 hover:text-[#1A1A1A] transition-all focus:outline-none btn-interaction flex items-center justify-center cursor-pointer">
        <Info className={sizeClasses[size]} strokeWidth={2.5} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-10000 w-[280px] px-4 py-3 bg-[#1A1A1A] text-white text-[13px] rounded-xl shadow-xl select-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 whitespace-normal leading-relaxed text-left"
          side="bottom"
          sideOffset={8}
        >
          {text}
          <Tooltip.Arrow className="fill-[#1A1A1A]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
