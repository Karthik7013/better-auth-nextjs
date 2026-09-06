import { Skeleton } from "@/components/ui/skeleton";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS_6 = skeletonItems(6);

export default function ShortsLoading() {
  return (
    <div className="space-y-6 px-4 md:px-8 lg:px-12">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {SKELETON_ITEMS_6.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[9/16] rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
