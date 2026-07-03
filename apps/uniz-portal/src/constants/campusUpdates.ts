import type { CampusUpdate } from "@/hooks/useCampusUpdates";

/** Shown when the CMS API returns no visible updates (common on fresh local DB). */
export const CAMPUS_UPDATES_FALLBACK: CampusUpdate[] = [
  {
    id: "fallback-welcome",
    title: "Welcome to uniZ",
    content:
      "Your campus management system — sign in to access grades, attendance, and more.",
    link: "https://github.com/sreecharandesu/uniz",
    isVisible: true,
  },
];
