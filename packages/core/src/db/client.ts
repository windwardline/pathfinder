import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error(
    "POSTGRES_URL or DATABASE_URL must be set in production. Refusing to fall back to default credentials."
  )
}

// Local development fallback only; production fails fast above.
const resolvedConnectionString =
  connectionString || "postgres://postgres:postgres@localhost:5432/pathfinder"

// Disable prefetch as it is not supported for "Transaction" pool mode in typical Serverless/PgBouncer setups
const client = postgres(resolvedConnectionString, { prepare: false })
export const db = drizzle(client, { schema })
