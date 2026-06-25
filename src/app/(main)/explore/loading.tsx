import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-lg" />

          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="w-18 h-9 rounded-full" />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
