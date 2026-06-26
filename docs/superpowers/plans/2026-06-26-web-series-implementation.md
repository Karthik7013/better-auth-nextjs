# Web Series Implementation Plan

**Goal:** Add web series as a separate content type (series → seasons → episodes) with full admin CRUD, user-facing pages, and player integration.

**Architecture:** 4 new DB tables, services layer, 12 admin API routes, 2 user API routes, admin UI pages, user-facing browse/detail/player pages, nav updates.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL, Tailwind CSS, shadcn/ui, @tanstack/react-query

## Global Constraints
- No changes to existing tables — fully additive
- No watch history, no favorites for series
- Manual entry only (no TMDB)
- Follow existing code patterns exactly
- Reuse existing components: UploadField, SearchInput, Pagination, DataTable, ErrorState, Card, Button, Skeleton
- Admin routes: return 401 if `session.user.role !== "admin"`
- User API routes: auth via `getCachedSession`
- Slugs: `^[a-z0-9-]+$`

---

### Task 1: DB Schema + Migration
- Append `series`, `seasons`, `episodes`, `seriesTags` tables to `src/db/schema.ts`
- Generate + apply migration: `npx drizzle-kit generate && npx drizzle-kit migrate`

### Task 2: Cache Scope
- Add `series: ["series:*", "series-list:*"]` to `INVALIDATION_KEYS` in `src/lib/cache.ts`

### Task 3: Services Layer
- Create `src/services/series.ts` — full CRUD for series, seasons, episodes
- Functions: listSeries, getSeriesBySlug, createSeries, updateSeries, deleteSeries, listAdminSeries, createSeason, updateSeason, deleteSeason, createEpisode, updateEpisode, deleteEpisode, validateSlug

### Task 4: Admin API Routes (12 files)
- `src/app/api/admin/series/route.ts` — GET list, POST create
- `src/app/api/admin/series/[id]/route.ts` — PUT update, DELETE
- `src/app/api/admin/series/[id]/seasons/route.ts` — GET list, POST create
- `src/app/api/admin/series/[id]/seasons/[sid]/route.ts` — PUT, DELETE
- `src/app/api/admin/series/[id]/seasons/[sid]/episodes/route.ts` — GET list, POST create
- `src/app/api/admin/series/[id]/seasons/[sid]/episodes/[eid]/route.ts` — PUT, DELETE

### Task 5: User API Routes (2 files)
- `src/app/api/series/route.ts` — GET list/search/filter
- `src/app/api/series/[slug]/route.ts` — GET detail with seasons+episodes

### Task 6: Admin UI Pages
- `src/app/admin/series/page.tsx` — series list (same pattern as movies page)
- `src/app/admin/series/series-dialog.tsx` — create/edit dialog with inline season/episode management
- `src/app/admin/series/series-table.tsx` — data table
- `src/app/admin/series/delete-series-dialog.tsx` — delete confirmation

### Task 7: Nav + Components
- `src/components/series-card.tsx` — card component (poster + season count badge)
- Modify `src/components/admin-layout.tsx` — add "Series" nav item (Tv icon, between Movies and Featured)
- Modify `src/components/dashboard-layout.tsx` — add "Series" tab (Tv icon, between Explore and Favorites)

### Task 8: User-Facing Pages
- `src/app/(main)/series/page.tsx` — browse grid with tag filter + search
- `src/app/(main)/series/[slug]/page.tsx` — detail page with hero + season accordion + episode list
- `src/app/(main)/watch/series/[slug]/page.tsx` — player page

### Task 9: Player Integration
- Load series context in watch page (fetch series detail, find current episode from query params)
- Wire next-episode navigation in StreamflixPlayer
- Add episode selector in player UI
