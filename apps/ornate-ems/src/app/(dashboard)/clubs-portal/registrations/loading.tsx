import { MetricCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function RegistrationsLoading() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="mb-8">
        <Skeleton width={250} height={32} borderRadius={8} className="mb-6" />
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden p-6 space-y-4">
            <Skeleton width="40%" height={24} borderRadius={8} className="" />
            <div className="space-y-3">
              <Skeleton
                width="100%"
                height={40}
                borderRadius={8}
                className=""
              />
              <Skeleton
                width="100%"
                height={40}
                borderRadius={8}
                className=""
              />
              <Skeleton
                width="100%"
                height={40}
                borderRadius={8}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
