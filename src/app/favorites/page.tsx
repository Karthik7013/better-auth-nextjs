import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { FavoritesContent } from "./favorites-content";

export default async function FavoritesPage() {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    redirect("/login");
  }
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        <DashboardHeader title="Favorites" />
        <div className="flex-1 overflow-y-auto p-4">
          <FavoritesContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
