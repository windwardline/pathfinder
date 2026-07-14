import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  json,
  uuid,
  uniqueIndex,
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
  status: text("status").notNull().default("ACTIVE"),
  locale: text("locale").notNull().default("en-US"),
  timeZone: text("timeZone").notNull().default("UTC"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
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
  factType: text("factType").notNull().default("ACTION"),
  provenanceId: uuid("provenanceId"),
  status: text("status").notNull(),
  version: integer("version").notNull().default(1),
  confirmedAt: timestamp("confirmedAt", { mode: "date" }),
  confirmedBy: text("confirmedBy"),
  supersedesFactId: uuid("supersedesFactId"),
  supersededByFactId: uuid("supersededByFactId"),
  expiresAt: timestamp("expiresAt", { mode: "date" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const provenance = pgTable("provenance", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  factId: uuid("factId").references(() => facts.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  sourceType: text("sourceType").notNull(),
  sourceReference: text("sourceReference").notNull(),
  integrityHash: text("integrityHash").notNull(),
  createdBy: text("createdBy").notNull(),
  documentId: uuid("documentId"),
  pageReference: text("pageReference"),
  sectionReference: text("sectionReference"),
  ruleId: uuid("ruleId"),
  extractionMetadata: json("extractionMetadata"),
  retentionPolicy: text("retentionPolicy"),
  status: text("status").notNull().default("PUBLISHED"),
  confidence: integer("confidence"), 
  derivedFromFactId: uuid("derivedFromFactId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const factEvents = pgTable("fact_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  factId: uuid("factId").notNull().references(() => facts.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("eventType").notNull(),
  actorId: text("actorId").notNull(),
  reasonCode: text("reasonCode"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const graphVersions = pgTable("graph_version", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sequenceNumber: integer("sequenceNumber").notNull(),
  inputSnapshotHash: text("inputSnapshotHash").notNull(),
  schemaVersion: text("schemaVersion").notNull().default("1"),
  ruleSetVersion: text("ruleSetVersion").notNull().default("release-1"),
  status: text("status").notNull().default("VALID"),
  snapshotData: json("snapshotData").notNull(), // serialized graph
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, table => [
  uniqueIndex("graph_version_replay_identity").on(
    table.userId,
    table.inputSnapshotHash,
    table.schemaVersion,
    table.ruleSetVersion,
    table.sequenceNumber
  ),
]);

export const routingSnapshots = pgTable("routing_snapshot", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  graphVersionId: uuid("graphVersionId").notNull().references(() => graphVersions.id, { onDelete: "cascade" }),
  focusActionId: text("focusActionId"),
  engineVersion: text("engineVersion").notNull().default("release-1"),
  ruleSetVersion: text("ruleSetVersion").notNull().default("release-1"),
  routeStatus: text("routeStatus").notNull().default("ACTIVE"),
  validFrom: timestamp("validFrom").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const rerouteEvents = pgTable("reroute_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousRouteId: uuid("previousRouteId").references(() => routingSnapshots.id),
  newRouteId: uuid("newRouteId").notNull().references(() => routingSnapshots.id),
  triggerReason: text("triggerReason").notNull(),
  triggerReference: text("triggerReference"),
  differenceData: json("differenceData").notNull().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

/** Shared fixed-window API limiter; safe across serverless instances. */
export const apiRateLimits = pgTable("api_rate_limit", {
  key: text("key").primaryKey(),
  windowStart: timestamp("windowStart", { mode: "date" }).notNull(),
  count: integer("count").notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const idempotencyRecords = pgTable(
  "idempotency_record",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    operationType: text("operationType").notNull(),
    idempotencyKey: text("idempotencyKey").notNull(),
    requestHash: text("requestHash").notNull(),
    responseData: json("responseData").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
  },
  table => [
    primaryKey({ columns: [table.userId, table.operationType, table.idempotencyKey] }),
  ]
);

export const auditEvents = pgTable("audit_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId"),
  actorId: text("actorId").notNull(),
  eventType: text("eventType").notNull(),
  resourceType: text("resourceType").notNull(),
  resourceId: text("resourceId").notNull(),
  correlationId: text("correlationId").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});
