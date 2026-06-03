# Better Auth + Next.js + Drizzle ORM Setup

## Objective
Initialize a blank Next.js application with Google OAuth-only authentication using Better Auth, Drizzle ORM, and PostgreSQL, following the steps defined in `setup.md` exactly.

## Architecture

### Layers
1. **Database Layer** — PostgreSQL via `postgres` driver + `drizzle-orm`. Schema: `user`, `session`, `account` tables.
2. **Auth Layer** — Better Auth server engine (`src/lib/auth.ts`) configured with Drizzle adapter and Google social provider only. No email/password, no magic links.
3. **API Layer** — Catch-all route handler at `src/app/api/auth/[...all]/route.ts` exposing Better Auth endpoints via `toNextJsHandler`.
4. **Client SDK** — `authClient` via `better-auth/react` for browser-side sign-in calls.
5. **Pages**
   - `/login` — Client component with "Continue with Google" button.
   - `/dashboard` — Server component that checks session via headers, redirects to `/login` if unauthenticated, displays user profile.

### Data Flow
```
Browser click → authClient.signIn.social("google")
  → redirects to Google OAuth consent screen
  → callback hits /api/auth/[...all] handler
  → Better Auth validates tokens, creates/updates user/session/account rows
  → redirects to /dashboard with session cookie
  → Dashboard server component reads session via auth.api.getSession(headers)
  → renders user profile or redirects to /login
```

## File Inventory
1. `.env.local` — Placeholder env variables
2. `drizzle.config.ts` — Drizzle Kit config
3. `src/db/schema.ts` — User, session, account table definitions
4. `src/db/index.ts` — Database client instance
5. `src/lib/auth.ts` — Better Auth server configuration
6. `src/lib/auth-client.ts` — Better Auth frontend client SDK
7. `src/app/api/auth/[...all]/route.ts` — Next.js API route handler
8. `src/app/login/page.tsx` — Login page with Google OAuth button
9. `src/app/dashboard/page.tsx` — Protected dashboard page

## Dependencies
- Runtime: `better-auth`, `drizzle-orm`, `postgres`, `dotenv`
- Dev: `drizzle-kit`, `@types/node`, `tsx`
- Next.js 15 (via `create-next-app` with TypeScript, Tailwind, ESLint, App Router, `src/` dir, `@/*` alias)

## Phases

### Phase 1: Scaffolding
- `create-next-app` with specified flags
- `npm install` runtime deps
- `npm install -D` dev deps

### Phase 2: File Creation
- Create all 9 files with exact content from `setup.md`

### Phase 3: Database Sync
- `npx drizzle-kit push`

## Constraints
- Google OAuth only — no email/password, magic links, or password hashing
- No email verification service configuration
- Placeholder values in `.env.local` — user replaces before production
- Every file is complete — no truncated code, no comments like `// ... rest of code`
