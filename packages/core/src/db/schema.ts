import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  json,
  uuid
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "@auth/core/adapters"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// Pathfinder Domain Models
export const facts = pgTable("fact", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  factText: text("factText").notNull(),
  status: text("status").notNull(), // 'Proposed' | 'Confirmed' | 'Superseded'
  version: integer("version").notNull().default(1),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const provenance = pgTable("provenance", {
  id: uuid("id").primaryKey().defaultRandom(),
  factId: uuid("factId").notNull().references(() => facts.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // e.g. 'user_input', 'ai_extraction'
  confidence: integer("confidence"), 
  derivedFromFactId: uuid("derivedFromFactId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const graphVersions = pgTable("graph_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sequenceNumber: integer("sequenceNumber").notNull(),
  snapshotData: json("snapshotData").notNull(), // serialized graph
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const routingSnapshots = pgTable("routing_snapshot", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  graphVersionId: uuid("graphVersionId").notNull().references(() => graphVersions.id, { onDelete: "cascade" }),
  focusActionId: text("focusActionId"),
  validFrom: timestamp("validFrom").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const rerouteEvents = pgTable("reroute_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousRouteId: uuid("previousRouteId").references(() => routingSnapshots.id),
  newRouteId: uuid("newRouteId").notNull().references(() => routingSnapshots.id),
  triggerReason: text("triggerReason").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
