import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error("DIRECT_URL environment variable is required for drizzle-kit");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: directUrl,
  },
});
