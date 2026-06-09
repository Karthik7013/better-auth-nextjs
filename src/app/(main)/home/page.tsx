import { DashboardHeader } from "@/components/dashboard-header";
import { HomeContent } from "./home-content";
import { ProfileMenu } from "@/components/profile-menu";

export default async function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="StreamFlix" right={<ProfileMenu />} />
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <HomeContent />
      </div>
    </div>
  );
}
