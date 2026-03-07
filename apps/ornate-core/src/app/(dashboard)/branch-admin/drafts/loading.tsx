import { Skeleton } from "@/components/ui/skeleton";

export default function BranchDraftsLoading() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      <Skeleton width={200} height={32} borderRadius={8} className="mb-6" />
      <Skeleton width="100%" height={420} borderRadius={16} />
    </div>
  );
}
