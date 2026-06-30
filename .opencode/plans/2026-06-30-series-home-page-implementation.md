# Series Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a series home page at `/series` with featured series hero + top-10 section, move the existing search/browse to `/series/explore`, and add admin management for featured series.

**Architecture:** Mirror the movies home page pattern. New `featured_series` DB table, two new service functions (`getFeaturedSeries`, `getTop10Series`), two new public API routes, a new admin CRUD API + page, and a new client component `SeriesHomeContent`. The existing `SeriesContent` moves to `/series/explore` without changes.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Postgres, Upstash Redis cache, Tailwind CSS v4, shadcn/ui

---

## File Structure

### New files:
- `src/app/(main)/series/series-home-content.tsx` — Home page client component
- `src/app/(main)/series/explore/page.tsx` — Wrapper for existing `SeriesContent`
- `src/services/featured-series.ts` — `getFeaturedSeries()` + admin CRUD
- `src/services/series-recent.ts` — `getTop10Series()`
- `src/app/api/series/featured/route.ts` — Public featured API
- `src/app/api/series/top-10/route.ts` — Public top-10 API
- `src/app/api/admin/featured-series/route.ts` — Admin list/add API
- `src/app/api/admin/featured-series/[id]/route.ts` — Admin update/delete API
- `src/app/admin/featured-series/page.tsx` — Admin featured series page

### Modified files:
- `src/db/schema.ts` — Add `featuredSeries` table
- `src/app/(main)/series/page.tsx` — Replace `SeriesContent` with `SeriesHomeContent`
- `src/components/admin-layout.tsx` — Add "Featured Series" nav item

---

### Task 1: Add `featured_series` table to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Add the `featuredSeries` table after the `seriesTags` table**

Find the `seriesTags` export and add after it:

```typescript
export const featuredSeries = pgTable("featured_series", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id")
    .notNull()
    .references(() => series.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("idx_featured_series_series_id").on(t.seriesId),
]);

export type FeaturedSeries = typeof featuredSeries.$inferSelect;
export type FeaturedSeriesInsert = typeof featuredSeries.$inferInsert;
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 2: Create `getFeaturedSeries()` and admin CRUD service

**Files:**
- Create: `src/services/featured-series.ts`

- [ ] **Create the service file**

```typescript
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
        .select({ seriesId: seriesTags.movieId, id: tags.id, name: tags.name })
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
  invalidateCache("series");
  return created;
}

export async function updateFeaturedSeriesOrder(id: number, displayOrder: number) {
  const [updated] = await db
    .update(featuredSeries)
    .set({ displayOrder })
    .where(eq(featuredSeries.id, id))
    .returning();
  if (!updated) return null;
  invalidateCache("series");
  return updated;
}

