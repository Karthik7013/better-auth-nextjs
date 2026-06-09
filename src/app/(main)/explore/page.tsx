import { DashboardHeader } from "@/components/dashboard-header";
import { ExploreContent } from "./explore-content";

export default async function ExplorePage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Explore" />
      <div className="flex-1 overflow-y-auto p-4">
        <ExploreContent />
      </div>
    </div>
  );
}
