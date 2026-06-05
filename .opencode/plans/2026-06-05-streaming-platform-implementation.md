# Streaming Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streaming platform with movie browsing, search, favorites, watch progress tracking, and settings.

**Architecture:** Drizzle ORM tables for movies/tags/history/favorites, Next.js App Router API routes with Better Auth session protection, shadcn UI client components with TanStack Query for data fetching.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL, Better Auth, shadcn UI, TanStack Query, Zustand

---

### Task 1: Add Streaming Tables to Drizzle Schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Add new table imports and table definitions**

```typescript
// Add to existing imports at top:
import {
  pgTable, text, timestamp, boolean, uniqueIndex, integer, serial, varchar, date, primaryKey,
} from "drizzle-orm/pg-core";

// After existing tables, add:

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  releaseDate: date("release_date"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const movieTags = pgTable("movie_tags", {
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.movieId, t.tagId] })]);

export const featuredMovies = pgTable("featured_movies", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .notNull()
    .unique()
    .references(() => movies.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  progressSeconds: integer("progress_seconds").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  watchedAt: timestamp("watched_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("unique_user_movie").on(t.userId, t.movieId)]);

export const favorites = pgTable("favorites", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.movieId] })]);

// Indexes
export const movieTagsTagIdIndex = uniqueIndex("idx_movie_tags_tag_id").on(movieTags.tagId);
export const watchHistoryUserRecentIndex = uniqueIndex("idx_watch_history_user_recent").on(watchHistory.userId, watchHistory.watchedAt);
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds (will have no type errors since no code references these tables yet).

- [ ] **Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add streaming DB tables (movies, tags, featured, history, favorites)"
```

---

### Task 2: Generate and Run Drizzle Migration

**Files:**
- Run: `drizzle-kit generate` + `drizzle-kit migrate` (or push)

- [ ] **Generate migration**

Run: `npx drizzle-kit generate`
Expected: Creates migration SQL file in `src/db/migrations/`

- [ ] **Push to DB**

Run: `npx drizzle-kit push`
Expected: Tables created in PostgreSQL. Verify with `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`

- [ ] **Commit**

```bash
git add src/db/
git commit -m "feat: add streaming DB migration"
```

---

### Task 3: Redirect Root Page to /home

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Replace root page with redirect**

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/home");
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect root / to /home"
```

---

### Task 4: Update Sidebar Navigation

**Files:**
- Modify: `src/components/dashboard-layout.tsx`

- [ ] **Update navItems and imports**

```typescript
import {
  Home,
  Search,
  Heart,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Explore", icon: Search, href: "/explore" },
  { label: "Favorites", icon: Heart, href: "/favorites" },
  { label: "Settings", icon: Settings, href: "/settings" },
];
```

- [ ] **Update the sidebar header link**

Change `render={<a href="/dashboard" />}` to `render={<a href="/home" />}` and update the label from "My App" to "StreamFlix" (or similar).

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/components/dashboard-layout.tsx
git commit -m "feat: update sidebar nav for streaming platform views"
```

---

### Task 5: Create Home API Route

**Files:**
- Create: `src/app/api/home/route.ts`

- [ ] **Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { featuredMovies, movies, watchHistory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [featured, continueWatching, recentlyAdded] = await Promise.all([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(featuredMovies)
        .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
        .orderBy(featuredMovies.displayOrder),

      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
          progressSeconds: watchHistory.progressSeconds,
          durationSeconds: movies.durationSeconds,
        })
        .from(watchHistory)
        .innerJoin(movies, eq(watchHistory.movieId, movies.id))
        .where(
          and(
            eq(watchHistory.userId, session.user.id),
            eq(watchHistory.isCompleted, false)
          )
        )
        .orderBy(desc(watchHistory.watchedAt))
        .limit(10),

      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .orderBy(desc(movies.createdAt))
        .limit(12),
    ]);

    return NextResponse.json({ featured, continueWatching, recentlyAdded });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/home/route.ts
