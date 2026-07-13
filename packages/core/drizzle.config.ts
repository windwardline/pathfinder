import { defineConfig } from "drizzle-kit";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "POSTGRES_URL or DATABASE_URL must be set to run drizzle-kit commands."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
