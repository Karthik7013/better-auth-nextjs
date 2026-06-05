# Streaming Platform — Full-Stack Design Spec

## Overview

A Next.js streaming platform web app with Better Auth (Google OAuth), Drizzle ORM +
PostgreSQL, shadcn UI. Users browse movies via a carousel home page, search/filter grid,
favorites, and watch with progress tracking.

## Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Redirect to `/home` | — |
| `/login` | Google sign-in (existing) | No |
| `/home` | Home — carousel + continue watching + recently added | Yes |
| `/explore` | Search + tag filter + paginated grid | Yes |
| `/favorites` | Favorited movies grid | Yes |
| `/movies/[slug]` | Movie detail + video player | Yes |
| `/settings` | Clear history, delete account | Yes |

Sidebar nav: Home, Explore, Favorites, Settings.

## Database Layer

Tables added to `src/db/schema.ts`:

### movies
- `id` serial PK
- `title` varchar(255) not null
- `slug` varchar(255) unique not null
- `description` text
- `videoUrl` text not null (Cloudinary .mp4 URL)
- `thumbnailUrl` text not null (Cloudinary poster URL)
- `durationSeconds` integer not null
- `releaseDate` date
- `createdAt` timestamptz default now
- `updatedAt` timestamptz default now

### tags
- `id` serial PK
- `name` varchar(50) unique not null
- `createdAt` timestamptz default now

### movie_tags (M:N bridge)
- `movieId` integer FK → movies.id (cascade)
- `tagId` integer FK → tags.id (cascade)
- PK (movieId, tagId)

### featured_movies
- `id` serial PK
- `movieId` integer FK → movies.id (cascade), unique
- `displayOrder` integer default 0 not null
- `createdAt` timestamptz default now
- Carousel ordering via `ORDER BY displayOrder ASC`

### watch_history
- `id` serial PK
- `userId` text FK → user.id (cascade)
- `movieId` integer FK → movies.id (cascade)
- `progressSeconds` integer default 0 not null
- `isCompleted` boolean default false not null
- `watchedAt` timestamptz default now
- Unique index on (userId, movieId)

### favorites
- `userId` text FK → user.id (cascade)
- `movieId` integer FK → movies.id (cascade)
- `createdAt` timestamptz default now
- PK (userId, movieId)

### Indexes
- `slug` unique constraint handles movie lookups
- `idx_movie_tags_tag_id` on movie_tags(tagId)
- `idx_watch_history_user_recent` on watch_history(userId, watchedAt DESC)

## API Layer

All routes are session-protected via `auth.api.getSession()` and use Drizzle ORM.

### `GET /api/home`
Parallel fetch of 3 payloads:
- **featured**: `featured_movies` JOIN `movies` ORDER BY displayOrder ASC
- **continueWatching**: `watch_history` JOIN `movies` WHERE userId = session.user.id AND isCompleted = false ORDER BY watchedAt DESC LIMIT 10
- **recentlyAdded**: `movies` ORDER BY createdAt DESC LIMIT 12

### `GET /api/movies?q=&tags=1,2&cursor=0&limit=12`
- `q`: ilike search on movie title
- `tags`: comma-separated tag IDs for intersection filter
- `cursor`: last movie ID for cursor-based pagination
- Returns `{ movies, nextCursor, hasMore }`

### `GET /api/movies/[slug]`
- Single movie with `isFavorited` boolean for current user

### `POST /api/movies/[id]/progress`
- Body: `{ progressSeconds, isCompleted }`
- Upsert via `onConflictDoUpdate`

### `POST /api/favorites/toggle`
- Body: `{ movieId }`
- If exists → delete; else → insert
- Returns `{ isFavorited }`

### `GET /api/tags`
- All tags for explore filter chips

### `DELETE /api/users/history`
- Deletes ALL watch_history rows for the session user

### `DELETE /api/users/account`
- Deletes the user row (FK cascade handles sessions, accounts, history, favorites)

## Frontend Views

### Layout
- `DashboardLayout` (existing sidebar) wraps all protected pages
- Each page is a server component that checks the session and redirects to `/login` if unauthenticated

### Home (`/home`)
1. **HeroCarousel** — client component, cycles featured movies, auto-play + dot nav, shows thumbnail overlay
2. **ContinueWatching** — horizontal scrollable row, progress bar on each card
3. **RecentlyAdded** — horizontal scrollable row of cards

### Explore (`/explore`)
- Tag chips (horizontal filter row)
- Debounced search input
- Responsive grid (2-4 columns)
- IntersectionObserver infinite scroll (loads next cursor batch)

### Movie Detail (`/movies/[slug]`)
- HTML5 `<video>` player with Cloudinary URL
- Title, description, metadata, tag badges
- Favorite toggle button
- Progress tracking: POST progress every 30s via `setInterval`

### Favorites (`/favorites`)
- Grid of favorited movies (same card component as home/explore)
- No video loaded until navigating to detail page

### Settings (`/settings`)
- "Clear Watch History" button with confirm
- "Delete Account" button with confirm
- Sign out button (existing)
- All actions redirect to `/login` on completion

## Navigation & Sidebar

Update `navItems` in `dashboard-layout.tsx`:
- Home (`/home`, `Home`)
- Explore (`/explore`, `Search`)
- Favorites (`/favorites`, `Heart`)
- Settings (`/settings`, `Settings`)

## Data Flow

1. Server component checks session → if null, redirect to `/login`
2. Fetch data from API routes (which validate session server-side)
3. Client components handle interactivity (carousel, infinite scroll, progress, favorites)
4. Progress saves are debounced/throttled to avoid flooding

## Out of Scope

- Admin panel for movie creation (future)
- Video upload to Cloudinary
- User registration (Google OAuth only)
