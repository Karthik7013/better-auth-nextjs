import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteAccount(userId: string, headers: Headers) {
  await auth.api.signOut({ headers });
  await db.delete(user).where(eq(user.id, userId));
  return true;
}
