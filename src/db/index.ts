import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const client = postgres(connectionString, {
  max: 3,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
