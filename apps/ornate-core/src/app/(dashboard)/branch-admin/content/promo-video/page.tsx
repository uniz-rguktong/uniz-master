"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BranchLogosPage } from "@/components/features/sports/views/BranchLogosPage";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "videos" ? "videos" : "logos";

  return (
    <BranchLogosPage
      defaultTab={activeTab}
      showTabNavigation
      tabOrder={["logos", "videos"]}
      tabLabels={{ logos: "Branch Logos", videos: "Promo Videos" }}
      onTabChange={(tab) =>
        router.replace(`/branch-admin/content/promo-video?tab=${tab}`)
      }
    />
  );
}
