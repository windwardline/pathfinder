import { defineConfig } from "drizzle-kit";

// Schema migrations require a direct connection. Vercel's Neon integration
// exposes an unpooled URL for this purpose; local development falls back to
// the ordinary application URL.
const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "A Postgres connection URL must be set to run drizzle-kit commands."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
