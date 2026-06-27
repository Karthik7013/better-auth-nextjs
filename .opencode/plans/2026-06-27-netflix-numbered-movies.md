# Netflix-Style Numbered "Recently Added" Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the "Recently Added" horizontal scroll on the home page into a Netflix-style numbered card row (1–10) with SVG numbers, wider cards, and always-visible titles.

**Architecture:** A dedicated `NumberSVG` component renders bold digit paths as inline SVGs. The existing `RecentMovies` component is rewritten to compose each item as a flex row (SVG number + poster overlay), with the number extending behind the poster's left edge. Movie title is displayed below each card. API limit is capped at 10.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-nova), Lucide React

**Global Constraints:**
- Use the existing `--foreground` CSS variable for SVG fill color (inherit via `fill-current` / `text-foreground`)
- Card width: `w-64` (~256px) on desktop, responsive on mobile
- Poster aspect ratio: `aspect-[3/4]` (wider than current `aspect-[2/3]`)
- No JS carousel library — use native `overflow-x-auto` with `scroll-snap-x`
- Title below the card: `text-sm`, single-line truncation, `text-muted-foreground`
- API limit: `services/recent.ts` `.limit(12)` → `.limit(10)`
- SVG numbers use `<text>` elements with `fontWeight="900"` rendered at large scale via `viewBox`
- Follow existing code patterns: no new dependencies

---

### Task 1: Update API limit to 10

**Files:**
- Modify: `src/services/recent.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: API now returns max 10 movies (no other interface changes)

- [ ] **Step 1: Change limit**

In `src/services/recent.ts`, find `.limit(12)` and change to `.limit(10)`.

- [ ] **Step 2: Verify**

```bash
cd /home/karthi/workspace/better-auth-nextjs && grep -n "limit" src/services/recent.ts
```
Expected: `.limit(10)` on the query.

- [ ] **Step 3: Commit**

```bash
git add src/services/recent.ts
git commit -m "feat: cap recently added query at 10 movies"
```

---

### Task 2: Create `NumberSVG` component

**Files:**
- Create: `src/components/number-svg.tsx`

**Interfaces:**
- Consumes: nothing (self-contained)
- Produces: `<NumberSVG number={1..10} className="..." />` — renders an inline SVG of the number with bold geometric paths

**Design:** Uses SVG `<text>` elements with a heavy font weight (900) and large font size. The `viewBox` is sized large enough for "10" (the widest number). The component lets the browser render crisp, bold digits using the system's sans-serif font — identical to Netflix's approach.

- [ ] **Step 1: Implement `NumberSVG`**

Create `src/components/number-svg.tsx`:

```tsx
interface NumberSVGProps {
  number: number;
  className?: string;
}

export function NumberSVG({ number, className }: NumberSVGProps) {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMinYMid meet"
    >
      <text
        x="0"
        y="260"
        fontSize="320"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {number}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/number-svg.tsx
git commit -m "feat: add NumberSVG component for Netflix-style numbered cards"
```

---

### Task 3: Update loading skeleton

**Files:**
- Modify: `src/app/(main)/home/loading.tsx`

**Interfaces:**
- Consumes: new card dimensions (`w-64`, `aspect-[3/4]`)
- Produces: skeleton matches the numbered card layout

- [ ] **Step 1: Update the "Recently Added" skeleton section**

Replace the first `<section>` in `loading.tsx`:

```tsx
<section className="p-4">
  <Skeleton className="h-6 w-44 mb-4" />
  <div className="flex gap-4 overflow-x-auto pb-2 pl-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="shrink-0 w-64 space-y-2">
        <div className="flex items-start">
          <Skeleton className="h-24 w-16 mr-2" />
          <Skeleton className="aspect-3/4 flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/home/loading.tsx
git commit -m "feat: update loading skeleton for numbered card layout"
```

---

### Task 4: Rewrite `RecentMovies` component

**Files:**
- Modify: `src/app/(main)/home/recent-movies.tsx`

**Interfaces:**
- Consumes: `NumberSVG` from Task 2, `MovieCard` from existing, `HomeMovie` type
- Produces: a Netflix-style numbered horizontal scroll with titles

- [ ] **Step 1: Rewrite `recent-movies.tsx`**

```tsx
import { NumberSVG } from "@/components/number-svg";
import Image from "next/image";
import Link from "next/link";
import type { HomeMovie } from "./types";

export default function RecentMovies({ movies }: { movies: HomeMovie[] }) {
  if (movies.length === 0) return null;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
      <div className="flex gap-2 overflow-x-auto pb-4 pl-4 snap-x snap-mandatory scroll-pl-4">
        {movies.map((movie, index) => {
          const number = index + 1;
          return (
            <Link
              key={"ra-" + movie.id}
              href={`/movies/${movie.slug}`}
              className="group shrink-0 w-64 snap-start"
            >
              <div className="relative flex items-start">
                <div className="relative -ml-8 shrink-0 w-28 h-40 overflow-hidden">
                  <NumberSVG
                    number={number}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 h-56 w-auto text-foreground/90"
                  />
                </div>
                <div className="relative -ml-6 z-10 w-44 shrink-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-lg transition-transform group-hover:scale-105">
                    <Image
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 40vw, 176px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground truncate pl-2">
                {movie.title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

**Key layout details:**
- Each card is `w-64` with `snap-start` for scroll snapping
- The number SVG container is `w-28 h-40` with `overflow-hidden` — the SVG extends beyond the container on the left (`absolute -left-4`) and is vertically centered
- The poster sits in a `w-44` container with `-ml-6` to overlap the number
- The poster uses `aspect-[3/4]` and has `shadow-lg` for depth

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/home/recent-movies.tsx
git commit -m "feat: redesign Recently Added with Netflix-style numbered cards"
```
