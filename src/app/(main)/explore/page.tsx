import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ExploreContent } from "./explore-content";

export default async function ExplorePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <ExploreContent isAdmin={isAdmin} />
      </div>
    </div>
  );
}
