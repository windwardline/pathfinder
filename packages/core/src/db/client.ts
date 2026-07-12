import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Use standard postgres connection string. For Vercel/GCP, this will be process.env.POSTGRES_URL or DATABASE_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/pathfinder"

// Disable prefetch as it is not supported for "Transaction" pool mode in typical Serverless/PgBouncer setups
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
