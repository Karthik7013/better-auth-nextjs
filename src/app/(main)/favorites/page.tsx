import { DashboardHeader } from "@/components/dashboard-header";
import { FavoritesContent } from "./favorites-content";

export default async function FavoritesPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Favorites" />
      <div className="flex-1 overflow-y-auto p-4">
        <FavoritesContent />
      </div>
    </div>
  );
}
