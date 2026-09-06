import { Skeleton } from "@/components/ui/skeleton";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS_10 = skeletonItems(10);

export default function ExploreLoading() {
  return (
    <div className="space-y-6 px-4 md:px-8 lg:px-12">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {SKELETON_ITEMS_10.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
