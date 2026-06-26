# Vercel RES Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve Vercel Real Experience Score from 89 (Needs Improvement) to 90+ (Good) for Desktop.

**Architecture:** 6 targeted, independent changes across a Next.js 16 streaming app — remove heavy third-party JS, reduce DOM/image count, add HTTP caching headers, and optimize priority image loading. Each change is self-contained and independently verifiable.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Upstash Redis, Vercel

## Global Constraints

- All changes must preserve existing visual appearance and functionality
- No breaking changes to API response shapes
- TypeScript strict mode must not be violated
- Build must produce zero errors

---

### Task 1: Remove Chatbase Chatbot Script

**Files:**
- Modify: `src/app/layout.tsx` — remove lines 74 (the `<Script id="chatbase">` block) and the `import Script from "next/script"`

**Rationale:** Eliminates ~200KB+ of third-party JavaScript that blocks the main thread. Single highest-ROI change for both LCP and INP.

- [ ] **Step 1: Remove the chatbase `<Script>` tag**

Delete the `<Script id="chatbase">` component and the `import Script from "next/script"` import.

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "perf: remove chatbase chatbot script (saves ~200KB JS)"
```

---

### Task 2: Reduce Poster Grid Image Count

**Files:**
- Modify: `src/components/poster-grid.tsx:43`

**Rationale:** 40 `<Image>` components with CSS animation creates DOM/GPU overhead. Reducing to 20 cuts DOM nodes in half while preserving the visual effect.

- [ ] **Step 1: Change default count from 40 to 20**

Change `function PosterGrid({ count = 40 }: PosterGridProps)` to `function PosterGrid({ count = 20 }: PosterGridProps)`.

- [ ] **Step 2: Commit**

```bash
git add src/components/poster-grid.tsx
git commit -m "perf: reduce poster grid from 40 to 20 images"
```

---

### Task 3: Add HTTP Cache Headers to API Routes

**Files:**
- Modify: `src/app/api/home/featured/route.ts`
- Modify: `src/app/api/home/recently-added/route.ts`
- Modify: `src/app/api/home/continue-watching/route.ts`
- Modify: `src/app/api/movies/route.ts` (may exist)
- Modify: `src/app/api/tags/route.ts` (may exist)

**Rationale:** Vercel's edge network respects `Cache-Control` headers. Adding them lets CDN cache responses, reducing TTFB for repeat visits.

- [ ] **Step 1: Add cache headers to each route**

For public data routes add: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`

For user-specific routes (continue-watching): `Cache-Control: private, max-age=60, s-maxage=0`

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/
git commit -m "perf: add Cache-Control headers to API routes for Vercel edge caching"
```

---

### Task 4: Add `fetchPriority` to Priority Images

**Files:**
- Modify: `src/components/poster-grid.tsx`
- Modify: `src/components/hero-carousel.tsx`

**Rationale:** `fetchPriority="high"` tells the browser to prioritize loading of hero/LCP images over other resources, improving LCP.

- [ ] **Step 1: Add fetchPriority to PosterCard images**

Conditionally set `fetchPriority={priority ? "high" : "auto"}` on `<Image>` in poster-grid.

- [ ] **Step 2: Add fetchPriority to HeroCarousel images**

Conditionally set `fetchPriority={i === 0 ? "high" : "auto"}` on both `<Image>` components in hero-carousel.

- [ ] **Step 3: Build and verify**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/poster-grid.tsx src/components/hero-carousel.tsx
git commit -m "perf: add fetchPriority high to LCP candidate images"
```

---

### Task 5: Remove NavigationProgress Component

**Files:**
- Modify: `src/components/providers.tsx` — remove import and usage

**Rationale:** NavigationProgress adds 103 lines of client JS to every page load. Cosmetic progress bar for route transitions — non-essential.

- [ ] **Step 1: Remove NavigationProgress from Providers**

Remove `import { NavigationProgress }` and `<NavigationProgress />` from JSX.

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/providers.tsx
git commit -m "perf: remove NavigationProgress client component (saves 103 lines JS)"
```

---

### Task 6: Add Explicit `loading="lazy"` to Non-Priority Images

**Files:**
- Modify: `src/components/poster-grid.tsx`

**Rationale:** Ensures all non-priority images explicitly use lazy loading.

- [ ] **Step 1: Add loading attribute**

Add `loading={priority ? "eager" : "lazy"}` to `<Image>` in poster-grid.

- [ ] **Step 2: Commit**

```bash
git add src/components/poster-grid.tsx
git commit -m "perf: explicit loading attributes on images"
```
