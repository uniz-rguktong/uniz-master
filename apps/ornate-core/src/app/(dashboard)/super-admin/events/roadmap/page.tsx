import { TimelineRoadmapPage } from "@/components/features/admin/views/TimelineRoadmapPage";

export default function SuperAdminRoadmapPage() {
  return (
    <div>
      {/* We could add Super Admin specific filters here if needed, 
                but for now we use the standardized premium timeline view */}
      <TimelineRoadmapPage />
    </div>
  );
}
