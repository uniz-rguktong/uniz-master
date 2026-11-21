import { createContext, useContext } from "react";
import type { SiteDraft } from "@/lib/preview-protocol";

export type SiteContextValue = SiteDraft & {
  ready: boolean;
  authorized: boolean;
  activeRegion: string | null;
  select: (region: string) => void;
  patch: (region: string, value: unknown) => void;
};

export const SiteContext = createContext<SiteContextValue | null>(null);

export function useSiteContent(): SiteContextValue {
  const value = useContext(SiteContext);
  if (!value) {
    throw new Error("Site content is only available inside the campus layout");
  }
  return value;
}
