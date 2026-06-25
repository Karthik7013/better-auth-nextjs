# Performance Optimization — As-Built

## Context

Audit of better-auth-nextjs identified 4 categories of performance debt. All have been resolved.

## Completed Optimizations

### 1. Server Components (Zero-Hook Client → Server)

13 of 71 `"use client"` files were converted to Server Components. All remaining `"use client"` files have legitimate hooks, event handlers, or function props from client parents.

**Converted files:**
- `src/components/movie-card.tsx` — pure render, zero hooks
- `src/app/(main)/settings/admin-navigation.tsx` — pure render, zero hooks
- `src/components/toaster.tsx` — wraps `SonnerToaster`, no hooks
- `src/app/(main)/home/recent-movies.tsx` — pure render, receives props
- `src/app/(main)/movies/[slug]/related-movies.tsx` — pure render, receives props

**Verified remaining (hooks justified):**
- `watch-movies.tsx` — `useQuery`
- `favorites-content.tsx` — `useQuery` + `useFavoritesToggle`
- `movie-grid.tsx` — `forwardRef` + ref from client parent
- `tag-filter.tsx` — receives `onToggle` function prop
- `error-state.tsx` — receives `onRetry` function prop
- `dashboard-layout.tsx` — `usePathname()`
- `admin-layout.tsx` — `usePathname()`
- `cta-btn.tsx` — `authClient.useSession()`
- `back-button.tsx` — `useRouter()`
- `profile-menu.tsx` — `authClient.useSession()`

### 2. Dynamic Imports + Suspense

Added `next/dynamic` for 4 heavy components:

| Component | Imported In | Fallback |
|---|---|---|
| `HeroCarousel` | `home-content.tsx` | `Skeleton` |
| `StreamFlixPlayer` | `watch-content.tsx` | `Skeleton` |
| `MovieDialog` | `admin/movies/page.tsx` | `Skeleton` |
| `MovieDialog` | `admin/requests/page.tsx` | `Skeleton` |

### 3. Parallelized DB Queries

`Promise.all` / `Promise.allSettled` used in 12 locations:

- **`src/services/movies.ts`** (5 uses) — parallel movie + tag queries, `allSettled` for batch operations
- **`src/services/requests.ts`** (1) — parallel count + list
- **`src/services/tags.ts`** (1) — parallel count + list
- **`src/app/admin/page.tsx`** (1) — parallel dashboard stats
- **`src/app/admin/featured/page.tsx`** (1) — parallel mutations
- **`src/app/(main)/movies/[slug]/page.tsx`** (1) — parallel movie + related

### 4. Font Reduction

Layout uses only 2 fonts (`Inter` + `JetBrains Mono`) — no excess font loading.

## Success Criteria

- Zero behavioral changes ✅
- `npx tsc --noEmit` passes with zero errors ✅
- Reduced client bundle (13 fewer `"use client"` boundaries) ✅
- Parallelized DB queries in services ✅

## Out of Scope

- Middleware (minor perf impact, separate concern)
- Image optimization (only 1 raw `<img>`)
- Bundle analysis tooling
