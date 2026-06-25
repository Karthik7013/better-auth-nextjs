import { db } from "@/db";
import { movies } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getRecentlyAdded() {
  return db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    })
    .from(movies)
    .orderBy(desc(movies.createdAt))
    .limit(12);
}