git commit -m "feat: add GET /api/home with featured, continue watching, recent"
```

---

### Task 6: Create Movies Search/Filter API Route

**Files:**
- Create: `src/app/api/movies/route.ts`

- [ ] **Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieTags } from "@/db/schema";
import { ilike, and, lt, desc, inArray, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags");
  const cursor = parseInt(searchParams.get("cursor") || "0");
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    let conditions = [];

    if (q) {
      conditions.push(ilike(movies.title, `%${q}%`));
    }

    if (cursor > 0) {
      conditions.push(lt(movies.id, cursor));
    }

    let query = db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies);

    if (tagsParam) {
      const tagIds = tagsParam.split(",").map(Number);
      query = query
        .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
        .where(
          conditions.length > 0
            ? and(...conditions, inArray(movieTags.tagId, tagIds))
            : inArray(movieTags.tagId, tagIds)
        )
        .groupBy(movies.id)
        .having(sql`count(distinct ${movieTags.tagId}) = ${tagIds.length}`);
    } else if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query
      .orderBy(desc(movies.id))
      .limit(limit);

    const lastItem = result[result.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;

    return NextResponse.json({
      movies: result,
      nextCursor,
      hasMore: result.length === limit,
    });
  } catch {
    return NextResponse.json({ error: "Query Failed" }, { status: 500 });
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/movies/route.ts
git commit -m "feat: add GET /api/movies with search, tags, cursor pagination"
```

---

### Task 7: Create Movie Detail API Route

**Files:**
- Create: `src/app/api/movies/[slug]/route.ts`

- [ ] **Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, favorites } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const result = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        videoUrl: movies.videoUrl,
        thumbnailUrl: movies.thumbnailUrl,
        durationSeconds: movies.durationSeconds,
        releaseDate: movies.releaseDate,
        isFavorited: sql<boolean>`exists(select 1 from ${favorites} where ${eq(favorites.userId, session.user.id)} and ${eq(favorites.movieId, movies.id)})`,
      })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/movies/[slug]/route.ts
git commit -m "feat: add GET /api/movies/[slug] with favorited status"
```

---

### Task 8: Create Progress Tracking API Route

**Files:**
- Create: `src/app/api/movies/[id]/progress/route.ts`

- [ ] **Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { watchHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);
  if (isNaN(movieId)) {
    return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
  }

  const body = await request.json();
  const progressSeconds = body.progressSeconds as number;
  const isCompleted = body.isCompleted as boolean;

  if (typeof progressSeconds !== "number" || progressSeconds < 0) {
    return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, session.user.id),
          eq(watchHistory.movieId, movieId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(watchHistory)
        .set({
          progressSeconds,
          isCompleted: isCompleted ?? existing[0].isCompleted,
          watchedAt: new Date(),
        })
        .where(eq(watchHistory.id, existing[0].id));
    } else {
      await db.insert(watchHistory).values({
        userId: session.user.id,
        movieId,
        progressSeconds,
        isCompleted: isCompleted ?? false,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/movies/[id]/progress/route.ts
git commit -m "feat: add POST /api/movies/[id]/progress for watch tracking"
```

---

### Task 9: Create Favorites Toggle API Route

**Files:**
- Create: `src/app/api/favorites/toggle/route.ts`