export async function deleteFeaturedSeries(id: number) {
  const [deleted] = await db.delete(featuredSeries).where(eq(featuredSeries.id, id)).returning();
  if (!deleted) return false;
  invalidateCache("series");
  return true;
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 3: Create `getTop10Series()` service

**Files:**
- Create: `src/services/series-recent.ts`

- [ ] **Create the service file**

```typescript
import { db } from "@/db";
import { series } from "@/db/schema";
import { desc } from "drizzle-orm";
import { cacheGetOrSet } from "@/lib/cache";

export interface SeriesCardItem {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export async function getTop10Series(): Promise<SeriesCardItem[]> {
  return cacheGetOrSet("series:top-10", 600, async () => {
    return db
      .select({
        id: series.id,
        title: series.title,
        slug: series.slug,
        thumbnailUrl: series.thumbnailUrl,
      })
      .from(series)
      .orderBy(desc(series.createdAt))
      .limit(10);
  });
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 4: Create public API routes

**Files:**
- Create: `src/app/api/series/featured/route.ts`
- Create: `src/app/api/series/top-10/route.ts`

- [ ] **Create `/api/series/featured` route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getFeaturedSeries } from "@/services/featured-series";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const featured = await getFeaturedSeries();
    return NextResponse.json({ featured }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("api/series/featured error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
```

- [ ] **Create `/api/series/top-10` route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getTop10Series } from "@/services/series-recent";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const top10 = await getTop10Series();
    return NextResponse.json({ top10 }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("api/series/top-10 error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 5: Create the Series Home Page component

**Files:**
- Create: `src/app/(main)/series/series-home-content.tsx`

- [ ] **Create `SeriesHomeContent`**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/error-state";
import HeroCarousel from "@/components/hero-carousel";
import { NumberSVG } from "@/components/number-svg";
import { SeriesCard } from "@/components/series-card";
import type { SeriesHeroItem } from "@/services/featured-series";
import type { SeriesCardItem } from "@/services/series-recent";

export default function SeriesHomeContent() {
  const router = useRouter();

  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["series-featured"],
    queryFn: async () => {
      const res = await fetch("/api/series/featured");
      if (!res.ok) throw new Error("Failed to load featured series.");
      return res.json() as Promise<{ featured: SeriesHeroItem[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const {
    data: top10Data,
    isLoading: top10Loading,
    isError: top10Error,
    refetch: refetchTop10,
  } = useQuery({
    queryKey: ["series-top-10"],
    queryFn: async () => {
      const res = await fetch("/api/series/top-10");
      if (!res.ok) throw new Error("Failed to load top 10 series.");
      return res.json() as Promise<{ top10: SeriesCardItem[] }>;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const featured = featuredData?.featured ?? [];
  const top10 = top10Data?.top10 ?? [];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    if (q?.trim()) {
      router.push(`/series/explore?q=${encodeURIComponent(q.trim())}`);
    }
  }

  if (featuredLoading || top10Loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto space-y-12">
          <div>
            <Skeleton className="h-[75vh] w-full rounded-lg" />
          </div>
          <div className="px-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-48 space-y-2">
                  <Skeleton className="aspect-2/3 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featuredError || top10Error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <ErrorState
          message={
            featuredError && top10Error
              ? "Failed to load series. Check your connection."
              : featuredError
                ? "Failed to load featured series."
                : "Failed to load top 10 series."
          }
          onRetry={() => { refetchFeatured(); refetchTop10(); }}
        />
      </div>
    );
  }

  return (
    <>
      <section>
        <HeroCarousel items={featured} />
      </section>

      <div className="px-4 md:px-8 lg:px-12 pb-6">
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search series..."
            className="pl-9"
          />
        </form>
      </div>

      <section className="px-4 md:px-8 lg:px-12 pb-8">
        <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
        {top10.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">No series added yet.</p>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-4 snap-x snap-mandatory scroll-pl-4">
            {top10.map((s, index) => (
              <div key={s.id} className="group shrink-0 snap-start">
                <div className="flex items-center">
                  <NumberSVG number={index + 1} />
                  <div className={`relative z-10 w-44 shrink-0 ${index > 0 ? "-ml-16" : "-ml-4"}`}>
                    <SeriesCard title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="px-4 md:px-8 lg:px-12 pb-8">
        <button
          onClick={() => router.push("/series/explore")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse All Series →
        </button>
      </div>
    </>
  );
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript errors — `SeriesHeroItem` is imported from the services file which is also new. May need to fix the import path if the build complains. If `SeriesHeroItem` isn't exported from `featured-series.ts`, export it there.

---

### Task 6: Update series page.tsx and create explore route

**Files:**
- Modify: `src/app/(main)/series/page.tsx`
- Create: `src/app/(main)/series/explore/page.tsx`

- [ ] **Update `series/page.tsx` to render `SeriesHomeContent`**

Replace the entire file:

```typescript
import SeriesHomeContent from "./series-home-content";

export default function SeriesPage() {
  return <SeriesHomeContent />;
}
```

- [ ] **Create `series/explore/page.tsx`**

```typescript
import { SeriesContent } from "../series-content";

export default function SeriesExplorePage() {
  return (
    <div className="p-4">
      <SeriesContent />
    </div>
  );
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 7: Create admin API routes for featured series

**Files:**
- Create: `src/app/api/admin/featured-series/route.ts`
- Create: `src/app/api/admin/featured-series/[id]/route.ts`

- [ ] **Create admin featured-series list/create route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminFeaturedSeries, addFeaturedSeries } from "@/services/featured-series";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await listAdminFeaturedSeries();
    return NextResponse.json({ featured: result }, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch featured series" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { seriesId } = body;

    if (!seriesId) {
      return NextResponse.json({ error: "seriesId is required" }, { status: 400 });
    }

    const created = await addFeaturedSeries(seriesId);
    return NextResponse.json({ featured: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: "Series is already featured" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add featured series" }, { status: 500 });
  }
}
```

- [ ] **Create admin featured-series [id] route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateFeaturedSeriesOrder, deleteFeaturedSeries } from "@/services/featured-series";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { displayOrder } = body;

    const updated = await updateFeaturedSeriesOrder(parseInt(id), displayOrder);
    if (!updated) {
      return NextResponse.json({ error: "Featured series not found" }, { status: 404 });
    }

    return NextResponse.json({ featured: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update featured series" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteFeaturedSeries(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Featured series not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete featured series" }, { status: 500 });
  }
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 8: Create admin featured series page

**Files:**
- Create: `src/app/admin/featured-series/page.tsx`

- [ ] **Create the admin page**

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Film, ArrowUp, ArrowDown, Trash2, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FeaturedSeries = {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

type SeriesResult = {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

export default function FeaturedSeriesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery<FeaturedSeries[]>({
    queryKey: ["admin-featured-series"],
    queryFn: async () => {
      const res = await fetch("/api/admin/featured-series");
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      return data.featured || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery<SeriesResult[]>({
    queryKey: ["admin-series-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/admin/series?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.series || [];
    },
    enabled: !!searchQuery,
    staleTime: 30 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (seriesId: number) => {
      const res = await fetch("/api/admin/featured-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId }),
      });
      if (!res.ok) throw new Error();
    },
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const searchData = queryClient.getQueryData<SeriesResult[]>(["admin-series-search", searchQuery]) || [];
      const matching = searchData.find((s) => s.id === seriesId);
      if (!matching) return { previous };
      const optimistic: FeaturedSeries = {
        id: -Date.now(), seriesId, displayOrder: previous.length,
        title: matching.title, slug: matching.slug, thumbnailUrl: matching.thumbnailUrl,
      };
      queryClient.setQueryData(["admin-featured-series"], [...previous, optimistic]);
      return { previous };
    },
    onError: (_err, _movieId, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSuccess: () => { setAddOpen(false); setSearchQuery(""); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/featured-series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      queryClient.setQueryData(["admin-featured-series"], previous.filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/featured-series/${current[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[swapIdx].displayOrder }),
        }),
        fetch(`/api/admin/featured-series/${current[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[index].displayOrder }),
        }),
      ]);
      if (!res1.ok || !res2.ok) throw new Error();
    },
    onMutate: async ({ index, direction }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      if ((direction === "up" && index === 0) || (direction === "down" && index === previous.length - 1)) return { previous };
      const items = [...previous];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      [items[index], items[swapIdx]] = [items[swapIdx], items[index]];
      queryClient.setQueryData(["admin-featured-series"], items);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const handleAdd = useCallback((seriesId: number) => addMutation.mutate(seriesId), [addMutation]);
  const handleRemove = useCallback((id: number) => removeMutation.mutate(id), [removeMutation]);
  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(() => new Set(featured.map((f) => f.seriesId)), [featured]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Series</h1>
          <p className="text-muted-foreground mt-1">Manage which series appear on the series home page.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button><Plus className="size-4 mr-2" />Add Series</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Featured Series</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search series..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => !alreadyFeaturedIds.has(s.id) && handleAdd(s.id)}
                      disabled={alreadyFeaturedIds.has(s.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                    >
                      {s.thumbnailUrl ? (
                        <Image src={s.thumbnailUrl} alt={s.title} width={40} height={40} className="size-10 rounded object-cover" />
                      ) : (
                        <div className="size-10 rounded bg-muted flex items-center justify-center"><Film className="size-4 text-muted-foreground" /></div>
                      )}
                      <span className="font-medium truncate flex-1">{s.title}</span>
                      {alreadyFeaturedIds.has(s.id) && <span className="text-xs text-muted-foreground">Already featured</span>}
                    </button>
                  ))
                ) : searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No series found.</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Type to search series.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0 max-h-150">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="size-10 rounded-md shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                  <div className="flex gap-1 shrink-0">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Star className="size-10 mx-auto mb-3 opacity-30" />
              <p>No featured series yet.</p>
              <p className="text-sm mt-1">Click &ldquo;Add Series&rdquo; to feature series on the home page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium w-[50%]">Series</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {featured.map((item, index) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl ? (
                            <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={item.thumbnailUrl} alt={item.title} width={40} height={40} className="size-full object-cover" />
                            </div>
                          ) : (
                            <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Film className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">#{item.displayOrder + 1}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleSwap(index, "up")} disabled={index === 0}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleSwap(index, "down")} disabled={index === featured.length - 1}>
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleRemove(item.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 9: Add "Featured Series" to admin sidebar

**Files:**
- Modify: `src/components/admin-layout.tsx`

- [ ] **Add nav item**

Add to the `navItems` array, after `{ label: "Featured", icon: Star, href: "/admin/featured" }`:

```typescript
{ label: "Featured Series", icon: Star, href: "/admin/featured-series" },
```

Note: You'll need to import `Tv` icon since `Star` is already imported.

- [ ] **Run build to verify**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: TypeScript + build pass

---

### Task 10: Full build verification

- [ ] **Run full build**

Run: `cd "C:\Users\karth\Desktop\better-auth-nextjs" && npm run build`
Expected: All routes compile, TypeScript passes
