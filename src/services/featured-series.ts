import { db } from "@/db";
import { series, featuredSeries, seriesTags, tags } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { invalidateCache, cacheGetOrSet } from "@/lib/cache";

export interface SeriesHeroItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  tags: { id: number; name: string }[];
}

export interface FeaturedSeriesRow {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export async function getFeaturedSeries(): Promise<SeriesHeroItem[]> {
  return cacheGetOrSet("series:featured", 600, async () => {
    const items = await db
      .select({
        id: series.id,
        title: series.title,
        slug: series.slug,
        description: series.description,
        thumbnailUrl: series.thumbnailUrl,
        backdropUrl: series.backdropUrl,
      })
      .from(featuredSeries)
      .innerJoin(series, eq(featuredSeries.seriesId, series.id))
      .orderBy(asc(featuredSeries.displayOrder));

    if (items.length > 0) {
      const featuredIds = items.map((s) => s.id);
      const tagRows = await db
        .select({ seriesId: seriesTags.seriesId, id: tags.id, name: tags.name })
        .from(seriesTags)
        .innerJoin(tags, eq(seriesTags.tagId, tags.id))
        .where(inArray(seriesTags.seriesId, featuredIds));

      const tagsBySeries: Record<number, { id: number; name: string }[]> = {};
      for (const row of tagRows) {
        if (!tagsBySeries[row.seriesId]) tagsBySeries[row.seriesId] = [];
        tagsBySeries[row.seriesId].push({ id: row.id, name: row.name });
      }

      for (const item of items) {
        (item as Record<string, unknown>).tags = tagsBySeries[item.id] || [];
      }
    }

    return items as SeriesHeroItem[];
  });
}

export async function listAdminFeaturedSeries(): Promise<FeaturedSeriesRow[]> {
  return db
    .select({
      id: featuredSeries.id,
      seriesId: featuredSeries.seriesId,
      displayOrder: featuredSeries.displayOrder,
      title: series.title,
      slug: series.slug,
      thumbnailUrl: series.thumbnailUrl,
    })
    .from(featuredSeries)
    .innerJoin(series, eq(featuredSeries.seriesId, series.id))
    .orderBy(asc(featuredSeries.displayOrder));
}

export async function addFeaturedSeries(seriesId: number) {
  const [maxResult] = await db
    .select({ max: sql<number>`COALESCE(MAX(${featuredSeries.displayOrder}), -1)` })
    .from(featuredSeries);
  const nextOrder = (maxResult?.max ?? -1) + 1;
  const [created] = await db.insert(featuredSeries).values({ seriesId, displayOrder: nextOrder }).returning();
  invalidateCache("series-detail");
  return created;
}

export async function updateFeaturedSeriesOrder(id: number, displayOrder: number) {
  const [updated] = await db
    .update(featuredSeries)
    .set({ displayOrder })
    .where(eq(featuredSeries.id, id))
    .returning();
  if (!updated) return null;
  invalidateCache("series-detail");
  return updated;
}

export async function deleteFeaturedSeries(id: number) {
  const [deleted] = await db.delete(featuredSeries).where(eq(featuredSeries.id, id)).returning();
  if (!deleted) return false;
  invalidateCache("series-detail");
  return true;
}
