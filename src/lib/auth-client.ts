import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseUrl: process.env.BETTER_AUTH_URL,
});
