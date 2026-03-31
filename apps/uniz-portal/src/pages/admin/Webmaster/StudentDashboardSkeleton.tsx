export default function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-10 animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-white rounded-xl border border-slate-100 p-10 flex flex-col items-center">
        <div className="w-40 h-40 rounded-full bg-slate-50 border border-slate-100 mb-6" />
        <div className="h-10 w-64 bg-slate-100 rounded-lg mb-4" />
        <div className="h-4 w-32 bg-slate-50 rounded-lg mb-10" />

        <div className="flex gap-10">
          <div className="h-12 w-32 bg-slate-50 rounded-lg" />
          <div className="h-12 w-32 bg-slate-50 rounded-lg" />
          <div className="h-12 w-32 bg-slate-50 rounded-lg" />
        </div>
      </div>

      {/* Graph Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[340px] bg-white rounded-xl border border-slate-100 p-8">
          <div className="h-6 w-32 bg-slate-100 rounded mb-4" />
          <div className="h-full w-full bg-slate-50 rounded-lg" />
        </div>
        <div className="h-[340px] bg-white rounded-xl border border-slate-100 p-8">
          <div className="h-6 w-32 bg-slate-100 rounded mb-4" />
          <div className="h-full w-full bg-slate-50 rounded-lg" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-xl border border-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
