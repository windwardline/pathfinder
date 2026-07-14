CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text,
	"actorId" text NOT NULL,
	"eventType" text NOT NULL,
	"resourceType" text NOT NULL,
	"resourceId" text NOT NULL,
	"correlationId" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"factId" uuid NOT NULL,
	"userId" text NOT NULL,
	"eventType" text NOT NULL,
	"actorId" text NOT NULL,
	"reasonCode" text,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_record" (
	"userId" text NOT NULL,
	"operationType" text NOT NULL,
	"idempotencyKey" text NOT NULL,
	"requestHash" text NOT NULL,
	"responseData" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	CONSTRAINT "idempotency_record_userId_operationType_idempotencyKey_pk" PRIMARY KEY("userId","operationType","idempotencyKey")
);
--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "factType" text;--> statement-breakpoint
UPDATE "fact" SET "factType" = COALESCE(("factText"::json ->> 'key'), 'ACTION');--> statement-breakpoint
ALTER TABLE "fact" ALTER COLUMN "factType" SET DEFAULT 'ACTION';--> statement-breakpoint
ALTER TABLE "fact" ALTER COLUMN "factType" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "confirmedAt" timestamp;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "confirmedBy" text;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "supersedesFactId" uuid;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "supersededByFactId" uuid;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "expiresAt" timestamp;--> statement-breakpoint
UPDATE "fact" SET "confirmedAt" = "updatedAt", "confirmedBy" = "userId" WHERE "status" = 'CONFIRMED';--> statement-breakpoint
ALTER TABLE "graph_version" ADD COLUMN "inputSnapshotHash" text;--> statement-breakpoint
UPDATE "graph_version" SET "inputSnapshotHash" = md5("snapshotData"::text || "id"::text);--> statement-breakpoint
ALTER TABLE "graph_version" ALTER COLUMN "inputSnapshotHash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "graph_version" ADD COLUMN "schemaVersion" text DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "graph_version" ADD COLUMN "ruleSetVersion" text DEFAULT 'release-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "graph_version" ADD COLUMN "status" text DEFAULT 'VALID' NOT NULL;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "sourceType" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "sourceReference" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "integrityHash" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "createdBy" text;--> statement-breakpoint
UPDATE "provenance" p
SET "userId" = f."userId",
    "sourceType" = CASE
      WHEN p."source" = 'ai_extraction' THEN 'DOCUMENT_EXTRACTION'
      WHEN p."source" = 'user_correction' THEN 'USER_CORRECTION'
      WHEN p."source" LIKE 'user_%' THEN 'USER_ENTRY'
      ELSE 'SYSTEM_DERIVATION'
    END,
    "sourceReference" = p."source",
    "integrityHash" = md5(f."userId" || p."factId"::text || p."source"),
    "createdBy" = CASE WHEN p."source" LIKE 'user_%' THEN f."userId" ELSE 'pathfinder' END
FROM "fact" f
WHERE p."factId" = f."id";--> statement-breakpoint
ALTER TABLE "provenance" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provenance" ALTER COLUMN "sourceType" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provenance" ALTER COLUMN "sourceReference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provenance" ALTER COLUMN "integrityHash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "provenance" ALTER COLUMN "createdBy" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reroute_event" ADD COLUMN "triggerReference" text;--> statement-breakpoint
ALTER TABLE "reroute_event" ADD COLUMN "differenceData" json DEFAULT '{}'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "routing_snapshot" ADD COLUMN "engineVersion" text DEFAULT 'release-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "routing_snapshot" ADD COLUMN "ruleSetVersion" text DEFAULT 'release-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "routing_snapshot" ADD COLUMN "routeStatus" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "locale" text DEFAULT 'en-US' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "timeZone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fact_event" ADD CONSTRAINT "fact_event_factId_fact_id_fk" FOREIGN KEY ("factId") REFERENCES "public"."fact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_event" ADD CONSTRAINT "fact_event_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_record" ADD CONSTRAINT "idempotency_record_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provenance" ADD CONSTRAINT "provenance_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "graph_version_replay_identity" ON "graph_version" USING btree ("userId","inputSnapshotHash","schemaVersion","ruleSetVersion","sequenceNumber");