- [ ] **Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId } = await request.json();
  if (typeof movieId !== "number") {
    return NextResponse.json({ error: "Invalid movieId" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.movieId, movieId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.movieId, movieId)
          )
        );
      return NextResponse.json({ isFavorited: false });
    } else {
      await db.insert(favorites).values({
        userId: session.user.id,
        movieId,
      });
      return NextResponse.json({ isFavorited: true });
    }
  } catch {
    return NextResponse.json({ error: "Toggle Failed" }, { status: 500 });
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/favorites/toggle/route.ts
git commit -m "feat: add POST /api/favorites/toggle"
```

---

### Task 10: Create Tags and Settings API Routes

**Files:**
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/users/history/route.ts`
- Create: `src/app/api/users/account/route.ts`

- [ ] **Create GET /api/tags**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.select().from(tags);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
```

- [ ] **Create DELETE /api/users/history**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { watchHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .delete(watchHistory)
      .where(eq(watchHistory.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
```

- [ ] **Create DELETE /api/users/account**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(user).where(eq(user.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/tags/route.ts src/app/api/users/
git commit -m "feat: add tags and settings API routes"
```

---

### Task 11: Create MovieCard Component

**Files:**
- Create: `src/components/movie-card.tsx`

- [ ] **Create the MovieCard component**

```typescript
"use client";

import Link from "next/link";

interface MovieCardProps {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  progressSeconds?: number;
  durationSeconds?: number;
}

export function MovieCard({
  title,
  slug,
  thumbnailUrl,
  progressSeconds,
  durationSeconds,
}: MovieCardProps) {
  const progress =
    progressSeconds && durationSeconds
      ? (progressSeconds / durationSeconds) * 100
      : 0;

  return (
    <Link href={`/movies/${slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={thumbnailUrl}
          alt={title}
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium truncate">{title}</h3>
    </Link>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/components/movie-card.tsx
git commit -m "feat: add MovieCard component"
```

---

### Task 12: Create HeroCarousel Component

**Files:**
- Create: `src/components/hero-carousel.tsx`

- [ ] **Create the HeroCarousel component**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface HeroCarouselProps {
  items: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
  }[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const length = items.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % length);
  }, [length]);

  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [length, next]);

  if (length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <Link href={`/movies/${items[current].slug}`}>
        <div className="relative aspect-video md:aspect-[21/9]">
          <img
            src={items[current].thumbnailUrl}
            alt={items[current].title}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              {items[current].title}
            </h2>
          </div>
        </div>
      </Link>
      {length > 1 && (
        <div className="absolute bottom-3 right-6 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`size-2 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/components/hero-carousel.tsx
git commit -m "feat: add HeroCarousel component with auto-play"
```

---

### Task 13: Create Home Page

**Files:**
- Create: `src/app/home/page.tsx`

- [ ] **Create the home page**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { HomeContent } from "./home-content";

export default async function HomePage() {
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
        <DashboardHeader title="Home" />
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <HomeContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Create the client component for data fetching**

Create `src/app/home/home-content.tsx`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { HeroCarousel } from "@/components/hero-carousel";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchHome() {
  const res = await fetch("/api/home");
  if (!res.ok) throw new Error("Failed to fetch home data");
  return res.json();
}

export function HomeContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHome,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="aspect-video md:aspect-[21/9] rounded-xl" />
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section>
        <HeroCarousel items={data.featured} />
      </section>

      {data.continueWatching?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {data.continueWatching.map((m: any) => (
              <div key={m.id} className="shrink-0 w-48">
                <MovieCard {...m} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {data.recentlyAdded.map((m: any) => (
            <div key={m.id} className="shrink-0 w-48">
              <MovieCard {...m} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/home/
git commit -m "feat: add home page with carousel and movie lists"
```

---

### Task 14: Create Explore Page

**Files:**
- Create: `src/app/explore/page.tsx`
- Create: `src/app/explore/explore-content.tsx`

- [ ] **Create server page**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { ExploreContent } from "./explore-content";

export default async function ExplorePage() {
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
        <DashboardHeader title="Explore" />
        <div className="flex-1 overflow-y-auto p-4">
          <ExploreContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Create the client component**

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchTags() {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

async function fetchMovies(params: string) {
  const res = await fetch(`/api/movies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  return res.json();
}

export function ExploreContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const buildParams = useCallback(
    (c: number | null) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      if (c) params.set("cursor", String(c));
      return params.toString();
    },
    [debouncedSearch, selectedTags]
  );

  useEffect(() => {
    setMovies([]);
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    fetchMovies(buildParams(null)).then((data) => {
      setMovies(data.movies);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setLoading(false);
    });
  }, [buildParams]);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          fetchMovies(buildParams(cursor)).then((data) => {
            setMovies((prev) => [...prev, ...data.movies]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
            setLoading(false);
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, buildParams]);

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search movies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {tags && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag: any) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {movies.map((m) => (
          <MovieCard key={m.id} {...m} />
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
      </div>
      <div ref={observerRef} className="h-4" />
    </div>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/explore/
git commit -m "feat: add explore page with search, tags, infinite scroll"
```

---

### Task 15: Create Movie Detail Page

**Files:**
- Create: `src/app/movies/[slug]/page.tsx`
- Create: `src/app/movies/[slug]/movie-detail-content.tsx`

- [ ] **Create server page**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { MovieDetailContent } from "./movie-detail-content";

export default async function MoviePage() {
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
        <DashboardHeader title="" />
        <div className="flex-1 overflow-y-auto p-4">
          <MovieDetailContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Create the client component**

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchMovie(slug: string) {
  const res = await fetch(`/api/movies/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch movie");
  return res.json();
}

async function toggleFavorite(movieId: number) {
  const res = await fetch("/api/favorites/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ movieId }),
  });
  if (!res.ok) throw new Error("Failed to toggle favorite");
  return res.json();
}

async function saveProgress(movieId: number, progressSeconds: number, isCompleted: boolean) {
  await fetch(`/api/movies/${movieId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progressSeconds, isCompleted }),
  });
}

export function MovieDetailContent() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<number>(0);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: () => fetchMovie(params.slug),
  });

  const favMutation = useMutation({
    mutationFn: () => toggleFavorite(movie.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", params.slug] });
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movie) return;

    const handleTimeUpdate = () => {
      progressRef.current = Math.floor(video.currentTime);
    };

    const handlePause = () => {
      const isEnded = video.ended;
      saveProgress(movie.id, progressRef.current, isEnded);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);

    const interval = setInterval(() => {
      if (progressRef.current > 0) {
        saveProgress(movie.id, progressRef.current, false);
      }
    }, 30000);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      clearInterval(interval);
      if (progressRef.current > 0) {
        saveProgress(movie.id, progressRef.current, false);
      }
    };
  }, [movie]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!movie) {
    return <p className="text-muted-foreground">Movie not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <video
        ref={videoRef}
        src={movie.videoUrl}
        controls
        className="w-full rounded-lg"
        poster={movie.thumbnailUrl}
      />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          {movie.releaseDate && (
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(movie.releaseDate).getFullYear()}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => favMutation.mutate()}
          disabled={favMutation.isPending}
        >
          <Heart
            className={movie.isFavorited ? "fill-red-500 text-red-500" : ""}
          />
        </Button>
      </div>
      {movie.description && (
        <p className="text-muted-foreground">{movie.description}</p>
      )}
    </div>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/movies/
git commit -m "feat: add movie detail page with player and favorites"
```

---

### Task 16: Create Favorites Page

**Files:**
- Create: `src/app/favorites/page.tsx`
- Create: `src/app/favorites/favorites-content.tsx`

- [ ] **Create server page**

```typescript
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
```

- [ ] **Create the client component**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchFavorites() {
  const res = await fetch("/api/movies?favorites=true");
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export function FavoritesContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const movies = data?.movies ?? [];

  if (movies.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        No favorites yet. Browse movies and add some!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {movies.map((m: any) => (
        <MovieCard key={m.id} {...m} />
      ))}
    </div>
  );
}
```

Wait - the favorites page fetches from `/api/movies?favorites=true` but I didn't add a favorites filter to the movies API. Let me adjust: the favorites page should use a dedicated API call or I need to add a `favorites` query param to the movies route.

Actually, let me simplify: favorites page can use a server-side fetch with Drizzle ORM directly (since it's a server component page that receives session info), or I need to add the favorites filter to the movies API.

Better approach: fetch favorites directly in a server component or add the favorites filter to the API. Let me use the server component approach since the page is already a server component.

Actually, wait - the page is a server component but the client component `FavoritesContent` uses TanStack Query. To keep it consistent with the other pages, I should either:
1. Add a `?favorites=true` parameter to the movies API
2. Create a separate `GET /api/favorites` route

Option 2 is cleaner. Let me update the plan to include that.

- [ ] **Add `GET /api/favorites` route (create `src/app/api/favorites/route.ts`)**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favorites, movies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(favorites)
      .innerJoin(movies, eq(favorites.movieId, movies.id))
      .where(eq(favorites.userId, session.user.id))
      .orderBy(desc(favorites.createdAt));

    return NextResponse.json({ movies: result });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
```

And update the FavoritesContent to fetch from `/api/favorites`.

Let me also fix: the movie detail page needs to create the `api/favorites/route.ts` alongside the toggle route.

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/api/favorites/route.ts src/app/favorites/
git commit -m "feat: add favorites page with dedicated API route"
```

---

### Task 17: Create Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Create the settings page**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
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
        <DashboardHeader title="Settings" />
        <div className="flex-1 overflow-y-auto p-4">
          <SettingsContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Create the client component**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Trash2, UserX, LogOut } from "lucide-react";

export function SettingsContent() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm("Clear all watch history?")) return;
    setClearing(true);
    try {
      await fetch("/api/users/history", { method: "DELETE" });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete your account and all data."
      )
    )
      return;
    setDeleting(true);
    try {
      await fetch("/api/users/account", { method: "DELETE" });
      authClient.signOut();
      router.push("/login");
    } catch {
      setDeleting(false);
    }
  };

  const handleSignOut = () => {
    router.push("/login");
    authClient.signOut();
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Watch History</h2>
        <Button
          variant="outline"
          onClick={handleClearHistory}
          disabled={clearing}
        >
          <Trash2 className="size-4 mr-2" />
          {clearing ? "Clearing..." : "Clear Watch History"}
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <Button
          variant="outline"
          onClick={handleSignOut}
        >
          <LogOut className="size-4 mr-2" />
          Sign Out
        </Button>
        <div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            <UserX className="size-4 mr-2" />
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add src/app/settings/
git commit -m "feat: add settings page with clear history, delete account"
```

---

### Task 18: Create Seed Script for Development Data

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Create seed script**

```typescript
import { db } from "../src/db";
import { movies, tags, movieTags, featuredMovies } from "../src/db/schema";
import * as schema from "../src/db/schema";

async function seed() {
  // Insert tags
  const tagData = await db.insert(tags).values([
    { name: "Action" },
    { name: "Sci-Fi" },
    { name: "Drama" },
    { name: "Comedy" },
    { name: "Thriller" },
    { name: "Horror" },
  ]).returning();

  // Insert sample movies
  const movieData = await db.insert(movies).values([
    {
      title: "The Last Frontier",
      slug: "the-last-frontier",
      description: "A thrilling journey through uncharted space.",
      videoUrl: "https://example.com/video1.mp4",
      thumbnailUrl: "https://picsum.photos/seed/movie1/640/360",
      durationSeconds: 7200,
      releaseDate: "2025-01-15",
    },
    {
      title: "Cyber City",
      slug: "cyber-city",
      description: "In a neon-drenched metropolis, one hacker fights the system.",
      videoUrl: "https://example.com/video2.mp4",
      thumbnailUrl: "https://picsum.photos/seed/movie2/640/360",
      durationSeconds: 5400,
      releaseDate: "2025-03-22",
    },
    {
      title: "The Deep Blue",
      slug: "the-deep-blue",
      description: "An oceanic expedition discovers something beneath the waves.",
      videoUrl: "https://example.com/video3.mp4",
      thumbnailUrl: "https://picsum.photos/seed/movie3/640/360",
      durationSeconds: 6600,
      releaseDate: "2024-11-08",
    },
    {
      title: "Parallel Worlds",
      slug: "parallel-worlds",
      description: "A scientist accidentally opens a doorway to an alternate reality.",
      videoUrl: "https://example.com/video4.mp4",
      thumbnailUrl: "https://picsum.photos/seed/movie4/640/360",
      durationSeconds: 7800,
      releaseDate: "2025-06-01",
    },
    {
      title: "Midnight Express",
      slug: "midnight-express",
      description: "A noir thriller set on the last train out of the city.",
      videoUrl: "https://example.com/video5.mp4",
      thumbnailUrl: "https://picsum.photos/seed/movie5/640/360",
      durationSeconds: 6000,
      releaseDate: "2024-09-14",
    },
  ]).returning();

  // Link movies to tags
  await db.insert(movieTags).values([
    { movieId: movieData[0].id, tagId: tagData[0].id }, // Action
    { movieId: movieData[0].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[1].id, tagId: tagData[0].id }, // Action
    { movieId: movieData[1].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[2].id, tagId: tagData[2].id }, // Drama
    { movieId: movieData[3].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[3].id, tagId: tagData[2].id }, // Drama
    { movieId: movieData[4].id, tagId: tagData[4].id }, // Thriller
  ]);

  // Set featured movies
  await db.insert(featuredMovies).values([
    { movieId: movieData[0].id, displayOrder: 0 },
    { movieId: movieData[1].id, displayOrder: 1 },
    { movieId: movieData[3].id, displayOrder: 2 },
  ]);

  console.log("Seed complete!");
}

seed().catch(console.error);
```

- [ ] **Run seed**

Run: `npx tsx scripts/seed.ts`
Expected: Outputs "Seed complete!". Verify with a quick DB query.

- [ ] **Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed script for development data"
```

---

### Task 19: Final Build Verification

- [ ] **Full build check**

Run: `npm run build`
Expected: All routes compile, no TypeScript errors, all page routes listed:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...all]
├ ƒ /api/favorites
├ ƒ /api/favorites/toggle
├ ƒ /api/home
├ ƒ /api/movies
├ ƒ /api/movies/[slug]
├ ƒ /api/movies/[id]/progress
├ ƒ /api/tags
├ ƒ /api/users/account
├ ƒ /api/users/history
├ ƒ /home
├ ƒ /explore
├ ƒ /favorites
├ ƒ /movies/[slug]
├ ƒ /settings
└ ○ /login
```

- [ ] **Commit any final fixes**

```bash
git add -A
git commit -m "chore: final build verification"
git push
```
