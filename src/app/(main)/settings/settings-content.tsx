import UserProfile from "./user-profile";
import ChangePassword from "./change-password";
import ClearWatchHistory from "./clear-watch-history";
import AdminNavigation from "./admin-navigation";
import DangerZone from "./danger-zone";

export function SettingsContent({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <UserProfile />
      <ChangePassword />
      <ClearWatchHistory />
      {isAdmin && <AdminNavigation />}
      <DangerZone />
    </div>
  );
}
