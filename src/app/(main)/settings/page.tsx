import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { RequireAuth } from "@/components/require-auth";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";

  return (
    <RequireAuth>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <SettingsContent isAdmin={isAdmin} />
        </div>
      </div>
    </RequireAuth>
  );
}
