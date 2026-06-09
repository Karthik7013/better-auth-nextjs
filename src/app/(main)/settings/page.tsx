import { DashboardHeader } from "@/components/dashboard-header";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader title="Settings" />
      <div className="flex-1 overflow-y-auto p-4">
        <SettingsContent />
      </div>
    </div>
  );
}
