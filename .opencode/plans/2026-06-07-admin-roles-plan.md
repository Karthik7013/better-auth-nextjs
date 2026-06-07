# Admin Roles & Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user/admin role system with a full admin panel for content management (movies, tags, users).

**Architecture:** Use better-auth's built-in `admin` plugin for role-based access control (adds `role`, `banned`, `banReason`, `banExpires` to user table). Create an admin layout with sidebar navigation alongside the existing consumer bottom-tab layout. CRUD API routes for movies and tags are created server-side; admin pages consume them. Role is checked server-side on each admin page and API route.

**Tech Stack:** better-auth admin plugin, Next.js (App Router), Drizzle ORM, PostgreSQL, shadcn/ui components.

---

### Task 1: Enable Admin Plugin + DB Schema Migration

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-client.ts`
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add role/banned fields to user and impersonatedBy to session in DB schema**

Edit `src/db/schema.ts` — add to the `user` table after `image`:
```ts
role: text("role").default("user").notNull(),
banned: boolean("banned").default(false).notNull(),
banReason: text("ban_reason"),
banExpires: timestamp("ban_expires"),
```

Add to the `session` table after `userId`:
```ts
impersonatedBy: text("impersonated_by"),
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 3: Update server auth config to enable admin plugin**

Edit `src/lib/auth.ts` — add import and plugin:
```ts
import { admin } from "better-auth/plugins/admin";
```

Add to the `betterAuth({})` config inside the plugins array:
```ts
plugins: [
  admin({
    defaultRole: "user",
    adminRoles: ["admin"],
  }),
],
```

- [ ] **Step 4: Update client auth client to include admin client**

Edit `src/lib/auth-client.ts`:
```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/plugins/admin";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

- [ ] **Step 5: Run build to verify**

```bash
npm run build
```
Expected: Build passes, no TypeScript errors.

---

### Task 2: Create Admin Layout

**Files:**
- Create: `src/components/admin-layout.tsx`
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create the admin layout component**

Create `src/components/admin-layout.tsx` with:
- Left sidebar (hidden on mobile) with nav links: Dashboard, Movies, Tags, Users
- Back-to-app link at top
- Bottom tab bar for mobile
- Main content area fills remaining space

- [ ] **Step 2: Create admin root layout with role guard**

Create `src/app/admin/layout.tsx` — server component that:
- Fetches session via `auth.api.getSession`
- Redirects to `/login` if unauthenticated, `/home` if not admin
- Wraps children in `<AdminLayout>`

---

### Task 3: Create API Routes for Movie CRUD

**Files:**
- Create: `src/app/api/admin/movies/route.ts`
- Create: `src/app/api/admin/movies/[id]/route.ts`

- [ ] **Step 1: Create movie list + create endpoint**

`GET /api/admin/movies` — returns paginated movie list with search support
`POST /api/admin/movies` — creates a movie with title, slug, description, videoUrl, thumbnailUrl, durationSeconds, releaseDate, optional tagIds

Both check admin role via session header.

- [ ] **Step 2: Create movie update + delete endpoint**

`PUT /api/admin/movies/[id]` — updates movie fields
`DELETE /api/admin/movies/[id]` — deletes movie

---

### Task 4: Create API Routes for Tag CRUD

**Files:**
- Create: `src/app/api/admin/tags/route.ts`
- Create: `src/app/api/admin/tags/[id]/route.ts`

- [ ] **Step 1: Create tag list + create endpoint**

`GET /api/admin/tags` — returns all tags sorted by name
`POST /api/admin/tags` — creates a tag with name

Both check admin role.

- [ ] **Step 2: Create tag update + delete endpoint**

`PUT /api/admin/tags/[id]` — updates tag name
`DELETE /api/admin/tags/[id]` — deletes tag

---

### Task 5: Create Admin Dashboard Page

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create server component that queries counts**

Query `user`, `movies`, `tags` tables for row counts. Display in stat cards with icons.

---

### Task 6: Create Admin Movies Page

**Files:**
- Create: `src/app/admin/movies/page.tsx` (server wrapper)
- Create: `src/app/admin/movies/movies-content.tsx` (client component)
- Create: `src/app/admin/movies/movie-form.tsx` (client component)

- [ ] **Step 1: Create movies list page**

MoviesContent fetches from `/api/admin/movies`, shows a searchable table with title, slug, duration, and edit/delete actions.

- [ ] **Step 2: Create movie form modal**

MovieForm is a modal dialog for creating/editing a movie with fields: title, slug, description, videoUrl, thumbnailUrl, durationSeconds, releaseDate.

---

### Task 7: Create Admin Tags Page

**Files:**
- Create: `src/app/admin/tags/page.tsx` (server wrapper)
- Create: `src/app/admin/tags/tags-content.tsx` (client component)

- [ ] **Step 1: Create tags management page**

Inline CRUD — add new tag via input+button, edit in-place (pencil icon switches row to input), delete with confirmation.

---

### Task 8: Create Admin Users Page

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create users management page**

Client component using `authClient.admin.listUsers()`, `authClient.admin.setRole()`, `authClient.admin.removeUser()`. Shows table with name, email, role badge. Actions: toggle admin role, delete user.

---

### Task 9: Add Admin Entry Point

**Files:**
- Modify: `src/app/settings/settings-content.tsx`

- [ ] **Step 1: Add admin link in settings (visible to admins only)**

Add a "Administration" card with a link to `/admin` in settings. This is only shown if the session user's role is "admin" — check via `authClient.useSession()`.

---

### Task 10: Verify Build

- [ ] **Step 1: Run full build**

```bash
npm run build
```
Expected: Build passes with no errors (pre-existing warnings acceptable).

---

## Execution Plan

Two approaches to execute:

**A) Subagent-Driven (recommended)** — I dispatch independent tasks in parallel (e.g., Tasks 3-4 API routes can be built together, Tasks 5-6-7-8 admin pages can be built together after the layout exists)

**B) Inline Execution** — Sequential execution with checkpoints

Which approach do you prefer?
