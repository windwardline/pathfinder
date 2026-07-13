import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

// Fail closed: the localhost fallback exists only for explicit local
// development/test — and for Next's build-time module evaluation, which
// constructs but never queries this client (postgres() opens no connection
// until the first query).
const isLocalEnv =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

if (!connectionString && !isLocalEnv && !isBuildPhase) {
  throw new Error(
    "POSTGRES_URL or DATABASE_URL must be set. Refusing to fall back to default credentials outside local development."
  )
}

const resolvedConnectionString =
  connectionString || "postgres://postgres:postgres@localhost:5432/pathfinder"

// Disable prefetch as it is not supported for "Transaction" pool mode in
// typical serverless/PgBouncer setups.
const client = postgres(resolvedConnectionString, { prepare: false })
export const db = drizzle(client, { schema })
