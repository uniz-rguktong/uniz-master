"use client";

import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface TooltipProviderWrapperProps {
  children: ReactNode;
}

export function TooltipProviderWrapper({
  children,
}: TooltipProviderWrapperProps) {
  return <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>;
}
