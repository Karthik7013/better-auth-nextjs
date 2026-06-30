# Series Home Page Design

## Overview

Create a series home page at `/series` with featured series and top-10 sections (mirroring the movie home page pattern at `/home`). Move the existing series search/browse page to `/series/explore`.

## Navigation

| Route | Current | New |
|-------|---------|-----|
| `/series` | Search/browse | Series home (featured + top 10) |
| `/series/explore` | — | Series search/browse (moved from `/series`) |
| `/home` | Movies home | Unchanged |
| `/explore` | Movies search/browse | Unchanged |
| Bottom nav | Series → `/series` | Stays `/series` (now home page) |

## 1. Database

New `featured_series` table (mirrors `featured_movies`):

```sql
CREATE TABLE featured_series (
  id        SERIAL PRIMARY KEY,
  series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  "order"   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

Drizzle schema: add to `src/db/schema.ts`.

## 2. Service Layer

New file `src/services/featured-series.ts` (mirrors `src/services/featured.ts`):

- `getFeaturedSeries()` — Joins `featured_series` → `series` with tags, ordered by `order`. Cached at `series:featured` for 600s.

New file `src/services/series-recent.ts` (mirrors `src/services/recent.ts`):

- `getTop10Series()` — `SELECT * FROM series ORDER BY createdAt DESC LIMIT 10`. Cached at `series:top-10` for 600s.

Exported types: `SeriesHeroItem` (id, title, slug, description, backdropUrl, thumbnailUrl, tags) and `SeriesCardItem` (id, title, slug, thumbnailUrl).

## 3. API Routes

- `GET /api/series/featured` — Returns `{ featured: SeriesHeroItem[] }`. Requires auth (like existing series routes).
- `GET /api/series/top-10` — Returns `{ top10: SeriesCardItem[] }`. Requires auth.

Both use `cacheGetOrSet` with 600s TTL.

## 4. Series Home Page

### New file: `src/app/(main)/series/series-home-content.tsx`

Pattern matches `home-content.tsx`:

| State | Handling |
|-------|----------|
| **Loading** | Skeleton hero (full-width backdrop) + skeleton cards row |
| **Error** | `<ErrorState>` with retry button (refetches both queries) |
| **Empty** | "No featured series yet" / "No series added yet" |
| **Render** | Featured series in `<HeroCarousel>` + Top 10 in styled row with `<NumberSVG>` |

### Reuse existing components

- `<HeroCarousel>` — accepts `HeroCarouselItem[]`. Series data shapes match the interface (id, title, slug, description, backdropUrl, thumbnailUrl, tags).
- `<NumberSVG>` — already used in `RecentMovies` for the top-10 numbered list.
- `<SeriesCard>` — existing component, used if we need a different card style.

### Search bar

At the top of the page, a search icon/input. On submit (enter key or icon tap), navigates to `/series/explore?q=searchterm`. The existing `SeriesContent` at `/series/explore` already handles the `q` query param.

### "Browse All Series" link

Below the top-10 section, a "Browse All Series" button that navigates to `/series/explore` (no query — shows all series).

## 5. Move Search to `/series/explore`

- Create `src/app/(main)/series/explore/page.tsx` — imports `<SeriesContent />`
- `src/app/(main)/series/page.tsx` — now renders `<SeriesHomeContent />`
- No changes to `SeriesContent` itself

## 6. Admin — Featured Series UI

New admin page at `/admin/featured-series` (mirrors `/admin/featured`):

- Drag-to-reorder list of featured series with thumbnails
- "Add Series" dialog with search/autocomplete
- Remove from featured with confirmation

## 7. Files Changed

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `featuredSeries` table |
| `src/services/featured-series.ts` | New: `getFeaturedSeries()` + admin CRUD |
| `src/services/series-recent.ts` | New: `getTop10Series()` |
| `src/app/api/series/featured/route.ts` | New API route |
| `src/app/api/series/top-10/route.ts` | New API route |
| `src/app/api/admin/featured-series/route.ts` | New admin API route |
| `src/app/(main)/series/page.tsx` | Now renders `SeriesHomeContent` |
| `src/app/(main)/series/series-home-content.tsx` | New: home page client component |
| `src/app/(main)/series/explore/page.tsx` | New: search/browse page |
| `src/app/(main)/series/types.ts` | Add `SeriesHeroItem`, `SeriesCardItem` types |
| `src/app/admin/featured-series/page.tsx` | New admin page |
| `src/components/dashboard-layout.tsx` | No change needed (link stays `/series`) |
