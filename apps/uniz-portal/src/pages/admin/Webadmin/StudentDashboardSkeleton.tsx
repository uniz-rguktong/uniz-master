export default function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      {/* Hero Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-md bg-tint" />
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-tint" />
          <div className="h-5 w-56 animate-pulse rounded-md bg-tint" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-tint" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="h-11 w-28 animate-pulse rounded-md bg-tint" />
        <div className="h-11 w-36 animate-pulse rounded-md bg-tint" />
        <div className="h-11 w-32 animate-pulse rounded-md bg-tint" />
      </div>

      <div className="rounded-xl border border-border bg-panel p-4 min-[821px]:p-8">
        <div className="h-8 w-24 animate-pulse rounded-md bg-tint" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded-md bg-tint" />
              <div className="h-6 w-32 animate-pulse rounded-md bg-tint" />
            </div>
          ))}
        </div>
      </div>

      {/* Graph Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[340px] animate-pulse rounded-md bg-tint" />
        <div className="h-[340px] animate-pulse rounded-md bg-tint" />
      </div>

      {/* Stats Skeleton */}
      <div className="h-28 animate-pulse rounded-md bg-tint" />
    </div>
  );
}
