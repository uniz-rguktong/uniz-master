import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={32} borderRadius={8} />
          <Skeleton width={300} height={20} borderRadius={6} />
        </div>
        <Skeleton width={120} height={40} borderRadius={10} />
      </div>

      {/* Attendance List Skeleton */}
      <div className="bg-[#F4F2F0] rounded-[24px] p-3">
        <div className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between">
            <Skeleton width={200} height={40} borderRadius={8} />
            <div className="flex gap-2">
              <Skeleton width={100} height={40} borderRadius={8} />
              <Skeleton width={100} height={40} borderRadius={8} />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 border-b border-[#F9FAFB] flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div className="space-y-1">
                  <Skeleton width={150} height={16} />
                  <Skeleton width={100} height={12} />
                </div>
              </div>
              <Skeleton width={100} height={20} borderRadius={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
