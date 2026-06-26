# Vercel RES Optimization Design

## Problem

Vercel Speed Insights reports a Real Experience Score (RES) of 89 ("Needs Improvement") for Desktop, just below the 90 "Good" threshold. The exact contributing Core Web Vital metrics (LCP, INP, CLS, TTFB) are not clearly differentiated, so all dimensions must be addressed.

## Project Context

**StreamFlix** — a movie/series streaming application built with:
- Next.js 16 (App Router)
- better-auth (authentication)
- Drizzle ORM + Postgres
- Upstash Redis (caching)
- TanStack Query (client data fetching)
- Tailwind CSS v4 + shadcn/ui
- Vercel (Analytics + Speed Insights)
- Chatbase chatbot (third-party)

## Proposed Changes

### 1. Remove Chatbase Chatbot Script
- **File:** `src/app/layout.tsx:74`
- **Action:** Delete the entire `<Script id="chatbase">` block and unused `import Script`
- **Impact:** Eliminates ~200KB+ of third-party JS. Largest single improvement to LCP and INP.

### 2. Reduce Poster Grid Image Count
- **File:** `src/components/poster-grid.tsx:43`
- **Action:** Default `count` from 40 to 20
- **Impact:** Halves DOM nodes in hero background animation, reduces GPU load.

### 3. Add HTTP Cache Headers to API Routes
- **Files:** `src/app/api/home/*/route.ts`, movies, tags routes
- **Action:** Add `Cache-Control` headers to leverage Vercel edge CDN
- **Impact:** Reduces TTFB for repeat visits by serving cached responses.

### 4. Add `fetchPriority` to Priority Images
- **Files:** `src/components/poster-grid.tsx`, `src/components/hero-carousel.tsx`
- **Action:** Set `fetchPriority="high"` on above-the-fold LCP candidate images
- **Impact:** Browser prioritizes critical image loading, improving LCP.

### 5. Remove NavigationProgress Component
- **File:** `src/components/providers.tsx`
- **Action:** Remove unused `NavigationProgress` import and JSX
- **Impact:** Removes 103 lines of unnecessary client JS from every page.

### 6. Explicit `loading` Attribute on Images
- **File:** `src/components/poster-grid.tsx`
- **Action:** Set `loading={priority ? "eager" : "lazy"}` explicitly
- **Impact:** Ensures consistent image loading behavior across browsers.

## Expected Outcome

A combined improvement of approximately 5-15 points on the RES score, pushing it from 89 to well above 90 ("Good").
