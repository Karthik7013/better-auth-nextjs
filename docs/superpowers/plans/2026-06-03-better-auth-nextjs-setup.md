# Better Auth + Next.js + Drizzle Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize a blank Next.js app with Google OAuth-only auth using Better Auth, Drizzle ORM, and PostgreSQL.

**Architecture:** Next.js App Router (src/) with Better Auth server engine connected via Drizzle adapter to PostgreSQL. API catch-all route exposes auth endpoints. Client SDK enables browser sign-in. Server component dashboard checks session via headers.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Better Auth, Drizzle ORM, PostgreSQL, `postgres` driver

---

### Task 1: Project Scaffolding

**Files:** (no existing files — creating project from scratch)

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /home/karthi/workspace/better-auth-nextjs
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
Expected: Next.js project scaffolded with `src/` directory, App Router, Tailwind, TypeScript.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install better-auth drizzle-orm postgres dotenv
```
Expected: Packages added to `package.json` `dependencies`.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D drizzle-kit @types/node tsx
```
Expected: Packages added to `package.json` `devDependencies`.

- [ ] **Step 4: Commit scaffolding**

```bash
git add -A && git commit -m "feat: scaffold Next.js project with auth dependencies"
```

---

### Task 2: Environment Configuration

**Files:**
- Create: `.env.local`

- [ ] **Step 1: Create `.env.local`**

```bash
cat > .env.local << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_auth_db"
BETTER_AUTH_SECRET="CHANGE_ME_TO_A_32_CHAR_RANDOM_SECRET_STRING"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_google_oauth_client_secret"
ENVEOF
```

- [ ] **Step 2: Commit**

```bash
git add .env.local && git commit -m "feat: add environment template"
```

---

### Task 3: Drizzle Configuration

**Files:**
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add drizzle.config.ts && git commit -m "feat: add drizzle configuration"
```

---

### Task 4: Database Schema and Client

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`

- [ ] **Step 1: Create `src/db/schema.ts`**

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
```

- [ ] **Step 2: Create `src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
```

- [ ] **Step 3: Commit**

```bash
git add src/db/ && git commit -m "feat: add database schema and client"
```

---

### Task 5: Auth Server and Client Configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`

- [ ] **Step 1: Create `src/lib/auth.ts`**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

- [ ] **Step 2: Create `src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseUrl: process.env.BETTER_AUTH_URL,
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ && git commit -m "feat: add auth server and client configuration"
```

---

### Task 6: API Route Handler

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create API route**

```bash
mkdir -p src/app/api/auth/\[...all\]
```

- [ ] **Step 2: Create `src/app/api/auth/[...all]/route.ts`**

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export { handler as GET, handler as POST };
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ && git commit -m "feat: add auth API route handler"
```

---

### Task 7: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create login page directory**

```bash
mkdir -p src/app/login
```

- [ ] **Step 2: Create `src/app/login/page.tsx`**

```typescript
"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Authentication error occurred:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome Back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to access your dashboard infrastructure
          </p>
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isLoading ? "Connecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/login/ && git commit -m "feat: add login page with Google OAuth"
```

---

### Task 8: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page directory**

```bash
mkdir -p src/app/dashboard
```

- [ ] **Step 2: Create `src/app/dashboard/page.tsx`**

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
            <p className="text-sm text-zinc-500">Secure pipeline session active</p>
          </div>
        </header>

        <main className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
                <Image
                  src={session.user.image}
                  alt={session.user.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {session.user.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {session.user.email}
              </p>
              <div className="mt-2 inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                Verified OAuth Profile
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/ && git commit -m "feat: add protected dashboard page"
```

---

### Task 9: Database Sync and Verify

**Files:** (no new files)

- [ ] **Step 1: Push schema to database**

```bash
npx drizzle-kit push
```
Expected: Tables `user`, `session`, `account` created in PostgreSQL.

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "chore: finalize setup and verify build"
```
