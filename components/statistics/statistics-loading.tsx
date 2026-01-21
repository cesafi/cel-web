import { Skeleton } from '@/components/ui/skeleton';

export function StatisticsLoading() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-12" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
