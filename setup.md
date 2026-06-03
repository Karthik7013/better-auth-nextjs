```markdown
# SYSTEM INSTRUCTION FOR CODING AGENT
You are an expert full-stack developer agent. Your task is to implement a complete, production-ready, zero-hallucination authentication setup in a blank Next.js application using **Better Auth**, **Drizzle ORM**, and **PostgreSQL**. 

### Core Architecture Constraints:
1.  **Authentication Paradigm:** Google OAuth ONLY ("Continue with Google"). 
2.  **Exclusions:** Do NOT include traditional email/password, magic links, or password hashing configurations. No email service verification configuration is required.
3.  **Code Quality:** Provide full, un-truncated file outputs. Do not use placeholders like `// ... rest of code`. Every import, type, and variable must be explicitly written.

---

## Part 1: Shell Commands & Dependencies
Execute these commands to initialize the project and install the exact package ecosystem required:

```bash
# Initialize Next.js app with standard defaults
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core runtime dependencies
npm install better-auth drizzle-orm postgres dotenv

# Install development tool definitions
npm install -D drizzle-kit @types/node tsx

```
## Part 2: File Infrastructure Definition
### 1. Environment Template (.env.local)
Create a .env.local file in the root directory.
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_auth_db"
BETTER_AUTH_SECRET="A_32_CHARACTER_CRYPTOGRAPHICALLY_SECURE_SECRET_STRING_HERE"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_google_oauth_client_secret"

```
### 2. Drizzle Configuration File (drizzle.config.ts)
Create drizzle.config.ts in the root directory.
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
### 3. Database Schema (src/db/schema.ts)
Create src/db/schema.ts defining only the necessary database entities for Google OAuth relational processing.
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
### 4. Database Instance Client (src/db/index.ts)
Create src/db/index.ts to manage pool routing connections.
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });

```
### 5. Better Auth Server Engine Configuration (src/lib/auth.ts)
Create src/lib/auth.ts to wire database schema objects into the Better Auth framework ecosystem.
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
### 6. Better Auth Frontend Client SDK (src/lib/auth-client.ts)
Create src/lib/auth-client.ts.
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseUrl: process.env.BETTER_AUTH_URL,
});

```
### 7. API Wildcard Route Engine Handler (src/app/api/auth/[...all]/route.ts)
Create src/app/api/auth/[...all]/route.ts to expose internal verification endpoints to external browser consumers.
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export { handler as GET, handler as POST };

```
### 8. OAuth Login Page Surface (src/app/login/page.tsx)
Create src/app/login/page.tsx. Use standard Tailwind classes to render a single core action trigger.
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
### 9. Secure Server Component Layout (src/app/dashboard/page.tsx)
Create src/app/dashboard/page.tsx to handle secure server validation checks via processing requests headers instantly.
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
## Part 3: Database Synchronization Verification
After establishing the files above, execute this final step to map schemas straight into your target environment:
```bash
npx drizzle-kit push

```
